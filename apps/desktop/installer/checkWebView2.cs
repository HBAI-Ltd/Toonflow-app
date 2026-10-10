using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;

internal static class checkWebView2
{
    // ACT: URL.canParse 需要 Chromium 120；同时覆盖 Map.groupBy 和 Promise.withResolvers。
    private static readonly Version minimumVersion = new Version(120, 0, 0, 0);
    private static volatile string stage = "version";
    private static string runtimeVersion = "<none>";
    private static string userDataFolder = "<none>";
    private static string account = "<unknown>";
    private static bool elevated;

    [DllImport("WebView2Loader.dll", EntryPoint = "GetAvailableCoreWebView2BrowserVersionString",
        CharSet = CharSet.Unicode,
        ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    private static extern int getAvailableVersion(string browserExecutableFolder, out IntPtr versionInfo);

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
            {
                account = identity.Name;
                elevated = new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
            }
            if (args.Length == 1 && (args[0] == "--repair" || args[0] == "--repair-info"))
                return repairRuntime(args[0] == "--repair-info");
            if (args.Length > 1 || (args.Length == 1 && args[0] != "--version-only"))
            {
                log("Unsupported arguments", 0);
                return 2;
            }

            int versionResult = checkVersion();
            if (versionResult != 0 || args.Length == 1) return versionResult;

            stage = "temporaryProfile";
            userDataFolder = Path.Combine(Path.GetTempPath(), "toonflowWebView2-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(userDataFolder);
            // 仅覆盖本检测进程，避免全局环境变量让探测误用用户的真实浏览器目录。
            Environment.SetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER", userDataFolder);
            stage = "window";
            int result = 2;
            // ACT: 独立线程覆盖 UI 消息循环本身卡死；超时不能证明 Runtime 文件损坏。
            using (var watchdog = new System.Threading.Timer(delegate
            {
                log("Startup probe timed out after 30 seconds", unchecked((int)0x800705B4));
                Environment.Exit(5);
            }, null, 30000, System.Threading.Timeout.Infinite))
            using (var form = new Form())
            {
                form.ShowInTaskbar = false;
                form.ClientSize = new Size(16, 16);
                IntPtr window = form.Handle;
                form.BeginInvoke(new Action(async delegate
                {
                    result = await probeRuntime(form, watchdog);
                    Application.ExitThread();
                }));
                Application.Run();
            }
            return result;
        }
        catch (Exception error)
        {
            log(error.GetType().Name + ": " + error.Message, error.HResult);
            return 2;
        }
    }

    private static int checkVersion()
    {
        IntPtr versionInfo = IntPtr.Zero;
        try
        {
            int result = getAvailableVersion(null, out versionInfo);
            runtimeVersion = versionInfo == IntPtr.Zero ? "<none>" : Marshal.PtrToStringUni(versionInfo);
            Version installedVersion;
            if (result < 0 || !Version.TryParse(runtimeVersion, out installedVersion)
                || installedVersion <= new Version(0, 0, 0, 0))
            {
                log("Runtime unavailable; required>=" + minimumVersion, result);
                return 1;
            }
            if (installedVersion < minimumVersion)
            {
                log("Runtime outdated; required>=" + minimumVersion, 0);
                return 3;
            }
            log("Runtime version available", 0);
            return 0;
        }
        finally
        {
            if (versionInfo != IntPtr.Zero) Marshal.FreeCoTaskMem(versionInfo);
        }
    }

    private static async Task<int> probeRuntime(Form form, System.Threading.Timer watchdog)
    {
        CoreWebView2Controller controller = null;
        CoreWebView2Environment environment = null;
        var browserExited = new TaskCompletionSource<bool>();
        int result;
        try
        {
            // ACT: 独立临时用户目录只验证内核启动，不代表 Toonflow 实际用户目录一定健康。
            stage = "environment";
            environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            environment.BrowserProcessExited += delegate { browserExited.TrySetResult(true); };
            runtimeVersion = environment.BrowserVersionString;
            Version activeVersion;
            if (!Version.TryParse(runtimeVersion, out activeVersion) || activeVersion < minimumVersion)
                throw new NotSupportedException("Created Runtime does not meet minimum version " + minimumVersion);
            stage = "profileIsolation";
            if (!String.Equals(Path.GetFullPath(environment.UserDataFolder).TrimEnd('\\'), userDataFolder, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Runtime redirected the isolated profile; probe stopped");
            stage = "controller";
            controller = await environment.CreateCoreWebView2ControllerAsync(form.Handle);
            controller.Bounds = new Rectangle(0, 0, 16, 16);
            controller.IsVisible = false;
            CoreWebView2 webView = controller.CoreWebView2;
            var completion = new TaskCompletionSource<int>();
            string nonce = Guid.NewGuid().ToString("N");
            bool navigationCompleted = false;
            bool scriptCompleted = false;
            webView.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs eventArgs)
            {
                if (!eventArgs.IsSuccess)
                {
                    log("Local navigation failed: " + eventArgs.WebErrorStatus, 0);
                    completion.TrySetResult(4);
                    return;
                }
                navigationCompleted = true;
                if (scriptCompleted) completion.TrySetResult(0);
            };
            webView.WebMessageReceived += delegate(object sender, CoreWebView2WebMessageReceivedEventArgs eventArgs)
            {
                try
                {
                    if (eventArgs.TryGetWebMessageAsString() != nonce) return;
                    scriptCompleted = true;
                    if (navigationCompleted) completion.TrySetResult(0);
                }
                catch (Exception error)
                {
                    log("Script response failed: " + error.Message, error.HResult);
                    completion.TrySetResult(4);
                }
            };
            webView.ProcessFailed += delegate(object sender, CoreWebView2ProcessFailedEventArgs eventArgs)
            {
                log("WebView2 process failed: " + eventArgs.ProcessFailedKind, 0);
                completion.TrySetResult(4);
            };
            stage = "navigationAndScript";
            webView.NavigateToString("<!doctype html><meta charset=\"utf-8\"><script>window.chrome.webview.postMessage(\"" + nonce + "\");</script>");
            result = await completion.Task;
            if (result == 0) log("Runtime startup, local navigation and JavaScript passed", 0);
        }
        catch (Exception error)
        {
            log(error.GetType().Name + ": " + error.Message, error.HResult);
            result = stage == "profileIsolation" ? 2 : 4;
        }
        watchdog.Change(System.Threading.Timeout.Infinite, System.Threading.Timeout.Infinite);
        stage = "cleanup";
        try
        {
            if (controller != null) controller.Close();
            // 不终止共享 Runtime 进程；浏览器未确认退出时保留本次临时目录。
            if (environment != null)
            {
                await Task.WhenAny(browserExited.Task, Task.Delay(3000));
                if (browserExited.Task.IsCompleted && Directory.Exists(userDataFolder)
                    && (File.GetAttributes(userDataFolder) & FileAttributes.ReparsePoint) == 0)
                    Directory.Delete(userDataFolder, true);
                else if (Directory.Exists(userDataFolder)) log("Temporary profile retained: browser exit not confirmed", 0);
            }
        }
        catch (Exception error)
        {
            log("Temporary profile retained: " + error.Message, error.HResult);
        }
        return result;
    }

    private static int repairRuntime(bool infoOnly)
    {
        stage = "repairDiscovery";
        try { checkVersion(); }
        catch (Exception error) { log("Version unavailable during repair discovery: " + error.Message, error.HResult); }
        string repairPath = null;
        string repairArguments = null;
        bool machineScope = false;
        bool matchedVersion = false;
        bool policyBlocked = false;
        foreach (RegistryHive hive in new[] { RegistryHive.LocalMachine, RegistryHive.CurrentUser })
        {
            using (RegistryKey root = RegistryKey.OpenBaseKey(hive, RegistryView.Registry32))
            using (RegistryKey key = root.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Microsoft EdgeWebView"))
            {
                if (key == null) continue;
                bool matches = String.Equals(key.GetValue("DisplayVersion") as string, runtimeVersion, StringComparison.OrdinalIgnoreCase);
                if (repairPath != null && (!matches || matchedVersion)) continue;
                // ACT: NoRepair 只隐藏独立 Repair 按钮；微软的 ModifyPath 仍提供在线修复。
                if (Convert.ToString(key.GetValue("NoModify")) == "1")
                {
                    policyBlocked = true;
                    log("Runtime repair disabled by registered policy: " + hive, 0);
                    if (matches) return 2;
                    continue;
                }
                string command = key.GetValue("ModifyPath") as string;
                if (String.IsNullOrWhiteSpace(command)) continue;
                Match parsed = Regex.Match(command, "^\"([^\"]+)\" (/install appguid=\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5\\}&appname=Microsoft%20Edge%20WebView&needsadmin=(true|false)&repairtype=windowsonlinerepair /installsource [a-zA-Z0-9]+)$", RegexOptions.IgnoreCase);
                bool isMachine = hive == RegistryHive.LocalMachine;
                string expectedPath = Path.Combine(Environment.GetFolderPath(isMachine ? Environment.SpecialFolder.ProgramFilesX86 : Environment.SpecialFolder.LocalApplicationData), @"Microsoft\EdgeUpdate\MicrosoftEdgeUpdate.exe");
                if (!parsed.Success || !Path.IsPathRooted(parsed.Groups[1].Value)
                    || !String.Equals(Path.GetFullPath(parsed.Groups[1].Value), expectedPath, StringComparison.OrdinalIgnoreCase)
                    || parsed.Groups[3].Value != (isMachine ? "true" : "false"))
                {
                    log("Unsupported registered repair command: " + hive, 0);
                    continue;
                }
                repairPath = expectedPath;
                repairArguments = parsed.Groups[2].Value;
                machineScope = isMachine;
                matchedVersion = matches;
            }
        }
        if (repairPath == null)
        {
            log("No supported registered repair entry", 0);
            return policyBlocked ? 2 : 1;
        }
        stage = "repairSignature";
        Console.WriteLine("Repair scope=" + (machineScope ? "machine" : "user") + "; path=" + repairPath + "; arguments=" + repairArguments);
        if (!File.Exists(repairPath))
        {
            log("Registered repair executable is missing", 0);
            return 1;
        }
        if (!machineScope && elevated)
        {
            log("User-scope repair must run without administrator elevation", 0);
            return 2;
        }
        // 路径作为 PowerShell 单引号字面量编码；不把注册表命令交给 shell 解析。
        string signatureScript = "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue'; Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1'); $signature = Get-AuthenticodeSignature -LiteralPath '" + repairPath.Replace("'", "''") + "'; if ($signature.Status -eq 'Valid' -and $signature.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false) -eq 'Microsoft Corporation') { Write-Output 'Microsoft signature valid'; exit 0 }; Write-Output ('Signature rejected: ' + $signature.Status); exit 1";
        var signatureStart = new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe"), "-NoLogo -NoProfile -NonInteractive -OutputFormat Text -EncodedCommand " + Convert.ToBase64String(Encoding.Unicode.GetBytes(signatureScript)));
        signatureStart.UseShellExecute = false;
        signatureStart.CreateNoWindow = true;
        signatureStart.RedirectStandardOutput = true;
        signatureStart.RedirectStandardError = true;
        using (Process signatureProcess = Process.Start(signatureStart))
        {
            if (!signatureProcess.WaitForExit(20000))
            {
                signatureProcess.Kill();
                log("Microsoft signature verification timed out", 0);
                return 2;
            }
            Console.WriteLine(signatureProcess.StandardOutput.ReadToEnd().Trim());
            if (signatureProcess.ExitCode != 0)
            {
                string signatureError = signatureProcess.StandardError.ReadToEnd().Trim();
                if (signatureError.Length > 300) signatureError = signatureError.Substring(0, 300);
                log("Microsoft signature verification failed: " + signatureError, 0);
                return 2;
            }
        }
        if (infoOnly)
        {
            log("Supported Microsoft repair entry verified; no repair started", 0);
            return 0;
        }
        stage = "repairExecution";
        var repairStart = new ProcessStartInfo(repairPath, repairArguments);
        repairStart.UseShellExecute = true;
        if (machineScope && !elevated) repairStart.Verb = "runas";
        using (Process repairProcess = Process.Start(repairStart))
        {
            if (repairProcess == null) throw new InvalidOperationException("Microsoft repair process handle unavailable");
            repairProcess.WaitForExit();
            log("Microsoft repair process exited: " + repairProcess.ExitCode + "; run a new startup probe to verify", 0);
        }
        return 0;
    }

    private static void log(string message, int hresult)
    {
        Console.WriteLine("WebView2 " + message + "; stage=" + stage + "; HRESULT=0x" + hresult.ToString("X8")
            + "; version=" + runtimeVersion + "; account=" + account + "; elevated=" + elevated + "; profile=" + userDataFolder);
    }
}
