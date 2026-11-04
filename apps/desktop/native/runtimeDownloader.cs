using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

internal static class runtimeDownloader
{
    [STAThread]
    private static int Main(string[] args)
    {
        bool quiet = args.Length == 2 && args[1] == "--quiet";
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try
        {
            if ((args.Length != 1 && !quiet) || !Regex.IsMatch(args[0], "^[a-zA-Z]:[\\\\/]")
                || args[0].IndexOfAny(new[] { '\r', '\n', '"', '\0' }) >= 0)
                throw new ArgumentException("需要应用 bin 目录的本机绝对路径。");
            string directory = Path.GetFullPath(args[0]).TrimEnd('\\', '/');
            if (directory.Length <= 3 || !Directory.Exists(directory))
                throw new ArgumentException("应用 bin 目录不存在或目标路径无效。");
            using (var window = new downloadWindow(directory, quiet))
            {
                if (quiet) return window.runQuiet();
                Application.Run(window);
                return window.exitCode;
            }
        }
        catch (Exception error)
        {
            if (quiet) Console.Error.WriteLine(error.Message);
            else MessageBox.Show(error.Message, "必要运行时下载", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}

internal sealed class downloadWindow : Form
{
    private const string archiveDigest = runtimeConfig.archiveDigest;
    private const string binaryDigest = runtimeConfig.binaryDigest;
    private const long archiveSize = runtimeConfig.archiveSize;
    private const long binarySize = runtimeConfig.binarySize;
    private readonly string targetDirectory;
    private readonly string cacheDirectory;
    private readonly bool quietMode;
    private readonly Label statusLabel;
    private readonly Label detailLabel;
    private readonly ProgressBar progressBar;
    private readonly ComboBox sourceSelector;
    private readonly TextBox sourceAddressBox;
    private readonly ComboBox proxySelector;
    private readonly Button startButton;
    private readonly Panel advancedPanel;
    private readonly LinkLabel advancedToggle;
    private readonly TextBox technicalDetails;
    private bool advancedExpanded;
    private string latestTechnical = "";
    private const string runtimeDescription = "运行时：Bun " + runtimeConfig.version + " · Windows " + runtimeConfig.architecture + "\r\n完整性校验：SHA-256";
    private readonly Button cancelButton;
    private volatile bool cancelled;
    private volatile HttpWebRequest activeRequest;
    private readonly object probeLock = new object();
    private readonly HashSet<HttpWebRequest> probeRequests = new HashSet<HttpWebRequest>();
    private volatile bool probesStopped;
    private int peakProbeRequests;
    private bool busy;
    private bool closing;
    private int attemptNumber;
    private readonly object logLock = new object();
    public int exitCode = 2;

    public downloadWindow(string directory, bool quiet)
    {
        quietMode = quiet;
        targetDirectory = directory;
        cacheDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "local.toonflow.desktop", "runtime", "bun", runtimeConfig.version, "windows" + runtimeConfig.architecture);
        SuspendLayout();
        DoubleBuffered = true;
        ResizeRedraw = true;
        Text = "必要运行时下载";
        Font = new Font("Microsoft YaHei UI", 9);
        AutoScaleDimensions = new SizeF(96, 96);
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(640, 266);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        statusLabel = new Label { Left = 24, Top = 24, Width = 592, Height = 28, Text = "正在准备下载必要组件…" };
        progressBar = new ProgressBar { Left = 24, Top = 76, Width = 592, Height = 22, Minimum = 0, Maximum = 1000, Style = ProgressBarStyle.Continuous, MarqueeAnimationSpeed = 30 };
        detailLabel = new Label { Left = 24, Top = 112, Width = 592, Height = 42, Text = "需要下载约 " + Math.Ceiling(archiveSize / 1000000.0).ToString("F0") + " MB，完成后会自动继续。" };
        advancedToggle = new LinkLabel { Left = 24, Top = 166, Width = 160, Height = 28, Text = "高级设置（可选）",
            LinkBehavior = LinkBehavior.HoverUnderline, LinkColor = SystemColors.HotTrack, TabIndex = 2,
            AccessibleName = "高级设置", AccessibleDescription = "已折叠，可展开下载源和网络设置" };
        advancedPanel = new Panel { Left = 24, Top = 200, Width = 592, Height = 272, Visible = false, TabIndex = 3 };
        var sourceLabel = new Label { Left = 0, Top = 0, Width = 72, Height = 24, Text = "首选来源", TextAlign = ContentAlignment.MiddleLeft };
        sourceSelector = new ComboBox { Left = 80, Top = 0, Width = 512, DropDownStyle = ComboBoxStyle.DropDownList, AccessibleName = "下载源", TabIndex = 0 };
        sourceSelector.Items.AddRange(runtimeConfig.sourceNames);
        sourceSelector.Items.Add("自定义 HTTPS 地址");
        sourceSelector.SelectedIndex = 0;
        var proxyLabel = new Label { Left = 0, Top = 40, Width = 72, Height = 24, Text = "首选网络", TextAlign = ContentAlignment.MiddleLeft };
        proxySelector = new ComboBox { Left = 80, Top = 40, Width = 512, DropDownStyle = ComboBoxStyle.DropDownList, AccessibleName = "首选网络", TabIndex = 1 };
        proxySelector.Items.AddRange(new object[] { "优先使用系统代理 / PAC", "优先直连" });
        proxySelector.SelectedIndex = 0;
        var addressLabel = new Label { Left = 0, Top = 80, Width = 72, Height = 24, Text = "源地址", TextAlign = ContentAlignment.MiddleLeft };
        sourceAddressBox = new TextBox { Left = 80, Top = 80, Width = 512, Text = runtimeConfig.sourceAddresses[0], ReadOnly = true, AccessibleName = "运行时包 HTTPS 地址", TabIndex = 2 };
        technicalDetails = new TextBox { Left = 0, Top = 120, Width = 592, Height = 140, Multiline = true, ReadOnly = true,
            ScrollBars = ScrollBars.Vertical, Text = runtimeDescription + "\r\n日志：" + Path.Combine(cacheDirectory, "download.log"),
            AccessibleName = "运行时详细信息", TabIndex = 3 };
        latestTechnical = technicalDetails.Text;
        technicalDetails.LostFocus += delegate { showTechnical(latestTechnical); };
        advancedPanel.Controls.AddRange(new Control[] { sourceLabel, sourceSelector, proxyLabel, proxySelector, addressLabel, sourceAddressBox, technicalDetails });
        startButton = new Button { Left = 400, Top = 210, Width = 100, Height = 34, Text = "暂停下载", Enabled = false, Anchor = AnchorStyles.Bottom | AnchorStyles.Right, TabIndex = 0 };
        cancelButton = new Button { Left = 510, Top = 210, Width = 106, Height = 34, Text = "取消", Anchor = AnchorStyles.Bottom | AnchorStyles.Right, TabIndex = 1 };
        Controls.AddRange(new Control[] { statusLabel, progressBar, detailLabel, advancedToggle, advancedPanel, startButton, cancelButton });
        advancedToggle.LinkClicked += delegate { toggleAdvanced(); };
        startButton.Click += delegate { if (busy) requestStop(false); else startDownload(); };
        cancelButton.Click += delegate { requestStop(true); };
        sourceSelector.SelectedIndexChanged += delegate
        {
            int selected = sourceSelector.SelectedIndex;
            sourceAddressBox.ReadOnly = selected >= 0 && selected < runtimeConfig.sourceAddresses.Length;
            sourceAddressBox.Text = sourceAddressBox.ReadOnly ? runtimeConfig.sourceAddresses[selected] : "";
            settingsChanged();
        };
        proxySelector.SelectedIndexChanged += delegate { settingsChanged(); };
        sourceAddressBox.TextChanged += delegate { settingsChanged(); };
        FormClosing += delegate(object sender, FormClosingEventArgs args)
        {
            if (busy) { args.Cancel = true; requestStop(true); }
        };
        AcceptButton = startButton;
        Shown += delegate { startDownload(); };
        ResumeLayout(false);
        PerformLayout();
    }

    public int runQuiet()
    {
        try
        {
            prepareRuntime(runtimeConfig.sourceAddresses[0], false, runtimeConfig.sourceNames[0]);
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }

    private void toggleAdvanced()
    {
        SuspendLayout();
        advancedExpanded = !advancedExpanded;
        if (!advancedExpanded) advancedToggle.Focus();
        advancedPanel.Visible = advancedExpanded;
        ClientSize = new Size(ClientSize.Width, ClientSize.Height + (advancedExpanded ? advancedPanel.Height : -advancedPanel.Height));
        if (advancedExpanded) showTechnical(latestTechnical);
        advancedToggle.Text = advancedExpanded ? "收起高级设置" : "高级设置（可选）";
        advancedToggle.AccessibleDescription = advancedExpanded ? "已展开下载源和网络设置" : "已折叠，可展开下载源和网络设置";
        ResumeLayout(true);
    }
    private void showTechnical(string text)
    {
        latestTechnical = text;
        if (advancedExpanded && !technicalDetails.Focused && technicalDetails.Text != text) technicalDetails.Text = text;
    }

    private void setProgressMode(bool checking)
    {
        var style = checking ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous;
        if (progressBar.Style != style) progressBar.Style = style;
    }

    private void showStatus(string status, string detail)
    {
        if (statusLabel.Text != status) statusLabel.Text = status;
        if (detailLabel.Text != detail) detailLabel.Text = detail;
    }
    private void settingsChanged()
    {
        if (closing) return;
        if (busy) requestStop(false);
        else
        {
            statusLabel.Text = "设置已更新。";
            detailLabel.Text = "点击继续下载以使用新设置。";
        }
    }

    private void startDownload()
    {
        if (busy || closing) return;
        string address = sourceAddressBox.Text.Trim();
        Uri uri;
        if (!Uri.TryCreate(address, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttps
            || uri.UserInfo.Length != 0 || uri.Fragment.Length != 0)
        {
            statusLabel.Text = "下载地址有误，请在高级设置中修改。";
            showTechnical(runtimeDescription + "\r\n请填写有效的 HTTPS 运行时 ZIP 地址，不能包含用户名、密码或地址片段。");
            return;
        }
        bool direct = proxySelector.SelectedIndex == 1;
        string sourceName = sourceSelector.SelectedItem.ToString();
        busy = true;
        cancelled = false;
        attemptNumber++;
        startButton.Enabled = true;
        startButton.Text = "暂停下载";
        cancelButton.Enabled = true;
        statusLabel.Text = "正在检查已下载的组件…";
        detailLabel.Text = "请稍候，完成后会自动继续。";
        showTechnical(runtimeDescription + "\r\n首选：" + sourceName + " · " + (direct ? "直连" : "系统代理") + "\r\n日志：" + Path.Combine(cacheDirectory, "download.log"));
        setProgressMode(true);
        Task.Factory.StartNew(delegate
        {
            Exception failure = null;
            try { prepareRuntime(address, direct, sourceName); }
            catch (Exception error) { failure = error; }
            BeginInvoke((Action)delegate
            {
                busy = false;
                activeRequest = null;
                setProgressMode(false);
                if (closing)
                {
                    exitCode = 2;
                    Close();
                }
                else if (cancelled)
                {
                    statusLabel.Text = "下载已暂停。";
                    detailLabel.Text = "已保留下载进度，点击继续下载即可。";
                    startButton.Text = "继续下载";
                    startButton.Enabled = true;
                }
                else if (failure == null)
                {
                    exitCode = 0;
                    Close();
                }
                else
                {
                    exitCode = 1;
                    string message = Regex.Replace(failure.Message, @"https?://[^\s""<>]+", "[下载地址]");
                    statusLabel.Text = failure is WebException ? "所有下载线路均未成功，请重试。" : "必要组件准备失败，请重试。";
                    detailLabel.Text = failure is UnauthorizedAccessException
                        ? "无法写入组件，请检查安装目录的访问权限。"
                        : failure is WebException || failure is TimeoutException || failure is EndOfStreamException
                            ? "请检查网络连接，或展开高级设置调整下载选项。"
                            : "可以点击重试，或在高级设置中查看详细信息。";
                    showTechnical(runtimeDescription + "\r\n" + message + "\r\n日志：" + Path.Combine(cacheDirectory, "download.log"));
                    startButton.Text = "重试";
                    startButton.Enabled = true;
                }
            });
        });
    }

    private void requestStop(bool close)
    {
        if (close) closing = true;
        if (!busy)
        {
            if (close) { exitCode = 2; Close(); }
            return;
        }
        cancelled = true;
        setProgressMode(false);
        startButton.Enabled = false;
        if (closing)
        {
            advancedToggle.Enabled = false;
            sourceSelector.Enabled = false;
            sourceAddressBox.Enabled = false;
            proxySelector.Enabled = false;
            cancelButton.Enabled = false;
        }
        statusLabel.Text = closing ? "正在取消…" : "正在暂停，请稍候…";
        detailLabel.Text = "已下载的内容会保留。";
        HttpWebRequest request = activeRequest;
        if (request != null) request.Abort();
        stopProbes();
    }
    private void throwIfCancelled()
    {
        if (cancelled) throw new OperationCanceledException("已取消下载。");
    }

    private void updateProgress(string status, string detail, long received, string technicalSource = null)
    {
        if (quietMode) return;
        int attempt = attemptNumber;
        BeginInvoke((Action)delegate
        {
            if (attempt != attemptNumber || closing || cancelled || !busy) return;
            setProgressMode(false);
            showStatus(status, detail);
            if (technicalSource != null) showTechnical(runtimeDescription + "\r\n" + technicalSource + "\r\n日志：" + Path.Combine(cacheDirectory, "download.log"));
            int value = (int)Math.Max(0, Math.Min(1000, received * 1000 / archiveSize));
            if (progressBar.Value != value) progressBar.Value = value;
        });
    }

    private void log(string message)
    {
        lock (logLock)
            File.AppendAllText(Path.Combine(cacheDirectory, "download.log"),
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + message + Environment.NewLine, new UTF8Encoding(false));
    }

    private static void ensurePlainPath(string path)
    {
        for (string current = Path.GetFullPath(path); !String.IsNullOrEmpty(current); current = Path.GetDirectoryName(current))
        {
            try
            {
                if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    throw new IOException("运行时路径不能经过符号链接或目录联接：" + current);
            }
            catch (FileNotFoundException) { }
            catch (DirectoryNotFoundException) { }
        }
    }

    private bool fileMatches(string path, long size, string digest)
    {
        ensurePlainPath(path);
        if (!File.Exists(path) || new FileInfo(path).Length != size) return false;
        using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
        using (var sha = SHA256.Create())
            return String.Equals(BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", ""), digest, StringComparison.OrdinalIgnoreCase);
    }

    private static void publishFile(string source, string destination)
    {
        ensurePlainPath(source);
        ensurePlainPath(destination);
        if (File.Exists(destination)) File.Replace(source, destination, null);
        else File.Move(source, destination);
    }

    private void prepareRuntime(string address, bool direct, string sourceName)
    {
        ensurePlainPath(cacheDirectory);
        ensurePlainPath(targetDirectory);
        if (!Directory.Exists(targetDirectory)) throw new DirectoryNotFoundException("应用 bin 目录不存在。");
        string target = Path.Combine(targetDirectory, "bun.exe");
        if (fileMatches(target, binarySize, binaryDigest)) return;
        Directory.CreateDirectory(cacheDirectory);
        var timer = Stopwatch.StartNew();
        using (var mutex = new Mutex(false, "Local\\toonflowBun" + runtimeConfig.version + "Windows" + runtimeConfig.architecture))
        {
            bool locked = false;
            try
            {
                while (!locked)
                {
                    throwIfCancelled();
                    if (timer.Elapsed.TotalMinutes >= 30) throw new TimeoutException("等待运行时缓存超时。");
                    try { locked = mutex.WaitOne(500); }
                    catch (AbandonedMutexException) { locked = true; }
                }
                log("start; preferredSource=" + sourceName + "; preferredMode=" + (direct ? "direct" : "systemProxy"));
                string cachedBinary = Path.Combine(cacheDirectory, "bun.exe");
                if (!fileMatches(cachedBinary, binarySize, binaryDigest))
                {
                    string archivePath = Path.Combine(cacheDirectory, "bun.zip");
                    if (!fileMatches(archivePath, archiveSize, archiveDigest))
                        downloadArchive(archivePath, address, direct, sourceName);
                    throwIfCancelled();
                    updateProgress("正在准备必要组件…", "下载已完成，正在准备运行时。", archiveSize);
                    extractRuntime(archivePath, cachedBinary);
                }
                else log("verified runtime cache hit");
                throwIfCancelled();
                if (!fileMatches(target, binarySize, binaryDigest))
                {
                    string temporary = Path.Combine(targetDirectory, "bun" + Guid.NewGuid().ToString("N") + ".tmp");
                    try
                    {
                        File.Copy(cachedBinary, temporary, false);
                        if (!fileMatches(temporary, binarySize, binaryDigest)) throw new InvalidDataException("Bun 复制校验失败。");
                        throwIfCancelled();
                        publishFile(temporary, target);
                    }
                    finally { if (File.Exists(temporary)) File.Delete(temporary); }
                }
                log("runtime ready; target=" + target);
            }
            catch (Exception error)
            {
                if (locked) log("failed; type=" + error.GetType().Name + "; " + Regex.Replace(error.Message, @"https?://[^\s""<>]+", "[下载地址]"));
                throw;
            }
            finally { if (locked) mutex.ReleaseMutex(); }
        }
    }

    private sealed class downloadRoute
    {
        public string address;
        public string name;
        public bool direct;
        public int order;
        public int probes;
        public int successes;
        public double slowestRate;
        public long slowestMilliseconds;
    }

    private string archivePartPath(string address)
    {
        if (Array.Exists(runtimeConfig.sourceAddresses, value => String.Equals(value, address, StringComparison.Ordinal)))
            return Path.Combine(cacheDirectory, "bun.zip.part");
        using (var sha = SHA256.Create())
            return Path.Combine(cacheDirectory, "bunCustom" + BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(address))).Replace("-", "").Substring(0, 16).ToLowerInvariant() + ".zip.part");
    }

    private static string routeLabel(downloadRoute route)
    {
        return route.name + " / " + (route.direct ? "直连" : "系统代理");
    }

    private void reportSelection(string technical)
    {
        if (quietMode) return;
        int attempt = attemptNumber;
        BeginInvoke((Action)delegate
        {
            if (attempt != attemptNumber || closing || cancelled || !busy) return;
            setProgressMode(true);
            showStatus("正在选择合适的下载线路…", "正在检查网络连接，请稍候。");
            showTechnical(runtimeDescription + "\r\n" + technical + "\r\n日志：" + Path.Combine(cacheDirectory, "download.log"));
        });
    }

    private void selectRoutes(List<downloadRoute> routes)
    {
        var budget = Stopwatch.StartNew();
        var results = new List<string>();
        int nextRoute = -1;
        int selectionDeadline = 6000;
        Exception failure = null;
        lock (probeLock)
        {
            probesStopped = cancelled;
            peakProbeRequests = 0;
        }
        reportSelection("正在进行短时 HTTPS 连通和速度探测。");
        var workers = new Task[Math.Min(4, routes.Count)];
        log("probe stage start; routes=" + routes.Count + "; concurrency=" + workers.Length + "; budgetMs=6000; sampleTimeoutMs=2000");
        // ACT: 最多4路、总预算6秒；可靠候选就绪后再比较500ms，未测或失败的线路仍保留作下载后备。
        for (int worker = 0; worker < workers.Length; worker++)
        {
            workers[worker] = Task.Factory.StartNew(delegate
            {
                try
                {
                    while (!cancelled && !probesStopped)
                    {
                        int index = Interlocked.Increment(ref nextRoute);
                        if (index >= routes.Count) break;
                        var route = routes[index];
                        for (int round = 0; round < 2; round++)
                        {
                            int remaining = (int)(6000 - budget.ElapsedMilliseconds);
                            if (cancelled || probesStopped || remaining <= 0) break;
                            route.probes++;
                            try
                            {
                                long elapsed = probeRoute(route, Math.Min(2000, remaining));
                                double rate = 32768 / Math.Max(0.001, elapsed / 1000.0);
                                route.slowestRate = route.successes == 0 ? rate : Math.Min(route.slowestRate, rate);
                                route.slowestMilliseconds = Math.Max(route.slowestMilliseconds, elapsed);
                                route.successes++;
                                if (route.successes == 2)
                                    Interlocked.CompareExchange(ref selectionDeadline, Math.Min(6000, (int)budget.ElapsedMilliseconds + 500), 6000);
                                log("probe success; route=" + routeLabel(route) + "; sample=" + (round + 1) + "; bytes=32768; ms=" + elapsed);
                            }
                            catch (Exception error)
                            {
                                if (cancelled || probesStopped) { route.probes--; break; }
                                if (!(error is WebException || error is TimeoutException || error is EndOfStreamException || error is InvalidDataException)) throw;
                                log("probe failed; route=" + routeLabel(route) + "; sample=" + (round + 1) + "; type=" + error.GetType().Name);
                                break;
                            }
                        }
                    }
                }
                catch (Exception error)
                {
                    lock (probeLock) { if (failure == null) failure = error; }
                    stopProbes();
                }
            }, CancellationToken.None, TaskCreationOptions.LongRunning, TaskScheduler.Default);
        }
        try
        {
            while (!Task.WaitAll(workers, 50))
            {
                if (cancelled || probesStopped || budget.ElapsedMilliseconds >= Interlocked.CompareExchange(ref selectionDeadline, 0, 0)) break;
            }
        }
        finally
        {
            stopProbes();
            // Abort唤醒异步请求等待；收束全部worker后，才允许排序、重新开始或进入正式下载。
            Task.WaitAll(workers);
        }
        log("probe stage complete; elapsedMs=" + budget.ElapsedMilliseconds + "; peakConcurrentRequests=" + peakProbeRequests);
        throwIfCancelled();
        if (failure != null) throw failure;
        foreach (var result in routes)
            if (result.probes > 0) results.Add(routeLabel(result) + "：" + result.successes + "/" + result.probes
                + " 成功，较低有效速度 " + (result.slowestRate / 1000).ToString("F0") + " KB/s");
        reportSelection(String.Join("\r\n", results));
        routes.Sort(delegate(downloadRoute left, downloadRoute right)
        {
            double leftReliability = left.probes == 0 ? 0 : (double)left.successes / left.probes;
            double rightReliability = right.probes == 0 ? 0 : (double)right.successes / right.probes;
            int comparison = rightReliability.CompareTo(leftReliability);
            if (comparison == 0) comparison = right.successes.CompareTo(left.successes);
            if (comparison == 0) comparison = right.slowestRate.CompareTo(left.slowestRate);
            if (comparison == 0) comparison = left.slowestMilliseconds.CompareTo(right.slowestMilliseconds);
            return comparison == 0 ? left.order.CompareTo(right.order) : comparison;
        });
    }

    private void stopProbes()
    {
        HttpWebRequest[] requests;
        lock (probeLock)
        {
            probesStopped = true;
            requests = new HttpWebRequest[probeRequests.Count];
            probeRequests.CopyTo(requests);
        }
        foreach (var request in requests) request.Abort();
    }

    private static T completeProbe<T>(IAsyncResult operation, Func<IAsyncResult, T> complete, HttpWebRequest request, Stopwatch timer, int timeoutMilliseconds)
    {
        using (var completed = operation.AsyncWaitHandle)
        {
            int remaining = timeoutMilliseconds - (int)timer.ElapsedMilliseconds;
            if (remaining <= 0 || !completed.WaitOne(remaining)) request.Abort();
            return complete(operation);
        }
    }

    private long probeRoute(downloadRoute route, int timeoutMilliseconds)
    {
        const int sampleBytes = 32768;
        ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
        var timer = Stopwatch.StartNew();
        var uri = new Uri(route.address);
        for (int redirect = 0; redirect <= 5; redirect++)
        {
            throwIfCancelled();
            if (probesStopped) throw new OperationCanceledException("线路探测已结束。");
            validateDownloadAddress(uri, route.address);
            int remaining = timeoutMilliseconds - (int)timer.ElapsedMilliseconds;
            if (remaining <= 0) throw new TimeoutException("线路探测超时。");
            var request = (HttpWebRequest)WebRequest.Create(uri);
            request.AllowAutoRedirect = false;
            request.Timeout = remaining;
            request.ReadWriteTimeout = remaining;
            request.UserAgent = "ToonflowRuntime/1.0";
            request.Proxy = route.direct ? null : WebRequest.GetSystemWebProxy();
            request.AddRange(0, sampleBytes - 1);
            lock (probeLock)
            {
                if (cancelled || probesStopped) throw new OperationCanceledException("线路探测已结束。");
                probeRequests.Add(request);
                peakProbeRequests = Math.Max(peakProbeRequests, probeRequests.Count);
            }
            try
            {
                var responseOperation = request.BeginGetResponse(null, null);
                using (var response = (HttpWebResponse)completeProbe(responseOperation, request.EndGetResponse, request, timer, timeoutMilliseconds))
                {
                    int status = (int)response.StatusCode;
                    if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308)
                    {
                        Uri next;
                        if (!Uri.TryCreate(uri, response.Headers[HttpResponseHeader.Location], out next)) throw new InvalidDataException("探测地址跳转无效。");
                        uri = next;
                        continue;
                    }
                    if (status == 206)
                    {
                        Match range = Regex.Match(response.Headers[HttpResponseHeader.ContentRange] ?? "", @"^bytes (\d+)-(\d+)/(\d+)$");
                        long from, to, total;
                        if (!range.Success || !Int64.TryParse(range.Groups[1].Value, out from) || !Int64.TryParse(range.Groups[2].Value, out to)
                            || !Int64.TryParse(range.Groups[3].Value, out total) || from != 0 || total != archiveSize || to < sampleBytes - 1 || to >= archiveSize)
                            throw new InvalidDataException("探测响应范围不匹配。");
                    }
                    else if (status != 200 || (response.ContentLength >= 0 && response.ContentLength != archiveSize))
                        throw new InvalidDataException("探测响应内容不匹配。");
                    byte[] buffer = new byte[sampleBytes];
                    int received = 0;
                    using (var input = response.GetResponseStream())
                    {
                        while (received < buffer.Length)
                        {
                            throwIfCancelled();
                            if (probesStopped) throw new OperationCanceledException("线路探测已结束。");
                            int count;
                            try
                            {
                                var readOperation = input.BeginRead(buffer, received, buffer.Length - received, null, null);
                                count = completeProbe(readOperation, input.EndRead, request, timer, timeoutMilliseconds);
                            }
                            catch (IOException error) { throw new WebException("线路探测读取中断。", error, WebExceptionStatus.ReceiveFailure, null); }
                            if (count == 0) throw new EndOfStreamException("线路探测内容不完整。");
                            received += count;
                        }
                        // 不支持Range而返回200也可使用；仅读取这32KiB，不保存、不计入下载进度。
                        if (buffer[0] != 0x50 || buffer[1] != 0x4b || buffer[2] != 3 || buffer[3] != 4)
                            throw new InvalidDataException("线路探测返回的内容不是运行时ZIP。");
                        request.Abort();
                    }
                    throwIfCancelled();
                    if (probesStopped) throw new OperationCanceledException("线路探测已结束。");
                    if (timer.ElapsedMilliseconds > timeoutMilliseconds) throw new TimeoutException("线路探测超时。");
                    return timer.ElapsedMilliseconds;
                }
            }
            catch (WebException error)
            {
                if (error.Response != null) error.Response.Close();
                throw;
            }
            finally
            {
                request.Abort();
                lock (probeLock) probeRequests.Remove(request);
            }
        }
        throw new InvalidDataException("线路探测重定向过多。");
    }

    private static void validateDownloadAddress(Uri uri, string address)
    {
        if (uri.Scheme != Uri.UriSchemeHttps || uri.UserInfo.Length != 0
            || (uri.Host != new Uri(address).Host && uri.Host != "github.com" && uri.Host != "release-assets.githubusercontent.com"
                && uri.Host != "registry.npmmirror.com" && uri.Host != "cdn.npmmirror.com" && uri.Host != "cnpmcore.oss-accelerate.aliyuncs.com"
                && uri.Host != "downloads.sourceforge.net" && !uri.Host.EndsWith(".dl.sourceforge.net", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidDataException("下载源必须使用 HTTPS，跨域跳转仅允许所选源及已知官方或镜像 CDN。自定义源可填写最终 ZIP 地址。");
    }

    private void downloadArchive(string archivePath, string preferredAddress, bool preferredDirect, string preferredName)
    {
        var addresses = new List<string> { preferredAddress };
        foreach (string candidate in runtimeConfig.sourceAddresses)
            if (!addresses.Exists(value => String.Equals(value, candidate, StringComparison.Ordinal))) addresses.Add(candidate);
        var routes = new List<downloadRoute>();
        var checkedParts = new HashSet<string>(StringComparer.Ordinal);
        foreach (string address in addresses)
        {
            throwIfCancelled();
            string partPath = archivePartPath(address);
            if (checkedParts.Add(partPath) && fileMatches(partPath, archiveSize, archiveDigest))
            {
                throwIfCancelled();
                publishFile(partPath, archivePath);
                return;
            }
        }
        foreach (bool direct in new[] { preferredDirect, !preferredDirect })
        {
            foreach (string address in addresses)
            {
                int sourceIndex = Array.FindIndex(runtimeConfig.sourceAddresses, value => String.Equals(value, address, StringComparison.Ordinal));
                string name = sourceIndex >= 0 ? runtimeConfig.sourceNames[sourceIndex] : preferredName;
                routes.Add(new downloadRoute { address = address, name = name, direct = direct, order = routes.Count });
            }
        }
        selectRoutes(routes);
        var failures = new List<string>();
        Exception lastFailure = null;
        foreach (var route in routes)
        {
            throwIfCancelled();
            string partPath = archivePartPath(route.address);
            ensurePlainPath(partPath);
            var timer = Stopwatch.StartNew();
            try
            {
                long retained = File.Exists(partPath) ? new FileInfo(partPath).Length : 0;
                if (retained >= archiveSize)
                {
                    if (fileMatches(partPath, archiveSize, archiveDigest))
                    {
                        throwIfCancelled();
                        publishFile(partPath, archivePath);
                        return;
                    }
                    File.Delete(partPath);
                    retained = 0;
                }
                updateProgress(failures.Count == 0 ? "正在连接下载服务…" : "正在尝试其他下载线路…",
                    retained > 0 ? "将从已下载的位置继续。" : "请稍候，下载会自动继续。", retained,
                    "当前线路：" + routeLabel(route));
                log("route attempt; route=" + routeLabel(route) + "; offset=" + retained);
                for (int transfer = 0; transfer < 2; transfer++)
                {
                    throwIfCancelled();
                    long resumeBytes = File.Exists(partPath) ? new FileInfo(partPath).Length : 0;
                    downloadZip(partPath, route.address, route.direct, timer);
                    throwIfCancelled();
                    updateProgress("正在检查下载内容…", "即将完成，请稍候。", archiveSize);
                    if (!fileMatches(partPath, archiveSize, archiveDigest))
                    {
                        File.Delete(partPath);
                        updateProgress("正在重新获取必要组件…", "下载内容未通过检查，将重新下载。", 0);
                        if (resumeBytes > 0 && transfer == 0)
                        {
                            log("resumed content checksum mismatch; retrying current route from zero");
                            continue;
                        }
                        throw new InvalidDataException("下载包 SHA-256 不匹配，已丢弃损坏内容。");
                    }
                    throwIfCancelled();
                    publishFile(partPath, archivePath);
                    return;
                }
            }
            catch (Exception error)
            {
                throwIfCancelled();
                if (!(error is WebException || error is TimeoutException || error is EndOfStreamException || error is InvalidDataException)) throw;
                activeRequest = null;
                lastFailure = error;
                string message = Regex.Replace(error.Message, @"https?://[^\s""<>]+", "[下载地址]");
                failures.Add(routeLabel(route) + "：" + message);
                log("route failed; route=" + routeLabel(route) + "; type=" + error.GetType().Name + "; " + message);
            }
        }
        throwIfCancelled();
        throw new WebException("所有下载源与网络模式组合均失败：\r\n" + String.Join("\r\n", failures), lastFailure, WebExceptionStatus.ConnectFailure, null);
    }
    private void downloadZip(string partPath, string address, bool direct, Stopwatch timer)
    {
        ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
        long offset = File.Exists(partPath) ? new FileInfo(partPath).Length : 0;
        var uri = new Uri(address);
        var transferTimer = Stopwatch.StartNew();
        long lastProgress = -1000;
        for (int redirect = 0; redirect <= 5; redirect++)
        {
            throwIfCancelled();
            validateDownloadAddress(uri, address);
            int remaining = (int)Math.Min(Int32.MaxValue, 1800000 - timer.ElapsedMilliseconds);
            if (remaining <= 0) throw new TimeoutException("本次下载超过 30 分钟，请检查网络后重试。");
            var request = (HttpWebRequest)WebRequest.Create(uri);
            activeRequest = request;
            if (cancelled) { request.Abort(); throwIfCancelled(); }
            request.AllowAutoRedirect = false;
            request.Timeout = Math.Min(15000, remaining);
            request.ReadWriteTimeout = Math.Min(30000, remaining);
            request.UserAgent = "ToonflowRuntime/1.0";
            request.Proxy = direct ? null : WebRequest.GetSystemWebProxy();
            if (offset > 0) request.AddRange(offset);
            log("request; host=" + uri.Host + "; offset=" + offset);
            using (var timeout = new System.Threading.Timer(delegate { request.Abort(); }, null, remaining, Timeout.Infinite))
            {
                HttpWebResponse response;
                try { response = (HttpWebResponse)request.GetResponse(); }
                catch (WebException error)
                {
                    var failedResponse = error.Response as HttpWebResponse;
                    if (failedResponse != null)
                    {
                        int failedStatus = (int)failedResponse.StatusCode;
                        failedResponse.Close();
                        if (failedStatus == 416 && offset > 0)
                        {
                            log("range rejected; restarting from zero");
                            File.Delete(partPath);
                            updateProgress("正在重新连接下载服务…", "当前线路无法继续上次下载，正在从头下载。", 0);
                            activeRequest = null;
                            downloadZip(partPath, address, direct, timer);
                            return;
                        }
                    }
                    throw;
                }
                using (response)
                {
                    int status = (int)response.StatusCode;
                    if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308)
                    {
                        string location = response.Headers[HttpResponseHeader.Location];
                        if (String.IsNullOrEmpty(location)) throw new InvalidDataException("下载源返回了空的重定向地址。");
                        Uri next;
                        if (!Uri.TryCreate(uri, location, out next)) throw new InvalidDataException("下载源返回了无效的跳转地址。");
                        uri = next;
                        continue;
                    }
                    long start = 0;
                    if (status == 206)
                    {
                        Match range = Regex.Match(response.Headers[HttpResponseHeader.ContentRange] ?? "", @"^bytes (\d+)-(\d+)/(\d+)$");
                        long from, to, total;
                        if (!range.Success || !Int64.TryParse(range.Groups[1].Value, out from)
                            || !Int64.TryParse(range.Groups[2].Value, out to) || !Int64.TryParse(range.Groups[3].Value, out total)
                            || from != offset || total != archiveSize || to != archiveSize - 1)
                            throw new InvalidDataException("下载源返回的续传范围不匹配。");
                        start = offset;
                    }
                    else if (status != 200) throw new InvalidDataException("下载源返回 HTTP " + status + "。");
                    if (response.ContentLength >= 0 && response.ContentLength != archiveSize - start)
                        throw new InvalidDataException("下载包长度与锁定版本不匹配。");
                    using (var input = response.GetResponseStream())
                    using (var output = new FileStream(partPath, start > 0 ? FileMode.Append : FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        byte[] buffer = new byte[81920];
                        long received = start;
                        updateProgress("正在下载必要组件…", start == 0 && offset > 0
                            ? "当前线路不支持续传，正在从头下载。" : "下载已连接，请稍候。", start);
                        while (true)
                        {
                            int count;
                            try { count = input.Read(buffer, 0, buffer.Length); }
                            catch (IOException error) { throw new WebException("下载连接中断，已保留下载进度。", error, WebExceptionStatus.ReceiveFailure, null); }
                            if (count == 0) break;
                            throwIfCancelled();
                            received += count;
                            if (received > archiveSize) throw new InvalidDataException("下载内容超过预期大小。");
                            output.Write(buffer, 0, count);
                            if (transferTimer.ElapsedMilliseconds - lastProgress >= 200)
                            {
                                lastProgress = transferTimer.ElapsedMilliseconds;
                                double speed = (received - start) / Math.Max(0.001, transferTimer.Elapsed.TotalSeconds);
                                updateProgress("正在下载必要组件…", String.Format("{0:F1} / {1:F1} MB · {2:F0} KB/s",
                                    received / 1000000.0, archiveSize / 1000000.0, speed / 1000.0), received);
                            }
                        }
                        output.Flush(true);
                        if (received != archiveSize) throw new EndOfStreamException("下载中断，已保留部分内容，点击重试可续传。");
                    }
                    log("download complete");
                    return;
                }
            }
        }
        throw new InvalidDataException("下载源重定向超过 5 次。");
    }

    private void extractRuntime(string archivePath, string destination)
    {
        string temporary = Path.Combine(cacheDirectory, "bun" + Guid.NewGuid().ToString("N") + ".tmp");
        try
        {
            using (var archive = ZipFile.OpenRead(archivePath))
            {
                ZipArchiveEntry runtime = null;
                foreach (var entry in archive.Entries)
                {
                    if (entry.FullName.StartsWith("/") || entry.FullName.Contains("\\") || entry.FullName.Contains(":"))
                        throw new InvalidDataException("ZIP 中存在异常路径。");
                    foreach (string part in entry.FullName.Split('/'))
                        if (part == "..") throw new InvalidDataException("ZIP 中存在越界路径。");
                    if (entry.FullName != runtimeConfig.archiveMember) continue;
                    if (runtime != null || entry.Length != binarySize) throw new InvalidDataException("ZIP 中的 Bun 文件不匹配。");
                    runtime = entry;
                }
                if (runtime == null) throw new InvalidDataException("ZIP 中没有找到 " + runtimeConfig.archiveMember + "。");
                using (var input = runtime.Open())
                using (var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    byte[] buffer = new byte[81920];
                    long received = 0;
                    int count;
                    while ((count = input.Read(buffer, 0, buffer.Length)) != 0)
                    {
                        throwIfCancelled();
                        received += count;
                        if (received > binarySize) throw new InvalidDataException("解压内容超过预期大小。");
                        output.Write(buffer, 0, count);
                    }
                    output.Flush(true);
                }
            }
            if (!fileMatches(temporary, binarySize, binaryDigest)) throw new InvalidDataException("解压后的 Bun SHA-256 不匹配。");
            throwIfCancelled();
            publishFile(temporary, destination);
            log("extracted runtime SHA-256 verified");
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }
}
