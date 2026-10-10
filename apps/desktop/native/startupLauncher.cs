using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class startupLauncher
{
    [STAThread]
    private static int Main()
    {
        string bin = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../../bin"));
        int exitCode;
        string detail;
        try
        {
            exitCode = startApp(bin, false);
            if (exitCode == 0) return 0;
            detail = "退出码：" + exitCode + "（0x" + exitCode.ToString("X8") + "）";
        }
        catch (Exception error)
        {
            exitCode = error is Win32Exception ? ((Win32Exception)error).NativeErrorCode : error.HResult;
            if (exitCode == 0) exitCode = 1;
            detail = "错误码：0x" + exitCode.ToString("X8") + "\r\n" + error.Message;
        }

        // ACT: 更新事务的启动失败交给现有回滚流程，不弹兼容提示或自动改变启动方式。
        if (!String.IsNullOrEmpty(Environment.GetEnvironmentVariable("TOONFLOW_UPDATE_TRANSACTION"))) return exitCode;
        if (MessageBox.Show("正常启动方式失败或程序异常退出。\r\n" + detail
            + "\r\n\r\n是否尝试以兼容方式启动？\r\n兼容启动可能会额外出现一个黑色控制台窗口。使用期间请勿关闭该窗口，否则 Toonflow 也可能退出。",
            "Toonflow", MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2) != DialogResult.Yes)
            return exitCode;

        try
        {
            exitCode = startApp(bin, true);
            if (exitCode != 0)
                MessageBox.Show("兼容方式启动失败或程序异常退出。\r\n退出码：" + exitCode + "（0x" + exitCode.ToString("X8") + "）",
                    "Toonflow", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return exitCode;
        }
        catch (Exception error)
        {
            exitCode = error is Win32Exception ? ((Win32Exception)error).NativeErrorCode : error.HResult;
            if (exitCode == 0) exitCode = 1;
            MessageBox.Show("无法以兼容方式启动 Toonflow。\r\n错误码：0x" + exitCode.ToString("X8") + "\r\n" + error.Message,
                "Toonflow", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return exitCode;
        }
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
