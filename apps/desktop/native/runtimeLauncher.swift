import AppKit
import CryptoKit
import Foundation
import Darwin

// ACT: 首次启动早于 Bun，文件与网络操作必须使用 macOS 原生 API。
private struct RuntimeSource: Decodable {
  let name: String
  let url: String
}

private struct RuntimeInfo: Decodable {
  let schemaVersion: Int
  let version: String
  let platform: String
  let arch: String
  let archiveUrl: String
  let mirrorUrl: String
  let sources: [RuntimeSource]
  let archiveSha256: String
  let archiveSize: Int64
  let executableSha256: String
  let executableSize: Int64
  let archiveMember: String
}

private enum RuntimeFailure: Error, LocalizedError {
  case invalid(String), network(String), local(String), stopped, restart, probeEnded
  var errorDescription: String? {
    switch self {
    case .invalid(let text), .network(let text), .local(let text): return text
    case .stopped: return "已暂停，继续后会保留已下载的内容。"
    case .restart: return "下载服务器无法继续传输，将从头下载。"
    case .probeEnded: return "下载线路检测已结束。"
    }
  }
}

private struct RuntimeRoute {
  let url: URL
  let direct: Bool
  let name: String
  var description: String { name + (direct ? " · 直连" : " · 系统代理") }
}

private struct RuntimeProbeScore {
  let route: RuntimeRoute
  let index: Int
  var attempts = 0
  var successes = 0
  var duration = Double.infinity
  var successRate: Double { attempts == 0 ? 0 : Double(successes) / Double(attempts) }
}

private final class RuntimeTransfer: NSObject, URLSessionDataDelegate {
  let route: RuntimeRoute
  let expectedSize: Int64
  let offset: Int64
  let probe: Bool
  let output: FileHandle?
  let progress: (Int64) -> Void
  let finished = DispatchSemaphore(value: 0)
  var failure: Error?
  var received: Int64
  var sample = Data()
  var redirects = 0
  var probeComplete = false
  var responseReceived = false

  init(route: RuntimeRoute, expectedSize: Int64, offset: Int64, probe: Bool,
       output: FileHandle?, progress: @escaping (Int64) -> Void) {
    self.route = route
    self.expectedSize = expectedSize
    self.offset = offset
    self.received = offset
    self.probe = probe
    self.output = output
    self.progress = progress
  }

  func urlSession(_ session: URLSession, task: URLSessionTask,
                  willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
                  completionHandler: @escaping (URLRequest?) -> Void) {
    redirects += 1
    let allowed = [route.url.host?.lowercased(), "github.com", "release-assets.githubusercontent.com", "cdn.npmmirror.com",
      "registry.npmmirror.com", "downloads.sourceforge.net", "cnpmcore.oss-accelerate.aliyuncs.com"]
    guard redirects <= 5, let url = request.url, url.scheme == "https", url.user == nil,
          url.password == nil, url.fragment == nil, let host = url.host?.lowercased(),
          allowed.contains(host) || host.hasSuffix(".dl.sourceforge.net") else {
      failure = RuntimeFailure.network("下载地址的跳转不受支持。")
      completionHandler(nil)
      return
    }
    completionHandler(request)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask,
                  didReceive response: URLResponse,
                  completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
    do {
      guard !responseReceived, let response = response as? HTTPURLResponse else {
        throw RuntimeFailure.network("下载服务器返回了无效响应。")
      }
      responseReceived = true
      if response.statusCode == 416 && !probe && offset > 0 { throw RuntimeFailure.restart }
      guard response.statusCode == 200 || response.statusCode == 206 else {
        throw RuntimeFailure.network("下载服务器返回 HTTP \(response.statusCode)。")
      }
      if response.statusCode == 206 {
        let range = response.value(forHTTPHeaderField: "Content-Range") ?? ""
        let parts = range.replacingOccurrences(of: "bytes ", with: "").split(whereSeparator: { $0 == "-" || $0 == "/" })
        guard range.hasPrefix("bytes "), parts.count == 3, Int64(parts[0]) == offset,
              let end = Int64(parts[1]), end >= offset, end < expectedSize,
              Int64(parts[2]) == expectedSize, probe || end == expectedSize - 1 else {
          throw RuntimeFailure.network("下载服务器返回的续传范围不正确。")
        }
      } else {
        if let length = response.value(forHTTPHeaderField: "Content-Length"), Int64(length) != expectedSize {
          throw RuntimeFailure.network("下载内容的大小与所需运行时不一致。")
        }
        if !probe {
          do { try output?.truncate(atOffset: 0); try output?.seek(toOffset: 0) }
          catch { throw RuntimeFailure.local("无法重新写入运行时缓存：\(error.localizedDescription)") }
          received = 0
          progress(0)
        }
      }
      completionHandler(.allow)
    } catch {
      failure = error
      completionHandler(.cancel)
    }
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    guard failure == nil else { return }
    if probe {
      sample.append(data.prefix(max(0, 32768 - sample.count)))
      if sample.count >= 32768 {
        probeComplete = true
        dataTask.cancel()
      }
      return
    }
    guard received + Int64(data.count) <= expectedSize else {
      failure = RuntimeFailure.network("下载内容超出了所需运行时的大小。")
      dataTask.cancel()
      return
    }
    do {
      try output?.write(contentsOf: data)
      received += Int64(data.count)
      progress(received)
    } catch {
      failure = RuntimeFailure.local("无法保存必要运行时，请检查磁盘空间和目录权限：\(error.localizedDescription)")
      dataTask.cancel()
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if failure == nil && !probeComplete, let error = error { failure = error }
    if failure == nil && probe && (sample.count != 32768 || Array(sample.prefix(4)) != [80, 75, 3, 4]) {
      failure = RuntimeFailure.network("下载服务器没有返回运行时文件。")
    }
    do { try output?.synchronize(); try output?.close() }
    catch { failure = RuntimeFailure.local("无法完成运行时缓存写入：\(error.localizedDescription)") }
    finished.signal()
  }
}

private final class RuntimePreparation {
  let info: RuntimeInfo
  let directory: URL
  let binary: URL
  let stateLock = NSLock()
  var stopped = false
  var activeTasks: [ObjectIdentifier: URLSessionTask] = [:]
  var probeDeadline: TimeInterval?
  var probeScores: [RuntimeProbeScore] = []
  var status: (String, String, Double?) -> Void = { _, _, _ in }

  init(info: RuntimeInfo) throws {
    self.info = info
    #if arch(arm64)
    let arch = "arm64"
    let member = "bun-darwin-aarch64/bun"
    #elseif arch(x86_64)
    let arch = "x64"
    let member = "bun-darwin-x64/bun"
    #else
    throw RuntimeFailure.invalid("此 Mac 架构不受支持。")
    #endif
    guard info.schemaVersion == 1, info.platform == "macos", info.arch == arch,
          info.version.range(of: "^[0-9]+\\.[0-9]+\\.[0-9]+$", options: .regularExpression) != nil,
          info.archiveMember == member, info.archiveSize > 32768, info.archiveSize < 500_000_000,
          info.executableSize > 0, info.executableSize < 1_000_000_000,
          [info.archiveSha256, info.executableSha256].allSatisfy({ $0.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil }) else {
      throw RuntimeFailure.invalid("必要运行时配置无效，请重新安装 Toonflow。")
    }
    _ = try Self.source(info.archiveUrl)
    _ = try Self.source(info.mirrorUrl)
    guard !info.sources.isEmpty, info.sources.count <= 16 else {
      throw RuntimeFailure.invalid("必要运行时下载源配置无效，请重新安装 Toonflow。")
    }
    for source in info.sources {
      guard !source.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, source.name.count <= 100 else {
        throw RuntimeFailure.invalid("必要运行时下载源配置无效，请重新安装 Toonflow。")
      }
      _ = try Self.source(source.url)
    }
    let support = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    directory = support.appendingPathComponent("local.toonflow.desktop/runtime/bun/\(info.version)/mac\(arch == "x64" ? "X64" : "Arm64")", isDirectory: true)
    binary = directory.appendingPathComponent("bun")
  }

  static func source(_ value: String) throws -> URL {
    guard value.count <= 8192, let url = URL(string: value), url.scheme == "https",
          let host = url.host, !host.isEmpty, url.user == nil, url.password == nil, url.fragment == nil else {
      throw RuntimeFailure.invalid("请填写完整的 HTTPS 下载地址。")
    }
    return url
  }

  func cancel() {
    stateLock.lock()
    stopped = true
    let tasks = Array(activeTasks.values)
    stateLock.unlock()
    for task in tasks { task.cancel() }
  }

  func requireActive() throws {
    stateLock.lock()
    let stop = stopped
    stateLock.unlock()
    if stop { throw RuntimeFailure.stopped }
  }

  func rejectLinks(_ url: URL) throws {
    var path = url.standardizedFileURL
    while path.path != "/" {
      var attributes = stat()
      if lstat(path.path, &attributes) == 0 {
        if attributes.st_mode & mode_t(S_IFMT) == mode_t(S_IFLNK) {
          throw RuntimeFailure.local("运行时缓存目录不能包含符号链接：\(path.path)")
        }
      } else if errno != ENOENT {
        throw RuntimeFailure.local("无法访问运行时缓存：\(path.path)")
      }
      path.deleteLastPathComponent()
    }
  }

  func verified(_ url: URL, size: Int64, hash: String) throws -> Bool {
    try rejectLinks(url)
    var attributes = stat()
    guard lstat(url.path, &attributes) == 0 else {
      if errno == ENOENT { return false }
      throw RuntimeFailure.local("无法读取运行时文件。")
    }
    guard attributes.st_mode & mode_t(S_IFMT) == mode_t(S_IFREG) else {
      throw RuntimeFailure.local("运行时缓存中存在非普通文件。")
    }
    guard attributes.st_size == size else { return false }
    do {
      let handle = try FileHandle(forReadingFrom: url)
      defer { try? handle.close() }
      var digest = SHA256()
      while let chunk = try handle.read(upToCount: 1024 * 1024), !chunk.isEmpty {
        try requireActive()
        digest.update(data: chunk)
      }
      return digest.finalize().map { String(format: "%02x", $0) }.joined() == hash
    } catch RuntimeFailure.stopped {
      throw RuntimeFailure.stopped
    } catch {
      throw RuntimeFailure.local("无法校验运行时缓存：\(error.localizedDescription)")
    }
  }

  func removeCacheFile(_ url: URL) throws {
    try rejectLinks(url)
    do {
      if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    } catch { throw RuntimeFailure.local("无法清理运行时缓存：\(error.localizedDescription)") }
  }

  func transfer(_ route: RuntimeRoute, part: URL?, probe: Bool, progress: @escaping (Int64) -> Void) throws {
    try requireActive()
    var offset: Int64 = 0
    var output: FileHandle?
    if let part = part {
      try rejectLinks(part)
      let descriptor = open(part.path, O_RDWR | O_CREAT | O_NOFOLLOW, mode_t(0o600))
      guard descriptor >= 0 else { throw RuntimeFailure.local("无法写入运行时缓存，请检查磁盘空间和目录权限。") }
      var attributes = stat()
      guard fstat(descriptor, &attributes) == 0, attributes.st_mode & mode_t(S_IFMT) == mode_t(S_IFREG) else {
        close(descriptor)
        throw RuntimeFailure.local("运行时缓存不是普通文件。")
      }
      offset = attributes.st_size
      output = FileHandle(fileDescriptor: descriptor, closeOnDealloc: true)
      do { try output?.seek(toOffset: UInt64(offset)) }
      catch { try? output?.close(); throw RuntimeFailure.local("无法读取续传缓存：\(error.localizedDescription)") }
    }
    let receiver = RuntimeTransfer(route: route, expectedSize: info.archiveSize, offset: offset, probe: probe, output: output, progress: progress)
    let configuration = URLSessionConfiguration.ephemeral
    configuration.urlCache = nil
    configuration.httpCookieStorage = nil
    configuration.urlCredentialStorage = nil
    configuration.httpShouldSetCookies = false
    configuration.timeoutIntervalForRequest = probe ? 2 : 30
    configuration.timeoutIntervalForResource = probe ? 2 : 1800
    if route.direct {
      configuration.connectionProxyDictionary = ["HTTPEnable": 0, "HTTPSEnable": 0, "SOCKSEnable": 0,
        "ProxyAutoConfigEnable": 0, "ProxyAutoDiscoveryEnable": 0]
    }
    let queue = OperationQueue()
    queue.maxConcurrentOperationCount = 1
    let session = URLSession(configuration: configuration, delegate: receiver, delegateQueue: queue)
    var request = URLRequest(url: route.url, cachePolicy: .reloadIgnoringLocalCacheData)
    request.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
    request.setValue("Toonflow-Runtime", forHTTPHeaderField: "User-Agent")
    if probe { request.setValue("bytes=0-32767", forHTTPHeaderField: "Range") }
    else if offset > 0 { request.setValue("bytes=\(offset)-", forHTTPHeaderField: "Range") }
    let task = session.dataTask(with: request)
    stateLock.lock()
    let remaining = probe ? max(0, (probeDeadline ?? 0) - ProcessInfo.processInfo.systemUptime) : 1800
    activeTasks[ObjectIdentifier(task)] = task
    let stop = stopped
    stateLock.unlock()
    if stop || remaining == 0 { task.cancel() }
    task.resume()
    if probe && receiver.finished.wait(timeout: .now() + min(2, remaining)) == .timedOut {
      task.cancel()
      receiver.finished.wait()
    } else if !probe { receiver.finished.wait() }
    session.finishTasksAndInvalidate()
    stateLock.lock()
    activeTasks.removeValue(forKey: ObjectIdentifier(task))
    let probeEnded = probe && ProcessInfo.processInfo.systemUptime >= (probeDeadline ?? 0)
    stateLock.unlock()
    try requireActive()
    if probeEnded { throw RuntimeFailure.probeEnded }
    if let error = receiver.failure { throw error }
    if !probe && receiver.received != info.archiveSize { throw RuntimeFailure.network("运行时下载未完成，将尝试备用线路。") }
  }

  func rankedRoutes(_ routes: [RuntimeRoute]) throws -> [RuntimeRoute] {
    let queue = OperationQueue()
    queue.maxConcurrentOperationCount = 4
    stateLock.lock()
    probeDeadline = ProcessInfo.processInfo.systemUptime + 6
    probeScores = routes.enumerated().map { RuntimeProbeScore(route: $0.element, index: $0.offset) }
    stateLock.unlock()
    for (index, route) in routes.enumerated() {
      queue.addOperation {
        var score = RuntimeProbeScore(route: route, index: index)
        for _ in 0..<2 {
          self.stateLock.lock()
          let ended = self.stopped || ProcessInfo.processInfo.systemUptime >= (self.probeDeadline ?? 0)
          self.stateLock.unlock()
          if ended { break }
          let start = ProcessInfo.processInfo.systemUptime
          do {
            try self.transfer(route, part: nil, probe: true, progress: { _ in })
            score.attempts += 1
            score.successes += 1
            let duration = ProcessInfo.processInfo.systemUptime - start
            score.duration = score.successes == 1 ? duration : max(score.duration, duration)
          } catch RuntimeFailure.stopped { break }
          catch RuntimeFailure.probeEnded { break }
          catch { score.attempts += 1; break }
        }
        self.stateLock.lock()
        self.probeScores[index] = score
        if score.successes == 2 {
          self.probeDeadline = min(self.probeDeadline ?? .infinity, ProcessInfo.processInfo.systemUptime + 0.5)
        }
        self.stateLock.unlock()
      }
    }
    // ACT: 最多四路小样本并发；可靠线路就绪后只再比较 500ms，未探测线路仍保留下载兜底。
    while queue.operationCount > 0 {
      stateLock.lock()
      let ended = stopped || ProcessInfo.processInfo.systemUptime >= (probeDeadline ?? 0)
      let tasks = ended ? Array(activeTasks.values) : []
      stateLock.unlock()
      if ended {
        queue.cancelAllOperations()
        for task in tasks { task.cancel() }
        break
      }
      Thread.sleep(forTimeInterval: 0.02)
    }
    queue.waitUntilAllOperationsAreFinished()
    stateLock.lock()
    let scores = probeScores
    probeDeadline = nil
    stateLock.unlock()
    try requireActive()
    return scores.sorted {
      if $0.successRate != $1.successRate { return $0.successRate > $1.successRate }
      if $0.successes != $1.successes { return $0.successes > $1.successes }
      if $0.duration != $1.duration { return $0.duration < $1.duration }
      return $0.index < $1.index
    }.map { $0.route }
  }

  func prepare(preferred: String, direct: Bool) throws -> URL {
    try requireActive()
    try rejectLinks(directory)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
    let lockPath = directory.appendingPathComponent("download.lock")
    let descriptor = open(lockPath.path, O_RDWR | O_CREAT | O_NOFOLLOW, mode_t(0o600))
    guard descriptor >= 0 else { throw RuntimeFailure.local("无法锁定运行时缓存。") }
    defer { flock(descriptor, LOCK_UN); close(descriptor) }
    while flock(descriptor, LOCK_EX | LOCK_NB) != 0 {
      guard errno == EWOULDBLOCK else { throw RuntimeFailure.local("无法锁定运行时缓存。") }
      status("正在等待必要运行时准备完成…", "另一个 Toonflow 正在使用运行时缓存。", nil)
      try requireActive()
      Thread.sleep(forTimeInterval: 0.15)
    }
    if try verified(binary, size: info.executableSize, hash: info.executableSha256) {
      guard chmod(binary.path, mode_t(0o700)) == 0 else { throw RuntimeFailure.local("无法设置运行时执行权限。") }
      return binary
    }
    let archive = directory.appendingPathComponent("bun.zip")
    let commonPart = directory.appendingPathComponent("bun.zip.part")
    if try !verified(archive, size: info.archiveSize, hash: info.archiveSha256) {
      let presetUrls = info.sources.map { $0.url }
      var sources = [info.sources.first(where: { $0.url == preferred }) ?? RuntimeSource(name: "自定义源", url: preferred)] + info.sources
      sources = sources.enumerated().filter { index, value in !sources.prefix(index).contains(where: { $0.url == value.url }) }.map { $0.element }
      var routes = try [direct, !direct].flatMap { mode in
        try sources.map { RuntimeRoute(url: try Self.source($0.url), direct: mode, name: $0.name) }
      }
      let preferredKey = SHA256.hash(data: Data(preferred.utf8)).map { String(format: "%02x", $0) }.joined()
      let preferredPart = presetUrls.contains(preferred) ? commonPart : directory.appendingPathComponent("bun.\(preferredKey).part")
      if try !verified(commonPart, size: info.archiveSize, hash: info.archiveSha256)
          && !verified(preferredPart, size: info.archiveSize, hash: info.archiveSha256) {
        status("正在检测下载线路…", "正在自动选择可用线路，请稍候。", nil)
        routes = try rankedRoutes(routes)
      }
      var failures: [String] = []
      var completePart: URL?
      for route in routes {
        try requireActive()
        let preset = presetUrls.contains(route.url.absoluteString)
        let key = SHA256.hash(data: Data(route.url.absoluteString.utf8)).map { String(format: "%02x", $0) }.joined()
        let part = preset ? commonPart : directory.appendingPathComponent("bun.\(key).part")
        do {
          for retry in 0..<2 {
            if try verified(part, size: info.archiveSize, hash: info.archiveSha256) { completePart = part; break }
            try rejectLinks(part)
            let size = (try? FileManager.default.attributesOfItem(atPath: part.path)[.size] as? NSNumber)?.int64Value ?? 0
            if size >= info.archiveSize { try removeCacheFile(part) }
            let start = ProcessInfo.processInfo.systemUptime
            var lastUpdate = start
            status("正在下载必要运行时…", route.description, Double(size < info.archiveSize ? size : 0) / Double(info.archiveSize))
            do {
              try transfer(route, part: part, probe: false) { amount in
                let now = ProcessInfo.processInfo.systemUptime
                if now - lastUpdate >= 0.2 || amount == self.info.archiveSize || amount == 0 {
                  lastUpdate = now
                  self.status("正在下载必要运行时…", route.description + String(format: " · %.1f / %.1f MB", Double(amount) / 1_000_000, Double(self.info.archiveSize) / 1_000_000), Double(amount) / Double(self.info.archiveSize))
                }
              }
            } catch RuntimeFailure.restart {
              try removeCacheFile(part)
              status("正在下载必要运行时…", "当前线路不支持续传，正在重新下载。", 0)
              if retry == 1 { throw RuntimeFailure.restart }
              continue
            }
            status("正在校验必要运行时…", route.description, nil)
            if try verified(part, size: info.archiveSize, hash: info.archiveSha256) { completePart = part; break }
            try removeCacheFile(part)
            if retry == 1 { throw RuntimeFailure.network("运行时文件校验失败。") }
          }
          if completePart != nil { break }
        } catch RuntimeFailure.stopped { throw RuntimeFailure.stopped }
        catch RuntimeFailure.local(let text) { throw RuntimeFailure.local(text) }
        catch {
          if try verified(part, size: info.archiveSize, hash: info.archiveSha256) { completePart = part; break }
          failures.append(route.description + "：" + error.localizedDescription)
          status("正在尝试备用线路…", failures.last ?? "", nil)
        }
      }
      guard let part = completePart else {
        throw RuntimeFailure.network("所有下载线路均未成功，请检查网络后重试。\n" + failures.joined(separator: "\n"))
      }
      try removeCacheFile(archive)
      try FileManager.default.moveItem(at: part, to: archive)
    }
    try requireActive()
    status("正在准备必要运行时…", "正在校验并准备运行环境。", nil)
    let temporary = directory.appendingPathComponent("bun.\(UUID().uuidString).partial")
    let outputDescriptor = open(temporary.path, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, mode_t(0o600))
    guard outputDescriptor >= 0 else { throw RuntimeFailure.local("无法创建运行时文件。") }
    let output = FileHandle(fileDescriptor: outputDescriptor, closeOnDealloc: true)
    defer { try? output.close(); try? FileManager.default.removeItem(at: temporary) }
    let extraction = Process()
    extraction.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
    extraction.arguments = ["-p", archive.path, info.archiveMember]
    extraction.standardOutput = output
    extraction.standardError = FileHandle.nullDevice
    try extraction.run()
    while extraction.isRunning {
      do { try requireActive() } catch { extraction.terminate(); extraction.waitUntilExit(); throw error }
      Thread.sleep(forTimeInterval: 0.05)
    }
    extraction.waitUntilExit()
    try output.synchronize()
    try output.close()
    guard extraction.terminationStatus == 0, try verified(temporary, size: info.executableSize, hash: info.executableSha256) else {
      throw RuntimeFailure.invalid("运行时解压校验失败，请重新下载。")
    }
    guard chmod(temporary.path, mode_t(0o700)) == 0 else { throw RuntimeFailure.local("无法设置运行时执行权限。") }
    try removeCacheFile(binary)
    try FileManager.default.moveItem(at: temporary, to: binary)
    return binary
  }
}

private final class RuntimeApplication: NSObject, NSApplicationDelegate, NSWindowDelegate, NSTextFieldDelegate {
  let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 600, height: 235), styleMask: [.titled, .closable], backing: .buffered, defer: false)
  let root = NSStackView()
  let statusLabel = NSTextField(labelWithString: "正在准备必要运行时…")
  let detailLabel = NSTextField(wrappingLabelWithString: "完成后将自动打开 Toonflow。")
  let progress = NSProgressIndicator()
  let toggle = NSButton(title: "高级设置（可选）", target: nil, action: nil)
  let pause = NSButton(title: "暂停下载", target: nil, action: nil)
  let cancel = NSButton(title: "取消", target: nil, action: nil)
  let advanced = NSStackView()
  let source = NSPopUpButton(frame: .zero, pullsDown: false)
  let network = NSPopUpButton(frame: .zero, pullsDown: false)
  let address = NSTextField(string: "")
  let technical = NSTextField(wrappingLabelWithString: "")
  var preparation: RuntimePreparation?
  var info: RuntimeInfo?
  var busy = false
  var quitting = false
  var advancedVisible = false
  var latestTechnical = ""
  var pendingUrls: [String] = []
  let preparationResources: URL?
  let installerPid: pid_t?
  var installerTimer: Timer?

  var completionMessage: String {
    preparationResources == nil ? "完成后将自动打开 Toonflow。" : "完成后将继续安装。"
  }

  init(preparationResources: URL? = nil, installerPid: pid_t? = nil) {
    self.preparationResources = preparationResources
    self.installerPid = installerPid
    super.init()
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    if let installerPid = installerPid {
      let timer = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
        guard kill(installerPid, 0) == -1 && errno == ESRCH, let self = self else { return }
        self.preparation?.cancel()
        self.finish(EXIT_FAILURE)
      }
      installerTimer = timer
      RunLoop.main.add(timer, forMode: .common)
      timer.fire()
    }
    window.title = "必要运行时下载"
    window.delegate = self
    window.isReleasedWhenClosed = false
    root.orientation = .vertical
    root.alignment = .leading
    root.spacing = 14
    root.edgeInsets = NSEdgeInsets(top: 24, left: 24, bottom: 20, right: 24)
    root.translatesAutoresizingMaskIntoConstraints = false
    window.contentView!.addSubview(root)
    NSLayoutConstraint.activate([root.leadingAnchor.constraint(equalTo: window.contentView!.leadingAnchor),
      root.trailingAnchor.constraint(equalTo: window.contentView!.trailingAnchor),
      root.topAnchor.constraint(equalTo: window.contentView!.topAnchor)])
    statusLabel.font = .systemFont(ofSize: 13)
    progress.style = .bar
    progress.isIndeterminate = true
    progress.minValue = 0
    progress.maxValue = 1
    progress.startAnimation(nil)
    detailLabel.textColor = .secondaryLabelColor
    detailLabel.font = .systemFont(ofSize: 12)
    detailLabel.stringValue = completionMessage
    let primaryViews: [NSView] = [statusLabel, progress, detailLabel]
    for view in primaryViews { root.addArrangedSubview(view) }
    progress.widthAnchor.constraint(equalTo: root.widthAnchor, constant: -48).isActive = true
    detailLabel.widthAnchor.constraint(equalTo: progress.widthAnchor).isActive = true
    detailLabel.heightAnchor.constraint(equalToConstant: 36).isActive = true
    let actions = NSStackView(views: [toggle, NSView(), pause, cancel])
    actions.orientation = .horizontal
    actions.spacing = 10
    root.addArrangedSubview(actions)
    actions.widthAnchor.constraint(equalTo: progress.widthAnchor).isActive = true
    toggle.target = self; toggle.action = #selector(toggleAdvanced)
    pause.target = self; pause.action = #selector(pauseDownload)
    cancel.target = self; cancel.action = #selector(cancelDownload)
    network.addItems(withTitles: ["自动（优先系统代理）", "自动（优先直连）"])
    source.target = self; source.action = #selector(settingsChanged)
    network.target = self; network.action = #selector(settingsChanged)
    address.delegate = self
    advanced.orientation = .vertical; advanced.alignment = .leading; advanced.spacing = 10
    let advancedViews: [NSView] = [source, network, address, technical]
    for view in advancedViews { advanced.addArrangedSubview(view) }
    root.addArrangedSubview(advanced)
    advanced.isHidden = true
    advanced.widthAnchor.constraint(equalTo: progress.widthAnchor).isActive = true
    address.widthAnchor.constraint(equalTo: progress.widthAnchor).isActive = true
    technical.widthAnchor.constraint(equalTo: progress.widthAnchor).isActive = true
    technical.maximumNumberOfLines = 6
    technical.font = .systemFont(ofSize: 11)
    technical.textColor = .secondaryLabelColor
    technical.isSelectable = true
    address.isEditable = false
    window.center()
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
    do {
      guard let resources = preparationResources ?? Bundle.main.resourceURL else { throw RuntimeFailure.invalid("找不到 Toonflow 应用资源。") }
      let configuration = resources.appendingPathComponent("runtimeInfo.json")
      info = try JSONDecoder().decode(RuntimeInfo.self, from: Data(contentsOf: configuration))
      source.addItems(withTitles: info!.sources.map { $0.name } + ["自定义 HTTPS 地址"])
      address.stringValue = info!.sources.first?.url ?? info!.mirrorUrl
      startDownload()
    } catch {
      if preparationResources != nil {
        fputs("\(error.localizedDescription)\n", stderr)
        finish(EXIT_FAILURE)
      } else { showFailure(error) }
    }
  }

  func application(_ application: NSApplication, open urls: [URL]) {
    for url in urls where url.scheme == "toonflow" && url.absoluteString.count <= 8192 {
      if pendingUrls.count < 20 && !pendingUrls.contains(url.absoluteString) { pendingUrls.append(url.absoluteString) }
    }
  }

  @objc func toggleAdvanced() {
    advancedVisible.toggle()
    advanced.isHidden = !advancedVisible
    toggle.title = advancedVisible ? "收起高级设置" : "高级设置（可选）"
    if advancedVisible { technical.stringValue = latestTechnical }
    let height: CGFloat = advancedVisible ? 470 : 235
    var frame = window.frame
    frame.origin.y += frame.height - (height + window.frame.height - window.contentRect(forFrameRect: window.frame).height)
    frame.size.height = height + window.frame.height - window.contentRect(forFrameRect: window.frame).height
    window.setFrame(frame, display: true)
  }

  @objc func settingsChanged() {
    if let info = info {
      let index = source.indexOfSelectedItem
      if info.sources.indices.contains(index) { address.stringValue = info.sources[index].url }
      address.isEditable = index == info.sources.count
    }
    if busy { preparation?.cancel(); pause.isEnabled = false; statusLabel.stringValue = "正在暂停，请稍候…" }
  }

  func controlTextDidChange(_ notification: Notification) { settingsChanged() }

  @objc func pauseDownload() {
    if busy { preparation?.cancel(); pause.isEnabled = false; statusLabel.stringValue = "正在暂停，请稍候…" }
    else { startDownload() }
  }

  @objc func cancelDownload() {
    quitting = true
    if busy { preparation?.cancel(); pause.isEnabled = false; cancel.isEnabled = false }
    else { finish(EXIT_FAILURE) }
  }

  func finish(_ status: Int32) {
    installerTimer?.invalidate()
    if preparationResources != nil { exit(status) }
    NSApp.terminate(nil)
  }

  func windowShouldClose(_ sender: NSWindow) -> Bool { cancelDownload(); return !busy }

  func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
    if busy { cancelDownload(); return .terminateCancel }
    if preparationResources != nil { finish(EXIT_FAILURE) }
    return .terminateNow
  }

  func startDownload() {
    guard !busy, let info = info else { return }
    do {
      let worker = try RuntimePreparation(info: info)
      let preferred = address.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
      _ = try RuntimePreparation.source(preferred)
      let direct = network.indexOfSelectedItem == 1
      preparation = worker
      busy = true
      pause.title = "暂停下载"; pause.isEnabled = true
      if progress.isIndeterminate { progress.startAnimation(nil) }
      showStatus("正在准备必要运行时…", detail: completionMessage, value: nil)
      worker.status = { [weak self, weak worker] text, detail, value in
        DispatchQueue.main.async {
          guard let self = self, let worker = worker, self.preparation === worker, self.busy, self.pause.isEnabled else { return }
          self.showStatus(text, detail: detail, value: value)
        }
      }
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          let binary = try worker.prepare(preferred: preferred, direct: direct)
          DispatchQueue.main.async {
            guard self.preparation === worker else { return }
            self.busy = false
            if self.quitting { self.finish(EXIT_FAILURE); return }
            do {
              try worker.requireActive()
              if self.preparationResources != nil { self.finish(EXIT_SUCCESS); return }
              try self.launch(binary)
            } catch { self.showFailure(error) }
          }
        } catch {
          DispatchQueue.main.async {
            guard self.preparation === worker else { return }
            self.busy = false
            if self.quitting { self.finish(EXIT_FAILURE); return }
            self.showFailure(error)
          }
        }
      }
    } catch { showFailure(error) }
  }

  func showStatus(_ text: String, detail: String, value: Double?) {
    if statusLabel.stringValue != text { statusLabel.stringValue = text }
    latestTechnical = detail
    if advancedVisible && technical.currentEditor() == nil { technical.stringValue = detail }
    detailLabel.stringValue = value == nil ? completionMessage : detail
    let indeterminate = value == nil
    if progress.isIndeterminate != indeterminate {
      progress.isIndeterminate = indeterminate
      if indeterminate { progress.startAnimation(nil) } else { progress.stopAnimation(nil) }
    }
    if let value = value { progress.doubleValue = value }
  }

  func showFailure(_ error: Error) {
    busy = false
    progress.stopAnimation(nil)
    pause.isEnabled = true
    latestTechnical = error.localizedDescription
    if advancedVisible { technical.stringValue = latestTechnical }
    if case RuntimeFailure.stopped = error {
      pause.title = "继续下载"
      statusLabel.stringValue = "已暂停"
      detailLabel.stringValue = "已下载的内容会保留，点击继续即可。"
    } else {
      pause.title = "重试"
      statusLabel.stringValue = "必要运行时尚未准备好"
      detailLabel.stringValue = error.localizedDescription.components(separatedBy: "\n").first ?? "请检查网络后重试。"
    }
  }

  func launch(_ binary: URL) throws {
    guard let resources = Bundle.main.resourceURL else { throw RuntimeFailure.invalid("找不到 Toonflow 应用资源。") }
    let bin = resources.deletingLastPathComponent().appendingPathComponent("MacOS", isDirectory: true)
    guard chdir(bin.path) == 0 else { throw RuntimeFailure.local("无法打开 Toonflow 应用目录。") }
    // ACT: Core 按真实 Bun 路径查库；固定到应用目录，主线程和 Worker 加载同一份原生库。
    guard setenv("DYLD_LIBRARY_PATH", bin.path, 1) == 0 else { throw RuntimeFailure.local("无法设置 Toonflow 原生库目录。") }
    if !pendingUrls.isEmpty {
      let data = try JSONSerialization.data(withJSONObject: pendingUrls)
      setenv("TOONFLOW_PENDING_URLS", String(decoding: data, as: UTF8.self), 1)
    } else { unsetenv("TOONFLOW_PENDING_URLS") }
    // ACT: 保留 SDK 传入的 argv[0] 与所有参数；exec 后 PID 不变，原 launcher 继续管理进程生命周期。
    let arguments = [bin.appendingPathComponent("bun").path] + Array(CommandLine.arguments.dropFirst())
    var pointers = arguments.map { strdup($0) }
    pointers.append(nil)
    defer { for pointer in pointers { free(pointer) } }
    window.orderOut(nil)
    execv(binary.path, &pointers)
    window.makeKeyAndOrderFront(nil)
    throw RuntimeFailure.local("无法启动必要运行时：\(String(cString: strerror(errno)))")
  }
}

@main
private enum RuntimeLauncher {
  static func main() {
    let arguments = CommandLine.arguments
    var preparationResources: URL?
    var installerPid: pid_t?
    if arguments.dropFirst().first == "--prepare-runtime" {
      guard arguments.count == 4, arguments[2].hasPrefix("/"),
        let processId = pid_t(arguments[3]), processId > 1 else {
        fputs("用法：--prepare-runtime <资源目录绝对路径> <安装脚本PID>\n", stderr)
        exit(EXIT_FAILURE)
      }
      var isDirectory: ObjCBool = false
      guard FileManager.default.fileExists(atPath: arguments[2], isDirectory: &isDirectory), isDirectory.boolValue else {
        fputs("运行时资源目录不存在。\n", stderr)
        exit(EXIT_FAILURE)
      }
      preparationResources = URL(fileURLWithPath: arguments[2], isDirectory: true)
      installerPid = processId
    }
    let application = NSApplication.shared
    let delegate = RuntimeApplication(preparationResources: preparationResources, installerPid: installerPid)
    application.setActivationPolicy(.regular)
    application.delegate = delegate
    withExtendedLifetime(delegate) { application.run() }
  }
}
