using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

internal static class updateHelper
{
    private static readonly JavaScriptSerializer serializer = new JavaScriptSerializer();
    private static readonly UTF8Encoding utf8 = new UTF8Encoding(false, true);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    private static extern uint GetPrivateProfileString(string section, string key, string fallback, StringBuilder value, uint size, string path);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateDirectoryW(string path, IntPtr securityAttributes);

    [STAThread]
    private static int Main(string[] args)
    {
        string root = null, transaction = null, version = null, hash = null, planPath = null;
        bool quiet = Array.IndexOf(args, "--quiet") >= 0;
        Mutex mutex = null;
        bool locked = false;
        try
        {
            if (args.Length < 2 || args.Length > 3 || (args[0] != "--apply-update" && args[0] != "--spawn-update" && args[0] != "--apply-scheduled-update") || (args.Length == 3 && args[2] != "--quiet"))
                throw new InvalidOperationException("更新助手参数无效。");
            planPath = fullPath(args[1]);
            ensurePlainPath(planPath);
            if (args[0] == "--spawn-update")
            {
                spawnScheduledUpdate(Process.GetCurrentProcess().MainModule.FileName, planPath, quiet);
                return 0;
            }
            if (args[0] == "--apply-scheduled-update") scheduledTaskFolder().DeleteTask(scheduledTaskName(planPath), 0);
            var plan = readJson(planPath);
            if (plan.Count != 9 || number(plan, "schemaVersion") != 1)
                throw new InvalidOperationException("更新计划格式不受支持。");
            transaction = matching(plan, "transactionId", "^[a-fA-F0-9]{32}$");
            string candidate = fullPath(text(plan, "installDirectory"));
            string cache = Path.Combine(candidate, "self-extraction");
            if (!samePath(planPath, Path.Combine(cache, "update-" + transaction + ".json")))
                throw new InvalidOperationException("更新计划不属于此安装目录。");
            ensurePlainPath(candidate);
            ensurePlainPath(Path.Combine(candidate, "app"));
            ensurePlainPath(cache);
            if (!Directory.Exists(cache) || !Directory.Exists(Path.Combine(candidate, "app")))
                throw new InvalidOperationException("安装目录不完整。");
            string identifier = text(plan, "identifier");
            string channel = text(plan, "channel");
            if (identifier != "local.toonflow.desktop" || (channel != "stable" && channel != "canary"))
                throw new InvalidOperationException("更新计划的应用标识或通道无效。");
            version = matching(plan, "version", "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*)?(\\+[0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*)?$");
            hash = matching(plan, "hash", "^[a-zA-Z0-9]{1,128}$");
            if (Regex.IsMatch(hash, "^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$", RegexOptions.IgnoreCase))
                throw new InvalidOperationException("更新 hash 不能是 Windows 设备名称。");
            string expectedDigest = matching(plan, "archiveSha256", "^[a-fA-F0-9]{64}$");
            var oldInfo = verifyApp(Path.Combine(candidate, "app"), identifier, channel, null, null);
            string mutexName;
            using (var sha = SHA256.Create()) mutexName = BitConverter.ToString(sha.ComputeHash(utf8.GetBytes(candidate.ToUpperInvariant()))).Replace("-", "");
            mutex = new Mutex(false, "Local\\ToonflowUpdate-" + mutexName);
            try { locked = mutex.WaitOne(0); }
            catch (AbandonedMutexException) { locked = true; }
            if (!locked) throw new InvalidOperationException("当前安装正在执行另一个更新。");
            root = candidate;
            string archive = Path.Combine(cache, hash + ".tar");
            ensurePlainPath(archive);
            string stage = Path.Combine(cache, "stage-" + transaction);
            string backup = Path.Combine(cache, "appPrevious-" + transaction);
            if (Directory.Exists(stage) || File.Exists(stage) || Directory.Exists(backup) || File.Exists(backup))
                throw new InvalidOperationException("此更新事务已执行，请重新准备更新。");
            int parentPid = number(plan, "parentPid");
            if (parentPid <= 0 || parentPid == Process.GetCurrentProcess().Id)
                throw new InvalidOperationException("更新父进程无效。");
            using (var parent = Process.GetProcessById(parentPid))
            using (var archiveStream = new FileStream(archive, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                // 保持句柄，避免 PID 复用；仅等待当前安装的宿主，不终止其他进程。
                IntPtr parentHandle = parent.Handle;
                string parentPath = parent.MainModule.FileName;
                if (parent.HasExited || (!inside(parentPath, Path.Combine(root, "app", "bin"))
                    && !samePath(parentPath, Path.Combine(root, "app", "Resources", "app", "startupLauncher.exe"))))
                    throw new InvalidOperationException("父进程不属于当前 Toonflow 安装。");
                using (var sha = SHA256.Create())
                    if (!String.Equals(BitConverter.ToString(sha.ComputeHash(archiveStream)).Replace("-", ""), expectedDigest, StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException("更新包 SHA-256 校验失败。");
                archiveStream.Position = 0;
                validateTar(archiveStream);
                string tar = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), Environment.Is64BitOperatingSystem && !Environment.Is64BitProcess ? "Sysnative" : "System32", "tar.exe");
                if (!File.Exists(tar)) throw new FileNotFoundException("未找到 Windows 系统 tar.exe。");
                if (!CreateDirectoryW(stage, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法创建独立的更新暂存目录。");
                ensurePlainPath(stage);
                extract(tar, archive, stage);
                ensurePlainTree(stage);
                verifyApp(stage, identifier, channel, version, hash);
                if (!File.Exists(planPath)) throw new InvalidOperationException("更新已取消。");
                long quitDeadline = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds + 60000;
                writeFile(Path.Combine(cache, "update-" + transaction + ".ready"), serializer.Serialize(new { transactionId = transaction, helperPid = Process.GetCurrentProcess().Id, quitDeadline = quitDeadline }));
                var timer = Stopwatch.StartNew();
                while (!parent.WaitForExit(250))
                {
                    if (!File.Exists(planPath)) throw new InvalidOperationException("更新已取消。");
                    if (timer.Elapsed.TotalSeconds >= 60) throw new InvalidOperationException("Toonflow 未在 60 秒内退出，更新已取消。");
                }
                if (!File.Exists(planPath)) throw new InvalidOperationException("更新已取消。");
                ensurePlainPath(root);
                ensurePlainPath(Path.Combine(root, "app"));
                ensurePlainPath(cache);
                apply(root, stage, backup, oldInfo, identifier, channel, version, transaction, hash);
            }
            writeResult(root, transaction, true, null, version, hash);
            return 0;
        }
        catch (Exception error)
        {
            if (root != null)
            {
                // 只有归属校验完成且持有安装锁的事务能撤销交接；结果写入失败也不能留下可退出的旧标记。
                foreach (string path in new[] { Path.Combine(root, "self-extraction", "update-" + transaction + ".ready"), planPath })
                {
                    try { File.Delete(path); }
                    catch (Exception cleanupError) { error = new Exception(error.Message + "\n取消更新交接文件失败：" + path + "：" + cleanupError.Message, error); }
                }
                try { writeResult(root, transaction, false, error.Message, version, hash); }
                catch (Exception stateError) { error = new Exception(error.Message + "\n更新结果无法写入：" + stateError.Message); }
            }
            Console.Error.WriteLine(error.Message);
            if (!quiet) MessageBox.Show(error.Message, "Toonflow 更新失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        finally
        {
            if (locked) mutex.ReleaseMutex();
            if (mutex != null) mutex.Dispose();
        }
    }

    private static string scheduledTaskName(string planPath)
    {
        string name = Path.GetFileNameWithoutExtension(planPath);
        if (!Regex.IsMatch(name, "^update-[a-fA-F0-9]{32}$")) throw new InvalidOperationException("更新计划文件名无效。");
        return "ToonflowUpdate_" + name.Substring(7).ToLowerInvariant();
    }

    private static dynamic scheduledTaskFolder()
    {
        dynamic scheduler = Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service", true));
        scheduler.Connect();
        return scheduler.GetFolder("\\");
    }

    private static void spawnScheduledUpdate(string executable, string planPath, bool quiet)
    {
        // ACT: breakaway 成功仍可能留在外层 Job，统一由当前用户的任务服务启动；不提权、不设置触发器，启动后删除任务。
        string taskName = scheduledTaskName(planPath);
        dynamic scheduler = Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service", true));
        scheduler.Connect();
        dynamic folder = scheduler.GetFolder("\\");
        dynamic task = scheduler.NewTask(0);
        task.Principal.UserId = WindowsIdentity.GetCurrent().User.Value;
        task.Principal.LogonType = 3; // TASK_LOGON_INTERACTIVE_TOKEN
        task.Principal.RunLevel = 0; // TASK_RUNLEVEL_LUA
        task.Settings.AllowDemandStart = true;
        task.Settings.DisallowStartIfOnBatteries = false;
        task.Settings.StopIfGoingOnBatteries = false;
        task.Settings.ExecutionTimeLimit = "PT15M";
        task.Settings.Hidden = true;
        dynamic action = task.Actions.Create(0);
        action.Path = executable;
        action.Arguments = "--apply-scheduled-update " + quote(planPath) + (quiet ? " --quiet" : "");
        action.WorkingDirectory = Path.GetDirectoryName(executable);
        bool created = false;
        try
        {
            dynamic registered = folder.RegisterTaskDefinition(taskName, task, 2, task.Principal.UserId, null, 3, null);
            created = true;
            registered.Run(null);
        }
        catch (Exception error)
        {
            if (created)
            {
                try { folder.DeleteTask(taskName, 0); }
                catch (COMException cleanupError)
                {
                    if (cleanupError.ErrorCode != unchecked((int)0x80070002))
                        throw new InvalidOperationException(error.Message + "\n更新任务清理失败：" + cleanupError.Message, error);
                }
            }
            throw new InvalidOperationException("无法通过当前用户的任务服务启动更新助手：" + error.Message, error);
        }
    }

    private static void moveDirectory(string source, string destination)
    {
        var timer = Stopwatch.StartNew();
        while (true)
        {
            try { Directory.Move(source, destination); return; }
            catch (Exception error)
            {
                int code = error.HResult & 0xffff;
                // ACT: Windows 退出后的短暂占用只等待 10 秒；权限配置错误或持续占用仍交给事务回滚。
                if (!(error is IOException || error is UnauthorizedAccessException) || (code != 5 && code != 32 && code != 33)
                    || timer.Elapsed.TotalSeconds >= 10) throw;
                Thread.Sleep(200);
            }
        }
    }

    private static void apply(string root, string stage, string backup, Dictionary<string, object> oldInfo, string identifier, string channel, string version, string transaction, string hash)
    {
        string app = Path.Combine(root, "app");
        bool originalMoved = false, moved = false;
        Process launched = null;
        try
        {
            moveDirectory(app, backup);
            originalMoved = true;
            moveDirectory(stage, app);
            moved = true;
            restoreRegistration(root, identifier, channel, version);
            startApp(root, transaction, version, hash, out launched);
        }
        catch (Exception error)
        {
            string registrationError = "";
            try
            {
                if (launched != null) stopApp(launched);
                if (originalMoved)
                {
                    if (moved) moveDirectory(app, stage);
                    moveDirectory(backup, app);
                }
                // 已恢复的旧程序应照常启动，安装登记写入失败单独保留诊断。
                try { restoreRegistration(root, identifier, channel, text(oldInfo, "version")); }
                catch (Exception restoreError) { registrationError = "\n安装登记恢复未完成：" + restoreError.Message; }
                Process previous = null;
                try { startApp(root, null, null, null, out previous); }
                finally { if (previous != null) previous.Dispose(); }
            }
            catch (Exception rollbackError)
            {
                throw new InvalidOperationException(error.Message + registrationError + "\n自动恢复未完成：" + rollbackError.Message
                    + "\n保留的应用目录：" + (Directory.Exists(backup) ? backup : app), error);
            }
            throw new InvalidOperationException(error.Message + registrationError + "\n已恢复旧版本。", error);
        }
        finally { if (launched != null) launched.Dispose(); }
    }

    private static void startApp(string root, string transaction, string version, string hash, out Process process)
    {
        process = null;
        string bin = Path.Combine(root, "app", "bin");
        string launcher = Path.Combine(root, "app", "Resources", "app", "startupLauncher.exe");
        if (!File.Exists(launcher)) launcher = Path.Combine(bin, "launcher.exe");
        ensurePlainPath(launcher);
        string startedPath = transaction == null ? null : Path.Combine(root, "self-extraction", "update-" + transaction + ".started.json");
        if (startedPath != null)
        {
            ensurePlainPath(startedPath);
            if (File.Exists(startedPath)) throw new InvalidOperationException("此更新事务已存在启动结果，请重新准备更新。");
        }
        var options = new ProcessStartInfo(launcher)
        {
            WorkingDirectory = bin,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Normal
        };
        options.EnvironmentVariables.Remove("TOONFLOW_UPDATE_TRANSACTION");
        if (transaction != null) options.EnvironmentVariables["TOONFLOW_UPDATE_TRANSACTION"] = transaction;
        process = Process.Start(options);
        if (process == null) throw new InvalidOperationException("更新后无法启动 Toonflow。");
        // 在应用确认就绪或清理完成前保持句柄，不能用进程名称定位本次启动。
        IntPtr handle = process.Handle;
        if (transaction == null)
        {
            // ACT: 回滚版本可能尚不支持就绪协议，保留旧启动器的短暂退出检查。
            if (process.WaitForExit(1000) && process.ExitCode != 0) throw new InvalidOperationException("恢复旧版本后无法启动 Toonflow。");
            return;
        }
        var timer = Stopwatch.StartNew();
        while (true)
        {
            if (process.HasExited) throw new InvalidOperationException("新版本在界面就绪前退出，退出码：" + process.ExitCode + "。");
            if (File.Exists(startedPath))
            {
                ensurePlainPath(startedPath);
                var result = readJson(startedPath);
                object success;
                if (text(result, "transactionId") != transaction || text(result, "version") != version || text(result, "hash") != hash
                    || !result.TryGetValue("success", out success) || !(success is bool))
                    throw new InvalidOperationException("新版本启动结果与当前更新事务不一致。");
                if (!(bool)success) throw new InvalidOperationException("新版本界面启动失败。");
                if (process.HasExited) throw new InvalidOperationException("新版本在界面就绪前退出，退出码：" + process.ExitCode + "。");
                return;
            }
            if (timer.Elapsed.TotalSeconds >= 120) throw new InvalidOperationException("新版本未在 120 秒内完成界面启动。");
            Thread.Sleep(100);
        }
    }

    private static void stopApp(Process process)
    {
        // ACT: 仅终止本次启动的进程树；已退出时的残余占用交由有界 Move 失败保护备份，不按名称终止其他实例。
        if (!process.HasExited)
        {
            string taskkill = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "System32", "taskkill.exe");
            using (var stop = Process.Start(new ProcessStartInfo(taskkill, "/PID " + process.Id + " /T /F")
            {
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            }))
            {
                if (stop == null) throw new InvalidOperationException("无法停止本次启动的新版本，已保留应用备份。");
                if (!stop.WaitForExit(15000))
                {
                    stop.Kill();
                    stop.WaitForExit();
                    throw new InvalidOperationException("停止新版本超时，已保留应用备份。");
                }
                if (stop.ExitCode != 0 && !process.HasExited) throw new InvalidOperationException("无法停止本次启动的新版本，已保留应用备份。");
            }
        }
        if (!process.WaitForExit(10000)) throw new InvalidOperationException("新版本仍未退出，已保留应用备份。");
    }

    private static void extract(string tar, string archive, string stage)
    {
        using (var process = Process.Start(new ProcessStartInfo(tar, "-xf " + quote(archive) + " -C " + quote(stage) + " --strip-components=1")
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            WindowStyle = ProcessWindowStyle.Hidden
        }))
        {
            string error = process.StandardError.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0) throw new InvalidOperationException("更新包解压失败：" + error);
        }
    }

    private static Dictionary<string, object> verifyApp(string app, string identifier, string channel, string version, string hash)
    {
        string path = Path.Combine(app, "Resources", "version.json");
        ensurePlainPath(path);
        ensurePlainPath(Path.Combine(app, "bin", "launcher.exe"));
        if (!File.Exists(Path.Combine(app, "bin", "launcher.exe"))) throw new FileNotFoundException("应用启动文件缺失。");
        var info = readJson(path);
        if (text(info, "identifier") != identifier || text(info, "channel") != channel
            || (version != null && text(info, "version") != version) || (hash != null && text(info, "hash") != hash))
            throw new InvalidOperationException("应用包的标识、通道或版本与更新计划不一致。");
        return info;
    }

    private static void restoreRegistration(string root, string identifier, string channel, string version)
    {
        string uninstaller = Path.Combine(root, "UninstallNSIS.exe");
        if (!File.Exists(uninstaller)) return;
        ensurePlainPath(uninstaller);
        string ini = Path.Combine(root, "toonflow.ini");
        ensurePlainPath(ini);
        var oldDirectory = new StringBuilder(32768);
        GetPrivateProfileString("application", "installDirectory", "", oldDirectory, (uint)oldDirectory.Capacity, ini);
        string registryPath = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + identifier + "." + channel;
        using (var registry = Registry.CurrentUser.OpenSubKey(registryPath))
        {
            if (registry != null)
            {
                string registered = registry.GetValue("toonflowInstallDirectory") as string ?? registry.GetValue("InstallLocation") as string;
                if (!String.IsNullOrEmpty(registered) && !samePath(registered, root) && !samePath(registered, Path.Combine(root, "app"))
                    && (oldDirectory.Length == 0 || !samePath(registered, oldDirectory.ToString())))
                {
                    writeFile(ini, "[application]\r\nidentifier=" + identifier + "\r\ninstallDirectory=" + root + "\r\n");
                    return;
                }
            }
        }
        writeFile(ini, "[application]\r\nidentifier=" + identifier + "\r\ninstallDirectory=" + root + "\r\n");
        using (var registry = Registry.CurrentUser.CreateSubKey(registryPath))
        {
            registry.SetValue("toonflowInstallDirectory", root);
            registry.SetValue("InstallLocation", root);
            registry.SetValue("DisplayName", "Toonflow");
            registry.SetValue("DisplayVersion", version);
            registry.SetValue("DisplayIcon", Path.Combine(root, "app", "Resources", "app.ico"));
            registry.SetValue("UninstallString", quote(uninstaller));
            registry.SetValue("QuietUninstallString", quote(uninstaller) + " /S");
        }
    }

    private static void validateTar(Stream stream)
    {
        byte[] header = new byte[512];
        var entries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        string rootName = null, nextName = null;
        bool pending = false;
        while (stream.Position + 512 <= stream.Length)
        {
            readExactly(stream, header);
            bool empty = Array.TrueForAll(header, value => value == 0);
            if (empty)
            {
                if (pending || rootName == null || stream.Position + 512 > stream.Length)
                    throw new InvalidOperationException("更新 TAR 结束标记无效。");
                byte[] tail = new byte[8192];
                int count;
                while ((count = stream.Read(tail, 0, tail.Length)) > 0)
                    for (int index = 0; index < count; index++)
                        if (tail[index] != 0) throw new InvalidOperationException("更新 TAR 包含附加内容。");
                return;
            }
            long checksum = 0;
            for (int index = 0; index < header.Length; index++) checksum += index >= 148 && index < 156 ? 32 : header[index];
            if (octal(header, 148, 8) != checksum) throw new InvalidOperationException("更新 TAR 文件头校验失败。");
            long size = octal(header, 124, 12);
            long padded = checked((size + 511) / 512 * 512);
            if (padded > stream.Length - stream.Position) throw new InvalidOperationException("更新 TAR 已截断。");
            char type = (char)header[156];
            string name = field(header, 0, 100);
            string magic = field(header, 257, 6);
            if (magic != "ustar" && magic != "ustar ") throw new InvalidOperationException("更新 TAR 格式不受支持。");
            string prefix = magic == "ustar" ? field(header, 345, 155) : "";
            if (prefix.Length > 0) name = prefix + "/" + name;
            if (type == 'x' || type == 'g' || type == 'L')
            {
                if (size > 1048576 || pending) throw new InvalidOperationException("更新 TAR 扩展文件头不受支持。");
                byte[] data = new byte[(int)size];
                readExactly(stream, data);
                if (type == 'L') nextName = utf8.GetString(data).TrimEnd('\0');
                else nextName = paxPath(data, type == 'g');
                pending = type != 'g';
                stream.Position += padded - size;
                continue;
            }
            if (type != '0' && type != '\0' && type != '5')
                throw new InvalidOperationException("更新包不允许符号链接、硬链接或特殊文件。");
            if (field(header, 157, 100).Length > 0 || (type == '5' && size != 0))
                throw new InvalidOperationException("更新 TAR 文件类型无效。");
            name = nextName ?? name;
            nextName = null;
            pending = false;
            while (name.StartsWith("./", StringComparison.Ordinal)) name = name.Substring(2);
            if (type == '5') name = name.TrimEnd('/');
            string[] parts = name.Split('/');
            foreach (string part in parts)
            {
                if (part.Length == 0 || part == "." || part == ".." || part.EndsWith(".") || part.EndsWith(" ")
                    || part.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0
                    || Regex.IsMatch(part, "^(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³]|CONIN\\$|CONOUT\\$)(\\.|$)", RegexOptions.IgnoreCase))
                    throw new InvalidOperationException("更新包包含不安全路径：" + name);
            }
            if (rootName == null) rootName = parts[0];
            if (parts[0] != rootName || (parts.Length == 1 && type != '5') || !entries.Add(name))
                throw new InvalidOperationException("更新包必须只有一个顶层目录且不能重复路径。");
            stream.Position += padded;
        }
        throw new InvalidOperationException("更新 TAR 缺少结束标记。");
    }

    private static string paxPath(byte[] data, bool global)
    {
        string path = null;
        int offset = 0;
        while (offset < data.Length)
        {
            int space = Array.IndexOf(data, (byte)' ', offset);
            int length;
            if (space < 0 || !Int32.TryParse(Encoding.ASCII.GetString(data, offset, space - offset), out length)
                || length <= space - offset + 2 || length > data.Length - offset || data[offset + length - 1] != '\n')
                throw new InvalidOperationException("更新 TAR 的 PAX 数据无效。");
            string entry = utf8.GetString(data, space + 1, offset + length - space - 2);
            int equals = entry.IndexOf('=');
            if (equals <= 0) throw new InvalidOperationException("更新 TAR 的 PAX 属性无效。");
            string key = entry.Substring(0, equals);
            if (key == "path" && !global && path == null) path = entry.Substring(equals + 1);
            else if (!Regex.IsMatch(key, "^(mtime|atime|ctime|uid|gid|uname|gname|comment)$"))
                throw new InvalidOperationException("更新 TAR 包含不受支持的 PAX 属性：" + key);
            offset += length;
        }
        return path;
    }

    private static long octal(byte[] bytes, int offset, int length)
    {
        string value = Encoding.ASCII.GetString(bytes, offset, length).Trim('\0', ' ');
        if (!Regex.IsMatch(value, "^[0-7]+$")) throw new InvalidOperationException("更新 TAR 数值格式不受支持。");
        return Convert.ToInt64(value, 8);
    }

    private static string field(byte[] bytes, int offset, int length)
    {
        int end = Array.IndexOf(bytes, (byte)0, offset, length);
        return utf8.GetString(bytes, offset, end < 0 ? length : end - offset);
    }

    private static void readExactly(Stream stream, byte[] data)
    {
        int offset = 0;
        while (offset < data.Length)
        {
            int count = stream.Read(data, offset, data.Length - offset);
            if (count == 0) throw new EndOfStreamException("更新 TAR 已截断。");
            offset += count;
        }
    }

    private static void ensurePlainTree(string directory)
    {
        ensurePlainPath(directory);
        foreach (string path in Directory.EnumerateFileSystemEntries(directory))
        {
            FileAttributes attributes = File.GetAttributes(path);
            if ((attributes & FileAttributes.ReparsePoint) != 0) throw new InvalidOperationException("更新路径不能包含链接：" + path);
            if ((attributes & FileAttributes.Directory) != 0) ensurePlainTree(path);
        }
    }

    private static void ensurePlainPath(string path)
    {
        for (string current = Path.GetFullPath(path); current != null; current = Path.GetDirectoryName(current))
        {
            try
            {
                if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    throw new InvalidOperationException("更新路径不能包含链接：" + current);
            }
            catch (FileNotFoundException) { }
            catch (DirectoryNotFoundException) { }
        }
    }

    private static string fullPath(string path)
    {
        if (!Regex.IsMatch(path, "^[a-zA-Z]:[\\\\/]") || path.IndexOfAny(new[] { '\r', '\n', '"', '\0' }) >= 0)
            throw new InvalidOperationException("更新目录必须是本机绝对路径。");
        string full = Path.GetFullPath(path).TrimEnd('\\', '/');
        if (full.Length <= 3) throw new InvalidOperationException("不能将磁盘根目录作为更新目标。");
        return full;
    }

    private static bool samePath(string left, string right)
    {
        return String.Equals(Path.GetFullPath(left).TrimEnd('\\', '/'), Path.GetFullPath(right).TrimEnd('\\', '/'), StringComparison.OrdinalIgnoreCase);
    }

    private static bool inside(string path, string directory)
    {
        return Path.GetFullPath(path).StartsWith(Path.GetFullPath(directory).TrimEnd('\\') + "\\", StringComparison.OrdinalIgnoreCase);
    }

    private static string quote(string value) { return "\"" + value + "\""; }

    private static Dictionary<string, object> readJson(string path)
    {
        if (new FileInfo(path).Length > 65536) throw new InvalidOperationException("更新元数据过大。");
        return serializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(path, utf8));
    }

    private static string text(Dictionary<string, object> values, string key)
    {
        object value;
        if (values == null || !values.TryGetValue(key, out value) || !(value is string) || String.IsNullOrWhiteSpace((string)value))
            throw new InvalidOperationException("更新字段无效：" + key);
        return (string)value;
    }

    private static int number(Dictionary<string, object> values, string key)
    {
        object value;
        if (values == null || !values.TryGetValue(key, out value) || !(value is int)) throw new InvalidOperationException("更新字段无效：" + key);
        return (int)value;
    }

    private static string matching(Dictionary<string, object> values, string key, string pattern)
    {
        string value = text(values, key);
        if (!Regex.IsMatch(value, pattern)) throw new InvalidOperationException("更新字段无效：" + key);
        return value;
    }

    private static void writeFile(string path, string content)
    {
        ensurePlainPath(path);
        string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            byte[] bytes = utf8.GetBytes(content);
            stream.Write(bytes, 0, bytes.Length);
            stream.Flush(true);
        }
        if (File.Exists(path)) File.Replace(temporary, path, null);
        else File.Move(temporary, path);
    }

    private static void writeResult(string root, string transaction, bool success, string error, string version, string hash)
    {
        writeFile(Path.Combine(root, "self-extraction", "updateResult.json"), serializer.Serialize(new { transactionId = transaction, success = success, error = error, version = version, hash = hash }));
    }
}
