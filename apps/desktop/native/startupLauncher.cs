using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;

internal static class startupLauncher
{
    [STAThread]
    private static int Main(string[] args)
    {
        string bin = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../../bin"));
        bool compatibility = Array.IndexOf(args, "--compatibility") >= 0;
        int exitCode;
        string detail;
        try
        {
            if (!File.Exists(Path.Combine(bin, "bun.exe")))
            {
                var runtimeOptions = new ProcessStartInfo(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "runtimeDownloader.exe"))
                {
                    Arguments = "\"" + bin + "\"",
                    WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Normal
                };
                using (Process runtime = Process.Start(runtimeOptions))
                {
                    if (runtime == null) throw new InvalidOperationException("无法启动必要运行时下载。");
                    runtime.WaitForExit();
                    if (runtime.ExitCode == 2) return 2;
                    if (runtime.ExitCode != 0 || !File.Exists(Path.Combine(bin, "bun.exe")))
                        throw new InvalidOperationException("必要运行时尚未准备完成，请重新打开 Toonflow。");
                }
            }
            exitCode = startApp(bin, compatibility);
            if (exitCode == 0) return 0;
            detail = "退出码：" + exitCode + "（0x" + exitCode.ToString("X8") + "）";
        }
        catch (Exception error)
        {
            exitCode = error is Win32Exception ? ((Win32Exception)error).NativeErrorCode : error.HResult;
            if (exitCode == 0) exitCode = 1;
            detail = "错误码：0x" + exitCode.ToString("X8") + "\r\n" + error.Message;
        }

        try
        {
            File.AppendAllText(Path.Combine(bin, "app.log"), "\r\n[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                + "] [startup] " + (compatibility ? "兼容" : "正常") + "启动失败。" + detail + "\r\n", new UTF8Encoding(false));
        }
        catch (Exception logError) { detail += "\r\n启动日志写入失败：" + logError.Message; }

        // ACT: 更新事务的启动失败交给现有回滚流程，不弹启动错误提示。
        if (!String.IsNullOrEmpty(Environment.GetEnvironmentVariable("TOONFLOW_UPDATE_TRANSACTION"))) return exitCode;
        if (!compatibility) detail += "\r\n\r\n可双击安装目录中的“闪退请双击我兼容运行.bat”尝试兼容运行。";
        MessageBox.Show((compatibility ? "兼容" : "正常") + "启动方式失败或程序异常退出。\r\n" + detail,
            "Toonflow", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return exitCode;
    }

    private static int startApp(string bin, bool compatibility)
    {
        var options = new ProcessStartInfo(Path.Combine(bin, compatibility ? "bun.exe" : "launcher.exe"))
        {
            WorkingDirectory = bin,
            UseShellExecute = false,
            CreateNoWindow = !compatibility,
            WindowStyle = ProcessWindowStyle.Normal
        };
        if (compatibility)
            options.Arguments = "\"" + Path.GetFullPath(Path.Combine(bin, "../Resources/main.js")) + "\"";
        options.EnvironmentVariables.Remove("ELECTROBUN_LAUNCHER_PID");
        options.EnvironmentVariables.Remove("ELECTROBUN_INSTALL_ROOT_NAME");
        using (Process current = Process.GetCurrentProcess())
            options.EnvironmentVariables["TOONFLOW_STARTUP_PID"] = current.Id.ToString();
        using (Process child = Process.Start(options))
        {
            if (child == null) throw new InvalidOperationException("无法取得 Toonflow 启动进程。");
            child.WaitForExit();
            return child.ExitCode;
        }
    }
}
