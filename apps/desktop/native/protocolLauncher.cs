using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

internal static class protocolLauncher
{
    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            Uri url;
            if (args.Length != 1 || args[0].Length > 8192
                || !Uri.TryCreate(args[0], UriKind.Absolute, out url)
                || url.Scheme != "toonflow")
                throw new InvalidOperationException("安装链接无效，须为不超过 8192 个字符的 toonflow://install?type=node&url=编码后的下载地址。");

            string mutexName = "Local\\ToonflowProtocol-" + WindowsIdentity.GetCurrent().User.Value;
            using (var mutex = new Mutex(false, mutexName))
            {
                bool locked = false;
                try
                {
                    try { locked = mutex.WaitOne(TimeSpan.FromSeconds(60)); }
                    catch (AbandonedMutexException) { locked = true; }
                    if (!locked) throw new InvalidOperationException("Toonflow 正在启动，请稍后重试。");
                    if (sendUrl(args[0])) return 0;

                    // ACT: SDK launcher 不转发 URL 参数；启动后通过本机服务交给待确认队列。
                    string launcher = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../../bin/launcher.exe"));
                    if (!File.Exists(launcher)) throw new FileNotFoundException("未找到 Toonflow，请重新安装。");
                    Process.Start(new ProcessStartInfo(launcher)
                    {
                        WorkingDirectory = Path.GetDirectoryName(launcher),
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    });
                    var timer = Stopwatch.StartNew();
                    while (timer.Elapsed < TimeSpan.FromSeconds(45))
                    {
                        Thread.Sleep(250);
                        if (sendUrl(args[0])) return 0;
                    }
                    throw new InvalidOperationException("Toonflow 启动超时，请打开应用后重新点击安装链接。");
                }
                finally
                {
                    if (locked) mutex.ReleaseMutex();
                }
            }
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "Toonflow", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static bool sendUrl(string url)
    {
        var serializer = new JavaScriptSerializer();
        Dictionary<string, object> runtime;
        try
        {
            string path = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../desktopRuntime.json"));
            runtime = serializer.Deserialize<Dictionary<string, object>>(File.ReadAllText(path));
        }
        catch (IOException) { return false; }
        catch (ArgumentException) { return false; }
        object pid, port;
        if (runtime == null || !runtime.TryGetValue("pid", out pid) || !(pid is int) || (int)pid <= 0
            || !runtime.TryGetValue("port", out port) || !(port is int) || (int)port < 1 || (int)port > 65535) return false;
        try
        {
            using (var process = Process.GetProcessById((int)pid))
                if (process.HasExited) return false;
        }
        catch (ArgumentException) { return false; }
        string origin = "http://127.0.0.1:" + (int)port;
        byte[] body = Encoding.UTF8.GetBytes(serializer.Serialize(new { url = url }));
        var request = (HttpWebRequest)WebRequest.Create(origin + "/api/desktop/openUrl");
        request.Method = "POST";
        request.ContentType = "application/json";
        request.Headers["Origin"] = origin;
        request.Headers["x-toonflow-desktop"] = "1";
        request.ContentLength = body.Length;
        request.Proxy = null;
        request.AllowAutoRedirect = false;
        request.Timeout = 3000;
        request.ReadWriteTimeout = 3000;
        try
        {
            using (var stream = request.GetRequestStream()) stream.Write(body, 0, body.Length);
            using (var response = (HttpWebResponse)request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream()))
            {
                string bodyText = reader.ReadToEnd();
                Dictionary<string, object> result;
                try { result = serializer.Deserialize<Dictionary<string, object>>(bodyText); }
                catch (Exception) { throw new InvalidOperationException("Toonflow 返回的响应格式异常，应为 JSON 安装确认结果，请更新应用后重试。"); }
                object code;
                if (result == null || !result.TryGetValue("code", out code) || !(code is int))
                    throw new InvalidOperationException("Toonflow 返回的响应格式异常，缺少有效的 code 字段，请更新应用后重试。");
                if (response.StatusCode != HttpStatusCode.OK || !Equals(code, 200))
                    throw new InvalidOperationException(responseMessage(result, "Toonflow 未接受安装请求，请更新应用后重试。"));
                return true;
            }
        }
        catch (WebException error)
        {
            // ACT: 只有无法连接才启动应用；已运行服务的拒绝或超时不会启动第二个实例。
            if (error.Status == WebExceptionStatus.ConnectFailure) return false;
            using (var response = error.Response as HttpWebResponse)
            {
                if (response != null)
                {
                    string message = response.StatusDescription;
                    try
                    {
                        using (var reader = new StreamReader(response.GetResponseStream()))
                        {
                            var result = serializer.Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
                            message = responseMessage(result, message);
                        }
                    }
                    // ACT: 非 JSON 或读取失败时保留 HTTP 状态，不把整页错误 HTML 弹给用户。
                    catch (Exception) { }
                    throw new InvalidOperationException("Toonflow 拒绝安装请求（HTTP " + (int)response.StatusCode + "）：" + message);
                }
            }
            if (error.Status == WebExceptionStatus.Timeout)
                throw new InvalidOperationException("提交安装请求超时，请等待 Toonflow 响应后重试。");
            throw new InvalidOperationException("无法提交安装请求（" + error.Status + "），请确认 Toonflow 正常运行。");
        }
    }

    private static string responseMessage(Dictionary<string, object> result, string fallback)
    {
        object detail;
        string message = result != null && result.TryGetValue("message", out detail)
            && detail is string && !String.IsNullOrWhiteSpace((string)detail) ? (string)detail : fallback;
        if (result != null && result.TryGetValue("data", out detail) && detail is System.Collections.IList)
        {
            var messages = new List<string>();
            foreach (var item in (System.Collections.IList)detail)
                if (item is string && !String.IsNullOrWhiteSpace((string)item)) messages.Add((string)item);
            if (messages.Count > 0) message += "：" + String.Join("；", messages);
        }
        return message;
    }
}
