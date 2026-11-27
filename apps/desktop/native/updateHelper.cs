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
using System.Threading.Tasks;
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

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct startupInfo
    {
        public int cb;
        public string reserved, desktop, title;
        public int x, y, width, height, columns, rows, fillAttribute, flags;
        public short showWindow, reservedSize;
        public IntPtr reservedData, standardInput, standardOutput, standardError;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct processInformation
    {
        public IntPtr process, thread;
        public int processId, threadId;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateProcessW(string application, StringBuilder commandLine, IntPtr processAttributes, IntPtr threadAttributes,
        [MarshalAs(UnmanagedType.Bool)] bool inheritHandles, uint flags, IntPtr environment, string directory, ref startupInfo startup, out processInformation information);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsProcessInJob(IntPtr process, IntPtr job, [MarshalAs(UnmanagedType.Bool)] out bool result);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool QueryInformationJobObject(IntPtr job, int informationClass, IntPtr information, int length, IntPtr returnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint ResumeThread(IntPtr thread);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool TerminateProcess(IntPtr process, uint exitCode);

    [DllImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CloseHandle(IntPtr handle);

    [STAThread]
    private static int Main(string[] args)
    {
        // ACT: nsExec 只识别 UTF-16/系统编码；桌面宿主继续读取 UTF-8。
        bool installerOutput = args.Length > 0 && args[args.Length - 1] == "--utf16";
        if (installerOutput) Array.Resize(ref args, args.Length - 1);
        Encoding outputEncoding = installerOutput ? (Encoding)new UnicodeEncoding(false, false) : new UTF8Encoding(false);
        Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), outputEncoding) { AutoFlush = true });
        Console.SetError(new StreamWriter(Console.OpenStandardError(), outputEncoding) { AutoFlush = true });
        if (installerOutput) Console.Write("\uFEFF");
        if (args.Length > 0 && (args[0] == "--read-archive-info" || args[0] == "--extract-install"))
            return archiveCommand(args);
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
                string archiveRoot = validateTar(archiveStream);
                string tar = systemTar();
                if (!CreateDirectoryW(stage, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法创建独立的更新暂存目录。");
                ensurePlainPath(stage);
                extract(tar, archive, stage, archiveRoot);
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
            // ACT: 无触发器的一次性任务清理失败不能撤销更新；保留任务到结束也能阻止同一任务重复启动。
            if (planPath != null && args[0] == "--apply-scheduled-update")
            {
                try { deleteScheduledTask(planPath); }
                catch (Exception error)
                {
                    string detail = "更新任务清理失败（HRESULT=0x" + error.HResult.ToString("X8") + "）：" + error.Message;
                    try { Console.Error.WriteLine(detail); }
                    catch { /* 宿主可能已关闭 stderr 管道，诊断不能改变更新结果。 */ }
                    if (root != null)
                    {
                        try { writeFile(Path.ChangeExtension(planPath, ".cleanup.log"), detail); }
                        catch { /* 日志不可写也不能覆盖原始结果或阻止释放安装锁。 */ }
                    }
                }
            }
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

    private static void deleteScheduledTask(string planPath)
    {
        dynamic scheduler = Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service", true));
        scheduler.Connect();
        dynamic folder = scheduler.GetFolder("\\");
        try
        {
            folder.DeleteTask(scheduledTaskName(planPath), 0);
        }
        catch (Exception error)
        {
            if (error.HResult != unchecked((int)0x80070002)) throw;
        }
    }

    private static void spawnScheduledUpdate(string executable, string planPath, bool quiet)
    {
        // ACT: breakaway 成功仍可能留在外层 Job，优先由当前用户的任务服务启动；不提权、不设置触发器。
        string taskName = scheduledTaskName(planPath);
        string stage = "identity", sid = "unknown";
        bool administratorToken = false;
        bool created = false;
        try
        {
            using (var identity = WindowsIdentity.GetCurrent())
            {
                sid = identity.User.Value;
                administratorToken = new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
            }
            stage = "createService";
            dynamic scheduler = Activator.CreateInstance(Type.GetTypeFromProgID("Schedule.Service", true));
            stage = "connect";
            scheduler.Connect();
            stage = "getFolder";
            dynamic folder = scheduler.GetFolder("\\");
            stage = "configureTask";
            dynamic task = scheduler.NewTask(0);
            task.Principal.UserId = sid;
            task.Principal.LogonType = 3; // TASK_LOGON_INTERACTIVE_TOKEN
            task.Principal.RunLevel = 0; // TASK_RUNLEVEL_LUA
            task.Settings.AllowDemandStart = true;
            task.Settings.DisallowStartIfOnBatteries = false;
            task.Settings.StopIfGoingOnBatteries = false;
            task.Settings.ExecutionTimeLimit = "PT15M";
            task.Settings.Hidden = true;
            task.Settings.MultipleInstances = 2; // TASK_INSTANCES_IGNORE_NEW
            dynamic action = task.Actions.Create(0);
            action.Path = executable;
            action.Arguments = "--apply-scheduled-update " + quote(planPath) + (quiet ? " --quiet" : "");
            action.WorkingDirectory = Path.GetDirectoryName(executable);
            stage = "registerTask";
            dynamic registered = folder.RegisterTaskDefinition(taskName, task, 2, task.Principal.UserId, null, 3, null);
            created = true;
            stage = "runTask";
            registered.Run(null);
        }
        catch (Exception error)
        {
            string detail = "无法通过当前用户的任务服务启动更新助手（stage=" + stage
                + ", HRESULT=0x" + error.HResult.ToString("X8") + ", task=" + taskName + ", SID=" + sid
                + ", administratorToken=" + administratorToken + "）：" + error.Message;
            if (created)
            {
                try { deleteScheduledTask(planPath); }
                catch (Exception cleanupError)
                {
                    detail += "\n更新任务清理失败（HRESULT=0x" + cleanupError.HResult.ToString("X8") + "）：" + cleanupError.Message;
                }
            }
            else
            {
                // 任务未注册（策略、安全软件或任务目录权限拒绝）时服务不可能已接收，可安全改走脱离 Job 的子进程。
                try
                {
                    spawnBreakawayUpdate(executable, planPath, quiet);
                    return;
                }
                catch (Exception fallbackError)
                {
                    detail += "\n脱离 Job 直接启动也失败（HRESULT=0x" + fallbackError.HResult.ToString("X8") + "）：" + fallbackError.Message;
                }
            }
            // Run 报错也可能已被服务接收；由宿主撤销原计划，不在这里盲目重发或改用普通子进程。
            throw new InvalidOperationException(detail, error);
        }
    }

    private static void spawnBreakawayUpdate(string executable, string planPath, bool quiet)
    {
        // 挂起创建，确认已脱离宿主的 Job 后才恢复；外层 Job 禁止脱离或仍在宿主 Job 内时终止子进程并报错。
        var startup = new startupInfo { cb = Marshal.SizeOf(typeof(startupInfo)) };
        var commandLine = new StringBuilder(quote(executable) + " --apply-update " + quote(planPath) + (quiet ? " --quiet" : ""));
        processInformation child;
        const uint createSuspended = 0x00000004, createBreakawayFromJob = 0x01000000;
        if (!CreateProcessW(executable, commandLine, IntPtr.Zero, IntPtr.Zero, false, createSuspended | createBreakawayFromJob,
            IntPtr.Zero, Path.GetDirectoryName(executable), ref startup, out child))
            throw new Win32Exception(Marshal.GetLastWin32Error());
        bool resumed = false;
        IntPtr list = IntPtr.Zero;
        try
        {
            bool inJob;
            if (!IsProcessInJob(Process.GetCurrentProcess().Handle, IntPtr.Zero, out inJob))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "无法确认更新助手的 Job 状态。");
            if (inJob)
            {
                // ACT: hJob 为空时读取当前进程最内层的 Job，即宿主退出时一并结束的 Job；更外层与 Toonflow 无关的 Job 允许保留。
                // 列表上限 4096 个进程，超出或读取失败都按失败处理，不冒险交接。
                int size = 8 + 4096 * IntPtr.Size;
                list = Marshal.AllocHGlobal(size);
                if (!QueryInformationJobObject(IntPtr.Zero, 3, list, size, IntPtr.Zero)) // JobObjectBasicProcessIdList
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "无法读取宿主 Job 的进程列表。");
                for (int index = Marshal.ReadInt32(list, 4) - 1; index >= 0; index--)
                    if (Marshal.ReadIntPtr(list, 8 + index * IntPtr.Size).ToInt64() == child.processId)
                        throw new InvalidOperationException("更新助手未能脱离宿主的 Job，宿主退出时会被一并结束。");
            }
            if (ResumeThread(child.thread) == uint.MaxValue) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法恢复更新助手。");
            resumed = true;
        }
        finally
        {
            if (list != IntPtr.Zero) Marshal.FreeHGlobal(list);
            if (!resumed) TerminateProcess(child.process, 1);
            CloseHandle(child.thread);
            CloseHandle(child.process);
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

    private static int archiveCommand(string[] args)
    {
        bool quiet = Array.IndexOf(args, "--quiet") >= 0;
        try
        {
            int count = args.Length - (quiet ? 1 : 0);
            if ((quiet && args[args.Length - 1] != "--quiet") || count != (args[0] == "--read-archive-info" ? 4 : 3))
                throw new InvalidOperationException("更新助手参数无效。");
            string installRoot = fullPath(args[1]);
            ensurePlainPath(installRoot);
            if (!Directory.Exists(installRoot)) throw new DirectoryNotFoundException("安装目录不存在。");
            string archive = fullPath(args[2]);
            if (!inside(archive, Path.Combine(installRoot, "self-extraction")))
                throw new InvalidOperationException("更新包不属于此安装目录。");
            ensurePlainPath(archive);
            string tar = systemTar();
            using (var stream = new FileStream(archive, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                if (args[0] == "--read-archive-info")
                {
                    string member = args[3];
                    if (!Regex.IsMatch(member, "^[a-zA-Z0-9_-]+/Resources/version\\.json$"))
                        throw new InvalidOperationException("更新元数据路径无效。");
                    string output;
                    if (tar != null) output = runArchiveTool(tar, "-xOf " + quote(archive) + " " + quote(member), 60000);
                    else
                    {
                        MemoryStream content = null;
                        validateTar(stream, (name, directory, size) =>
                        {
                            if (directory || name != member) return null;
                            if (size > 65536) throw new InvalidOperationException("更新元数据过大。");
                            return content = new MemoryStream();
                        });
                        if (content == null) throw new FileNotFoundException("更新包缺少版本信息：" + member);
                        output = utf8.GetString(content.ToArray());
                    }
                    if (utf8.GetByteCount(output) > 65536) throw new InvalidOperationException("更新元数据过大。");
                    Console.Write(output);
                }
                else
                {
                    string archiveRoot = validateTar(stream);
                    string app = Path.Combine(installRoot, "app");
                    ensurePlainPath(app);
                    Directory.CreateDirectory(app);
                    extract(tar, archive, app, archiveRoot);
                }
            }
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            if (!quiet) MessageBox.Show(error.Message, "Toonflow 解压失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    // 系统没有 tar.exe（旧版或精简版 Windows）时返回 null，由内置解包接手。
    private static string systemTar()
    {
        string tar = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),
            Environment.Is64BitOperatingSystem && !Environment.Is64BitProcess ? "Sysnative" : "System32", "tar.exe");
        try
        {
            if ((File.GetAttributes(tar) & (FileAttributes.Directory | FileAttributes.ReparsePoint)) != 0)
                throw new InvalidOperationException("Windows 系统 tar.exe 路径无效。");
            return tar;
        }
        catch (FileNotFoundException) { }
        catch (DirectoryNotFoundException) { }
        return null;
    }

    private static void publishArchiveFile(string source, string destination)
    {
        ensurePlainPath(destination);
        bool replace = File.Exists(destination);
        var timer = Stopwatch.StartNew();
        while (true)
        {
            ensurePlainPath(source);
            ensurePlainPath(destination);
            if ((File.GetAttributes(source) & FileAttributes.Directory) != 0 || Directory.Exists(destination))
                throw new IOException("解压文件不能覆盖目录：" + source + " -> " + destination);
            if (replace && (File.GetAttributes(destination) & FileAttributes.ReadOnly) != 0)
                throw new UnauthorizedAccessException("无法覆盖只读文件：" + destination);
            try
            {
                if (replace) File.Replace(source, destination, null);
                else File.Move(source, destination);
                return;
            }
            catch (IOException error)
            {
                int code = error.HResult & 0xffff;
                // ACT: 每个文件的短暂占用最多等待10秒；1175保留双方原名，1176/1177可能改变文件状态，不能重试。
                if ((code != 32 && code != 33 && !(replace && code == 1175))
                    || timer.Elapsed.TotalSeconds >= 10 || !File.Exists(source) || (replace && !File.Exists(destination)))
                    throw new IOException("无法发布解压文件：" + source + " -> " + destination
                        + "（0x" + error.HResult.ToString("X8") + "）：" + error.Message, error);
                Thread.Sleep(200);
            }
        }
    }

    private static string readToolOutput(StreamReader reader)
    {
        var result = new StringBuilder();
        var buffer = new char[2048];
        int count;
        while ((count = reader.Read(buffer, 0, buffer.Length)) > 0)
            if (result.Length <= 65536) result.Append(buffer, 0, Math.Min(count, 65537 - result.Length));
        return result.ToString();
    }

    private static string runArchiveTool(string tool, string arguments, int timeout)
    {
        using (var process = Process.Start(new ProcessStartInfo(tool, arguments)
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = utf8,
            StandardErrorEncoding = utf8,
            WindowStyle = ProcessWindowStyle.Hidden
        }))
        {
            if (process == null) throw new InvalidOperationException("无法启动解压工具。");
            var output = Task.Factory.StartNew(() => readToolOutput(process.StandardOutput));
            var error = Task.Factory.StartNew(() => readToolOutput(process.StandardError));
            try
            {
                if (!process.WaitForExit(timeout)) throw new TimeoutException("解压工具执行超时。");
                if (!Task.WaitAll(new Task[] { output, error }, 5000)) throw new TimeoutException("读取解压工具输出超时。");
                if (process.ExitCode != 0) throw new InvalidOperationException("更新包解压失败：" + error.Result);
                if (output.Result.Length > 65536) throw new InvalidOperationException("解压工具输出过大。");
                return output.Result;
            }
            finally
            {
                if (!process.HasExited)
                {
                    process.Kill();
                    process.WaitForExit(5000);
                }
            }
        }
    }

    private static void extract(string tar, string archive, string stage, string archiveRoot)
    {
        ensurePlainTree(stage);
        if (tar != null)
        {
            // 安装载荷是不带编码声明的 USTAR，成员名为 UTF-8；不指定时 bsdtar 按系统代码页解码，中文文件名会乱码。PAX 的 path 属性不受此选项影响。
            runArchiveTool(tar, "-xf " + quote(archive) + " -C " + quote(stage) + " --strip-components=1 --options hdrcharset=UTF-8", 600000);
            return;
        }
        // ACT: 缺少系统 tar 时用内置解析器解包，不联网获取第三方工具；只还原目录和文件内容，不还原时间与属性。
        string unpack = Path.Combine(Path.GetDirectoryName(archive), "unpack" + Guid.NewGuid().ToString("N"));
        if (!CreateDirectoryW(unpack, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error(), "无法创建独立的解压目录。");
        try
        {
            ensurePlainPath(unpack);
            using (var stream = new FileStream(archive, FileMode.Open, FileAccess.Read, FileShare.Read))
                validateTar(stream, (name, directory, size) =>
                {
                    string target = Path.Combine(unpack, name.Replace('/', '\\'));
                    if (directory)
                    {
                        Directory.CreateDirectory(target);
                        return null;
                    }
                    Directory.CreateDirectory(Path.GetDirectoryName(target));
                    return new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None);
                });
            ensurePlainTree(unpack);
            string source = Path.Combine(unpack, archiveRoot);
            if (Directory.GetFileSystemEntries(unpack).Length != 1 || !Directory.Exists(source))
                throw new InvalidOperationException("更新包必须只有一个顶层目录且不能重复路径。");
            mergeArchiveDirectory(source, stage);
        }
        finally
        {
            ensurePlainTree(unpack);
            Directory.Delete(unpack, true);
        }
    }

    private static void mergeArchiveDirectory(string source, string destination)
    {
        ensurePlainPath(destination);
        Directory.CreateDirectory(destination);
        foreach (string path in Directory.EnumerateFileSystemEntries(source))
        {
            string target = Path.Combine(destination, Path.GetFileName(path));
            ensurePlainPath(target);
            if (Directory.Exists(path)) mergeArchiveDirectory(path, target);
            else publishArchiveFile(path, target);
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

    // open 收到成员路径、是否目录和大小，返回接收成员内容的流；返回 null 或不传 open 时只校验。
    private static string validateTar(Stream stream, Func<string, bool, long, Stream> open = null)
    {
        byte[] header = new byte[512];
        byte[] buffer = open == null ? null : new byte[81920];
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
                return rootName;
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
            long next = stream.Position + padded;
            if (open != null)
                using (Stream output = open(name, type == '5', size))
                    for (long left = output == null ? 0 : size; left > 0;)
                    {
                        int count = stream.Read(buffer, 0, (int)Math.Min(buffer.Length, left));
                        if (count == 0) throw new EndOfStreamException("更新 TAR 已截断。");
                        output.Write(buffer, 0, count);
                        left -= count;
                    }
            stream.Position = next;
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
