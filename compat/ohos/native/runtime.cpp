#include <napi/native_api.h>
#include <hilog/log.h>

#include <cerrno>
#include <chrono>
#include <condition_variable>
#include <cstring>
#include <elf.h>
#include <fcntl.h>
#include <memory>
#include <mutex>
#include <poll.h>
#include <regex>
#include <signal.h>
#include <spawn.h>
#include <stdexcept>
#include <string>
#include <sys/stat.h>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>
#include <vector>

extern char **environ;

namespace {
struct RuntimeState {
  napi_async_work work = nullptr;
  napi_deferred deferred = nullptr;
  std::string runtimePath, programDir, dataDir, cacheDir;
  std::string url, error, outputTail;
  std::mutex mutex;
  std::condition_variable condition;
  pid_t pid = -1;
  bool stopping = false;
  bool stopRequested = false;
  bool exited = false;
};

// ACT: 一个应用实例只运行一个本地服务；多窗口共享此进程。
std::mutex runtimeMutex;
std::shared_ptr<RuntimeState> activeRuntime;
std::string lastRuntimeError;

void releaseRuntime(const std::shared_ptr<RuntimeState> &state) {
  std::lock_guard<std::mutex> runtimeLock(runtimeMutex);
  if (activeRuntime != state) return;
  std::lock_guard<std::mutex> stateLock(state->mutex);
  if (!state->stopRequested && !state->error.empty()) {
    lastRuntimeError = state->error.substr(0, 8192);
    if (!state->outputTail.empty() && lastRuntimeError.size() < 8190) {
      const auto logLimit = 8190 - lastRuntimeError.size();
      lastRuntimeError += "\n\n" + state->outputTail.substr(state->outputTail.size() > logLimit ? state->outputTail.size() - logLimit : 0);
    }
  }
  activeRuntime.reset();
}

void stopRuntime(void *) {
  std::shared_ptr<RuntimeState> state;
  std::unique_lock<std::mutex> stateLock;
  {
    std::lock_guard<std::mutex> runtimeLock(runtimeMutex);
    state = activeRuntime;
    lastRuntimeError.clear();
    if (!state) return;
    stateLock = std::unique_lock<std::mutex>(state->mutex);
    state->stopping = true;
    state->stopRequested = true;
  }
  if (state->pid > 0) {
    kill(state->pid, SIGTERM);
    if (!state->condition.wait_for(stateLock, std::chrono::seconds(1), [&] { return state->exited; })) {
      if (state->pid > 0) kill(state->pid, SIGKILL);
      state->condition.wait(stateLock, [&] { return state->exited; });
    }
  } else {
    state->exited = true;
  }
  state->condition.notify_all();
  stateLock.unlock();
  releaseRuntime(state);
}

std::string validateRuntime(const std::string &runtimePath) {
#if defined(__aarch64__)
  const auto expectedMachine = EM_AARCH64;
  const std::string architecture = "arm64";
#elif defined(__x86_64__)
  const auto expectedMachine = EM_X86_64;
  const std::string architecture = "x86_64";
#else
  return "当前设备架构不受 OHOS Bun 支持";
#endif
  const auto file = open(runtimePath.c_str(), O_RDONLY | O_CLOEXEC);
  if (file < 0) {
    return "安装包缺少 " + architecture + " OHOS Bun 运行时：" + std::strerror(errno) +
      (architecture == "x86_64" ? "。ARM64 Bun 不能在此 x86_64 模拟器运行，请使用 ARM64 鸿蒙设备或提供 x86_64 OHOS Bun" : "");
  }
  Elf64_Ehdr header{};
  const auto size = read(file, &header, sizeof(header));
  close(file);
  if (size != sizeof(header) || std::memcmp(header.e_ident, ELFMAG, SELFMAG) != 0 ||
      header.e_ident[EI_CLASS] != ELFCLASS64 || header.e_ident[EI_DATA] != ELFDATA2LSB) {
    return "Bun 运行时不是有效的 64 位 ELF 可执行文件";
  }
  if (header.e_machine != expectedMachine) {
    return "Bun 运行时与当前 " + architecture + " 设备架构不匹配" +
      (architecture == "x86_64" ? "，缺少 x86_64 OHOS Bun；ARM64 Bun 不能在此模拟器运行" : "");
  }
  if (chmod(runtimePath.c_str(), 0700) != 0) return "无法设置 Bun 执行权限：" + std::string(std::strerror(errno)) + "（errno=" + std::to_string(errno) + "）";
  return "";
}

void readOutputLine(RuntimeState &state, const std::string &line) {
  const std::string prefix = "TOONFLOW_MOBILE_URL=";
  if (line.compare(0, prefix.size(), prefix) != 0) {
    // 只保留诊断末段，不向 hilog 输出启动令牌。
    state.outputTail += std::regex_replace(line, std::regex("token=[^\\s&]+"), "token=[redacted]") + "\n";
    if (state.outputTail.size() > 8192) state.outputTail.erase(0, state.outputTail.size() - 8192);
    return;
  }
  const auto url = line.substr(prefix.size());
  std::smatch match;
  const std::regex urlPattern("^http://127[.]0[.]0[.]1:([0-9]{1,5})/[?]token=[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$");
  if (!std::regex_match(url, match, urlPattern) || std::stoi(match[1].str()) < 1 || std::stoi(match[1].str()) > 65535) {
    state.error = "Bun 返回了无效的本地服务地址";
    state.stopping = true;
    if (state.pid > 0) kill(state.pid, SIGKILL);
  } else if (state.url.empty() && !state.stopping) {
    state.url = url;
  }
  state.condition.notify_all();
}

void monitorRuntime(std::shared_ptr<RuntimeState> state, int outputPipe) {
  std::string pending;
  const auto consumeOutput = [&](const char *buffer, size_t size) {
    pending.append(buffer, size);
    size_t newline;
    while ((newline = pending.find('\n')) != std::string::npos) {
      auto line = pending.substr(0, newline);
      if (!line.empty() && line.back() == '\r') line.pop_back();
      readOutputLine(*state, line);
      pending.erase(0, newline + 1);
    }
    // ACT: 压缩源码可能是一整行，只保留最后 8 KiB 诊断，避免无界增长。
    if (pending.size() > 8192) pending.erase(0, pending.size() - 8192);
  };
  try {
    bool outputClosed = false;
    while (true) {
      pollfd descriptor{outputPipe, POLLIN, 0};
      const auto polled = outputClosed ? 0 : poll(&descriptor, 1, 200);
      if (polled < 0 && errno != EINTR) throw std::runtime_error(std::strerror(errno));
      if (outputClosed) std::this_thread::sleep_for(std::chrono::milliseconds(100));
      if (polled > 0) {
        char buffer[4096];
        const auto count = read(outputPipe, buffer, sizeof(buffer));
        if (count > 0) {
          std::lock_guard<std::mutex> lock(state->mutex);
          consumeOutput(buffer, count);
        } else if (count == 0) outputClosed = true;
        else if (errno != EINTR && errno != EAGAIN) throw std::runtime_error(std::strerror(errno));
      }
      std::lock_guard<std::mutex> lock(state->mutex);
      int status = 0;
      const auto waited = waitpid(state->pid, &status, WNOHANG);
      const auto waitError = errno;
      if (waited == 0 || (waited < 0 && errno == EINTR)) continue;
      state->pid = -1;
      state->exited = true;
      // ACT: 退出后最多排空 64 KiB，避免继承管道的子进程持续输出阻塞回收。
      if (fcntl(outputPipe, F_SETFL, O_NONBLOCK) == 0) {
        char buffer[4096];
        for (size_t total = 0; total < 65536;) {
          const auto count = read(outputPipe, buffer, sizeof(buffer));
          if (count <= 0) break;
          total += count;
          consumeOutput(buffer, count);
        }
      }
      if (!pending.empty()) readOutputLine(*state, pending);
      if (state->error.empty()) {
        state->error = state->stopping ? "本地 Bun 服务已停止" :
          waited < 0 ? "无法回收 Bun 进程：" + std::string(std::strerror(waitError)) :
          "Bun 已退出，" + (WIFEXITED(status) ? "退出码：" + std::to_string(WEXITSTATUS(status)) : "信号：" + std::to_string(WTERMSIG(status)));
      }
      if (!state->stopping) OH_LOG_Print(LOG_APP, LOG_ERROR, 0, "ToonflowRuntime", "%{public}s\n%{public}s", state->error.c_str(), state->outputTail.c_str());
      state->condition.notify_all();
      break;
    }
  } catch (const std::exception &error) {
    std::lock_guard<std::mutex> lock(state->mutex);
    if (state->pid > 0) {
      kill(state->pid, SIGKILL);
      while (waitpid(state->pid, nullptr, 0) < 0 && errno == EINTR) {}
      state->pid = -1;
    }
    state->error = "读取本地 Bun 服务输出失败：" + std::string(error.what());
    state->exited = true;
    OH_LOG_Print(LOG_APP, LOG_ERROR, 0, "ToonflowRuntime", "%{public}s", state->error.c_str());
    state->condition.notify_all();
  }
  close(outputPipe);
  releaseRuntime(state);
}

void executeStart(napi_env, void *data) {
  auto state = *static_cast<std::shared_ptr<RuntimeState> *>(data);
  int outputPipe[2] = {-1, -1};
  bool monitoring = false;
  try {
    const auto validation = validateRuntime(state->runtimePath);
    if (!validation.empty()) throw std::runtime_error(validation);
    const auto programPath = state->programDir + "/server.js";
    if (access(programPath.c_str(), R_OK) != 0) throw std::runtime_error("安装包中缺少 server.js");
    if (pipe2(outputPipe, O_CLOEXEC) != 0) throw std::runtime_error(std::strerror(errno));
    for (auto &descriptor : outputPipe) {
      if (descriptor > STDERR_FILENO) continue;
      const auto duplicate = fcntl(descriptor, F_DUPFD_CLOEXEC, STDERR_FILENO + 1);
      if (duplicate < 0) throw std::runtime_error(std::strerror(errno));
      close(descriptor);
      descriptor = duplicate;
    }
    std::vector<std::string> environment;
    for (auto entry = environ; *entry; ++entry) {
      const std::string value = *entry;
      const auto name = value.substr(0, value.find('='));
      if (name != "TOONFLOW_PLATFORM" && name != "TOONFLOW_MOBILE_DATA_DIR" && name != "TOONFLOW_MOBILE_DEVICE_NAME" && name != "TMPDIR" && name != "HOME" && name != "SHELL") {
        environment.push_back(value);
      }
    }
    environment.push_back("TOONFLOW_MOBILE_DATA_DIR=" + state->dataDir);
    environment.push_back("TOONFLOW_PLATFORM=ohos");
    environment.push_back("TOONFLOW_MOBILE_DEVICE_NAME=Toonflow HarmonyOS");
    environment.push_back("TMPDIR=" + state->cacheDir);
    environment.push_back("HOME=" + state->dataDir.substr(0, state->dataDir.find_last_of('/')));
    environment.push_back("SHELL=/system/bin/sh");
    std::vector<char *> environmentPointers;
    for (auto &value : environment) environmentPointers.push_back(value.data());
    environmentPointers.push_back(nullptr);
    char *arguments[] = {state->runtimePath.data(), const_cast<char *>("--no-orphans"), const_cast<char *>(programPath.c_str()), nullptr};
    posix_spawn_file_actions_t actions;
    auto result = posix_spawn_file_actions_init(&actions);
    if (result != 0) throw std::runtime_error(std::strerror(result));
    result = posix_spawn_file_actions_adddup2(&actions, outputPipe[1], STDOUT_FILENO);
    if (result == 0) result = posix_spawn_file_actions_adddup2(&actions, outputPipe[1], STDERR_FILENO);
    if (result == 0) result = posix_spawn_file_actions_addclose(&actions, outputPipe[0]);
    if (result == 0) result = posix_spawn_file_actions_addclose(&actions, outputPipe[1]);
    {
      std::lock_guard<std::mutex> lock(state->mutex);
      if (state->stopping) result = ECANCELED;
      if (result == 0) {
        pid_t pid = -1;
        result = posix_spawn(&pid, state->runtimePath.c_str(), &actions, nullptr, arguments, environmentPointers.data());
        if (result == 0) state->pid = pid;
      }
    }
    posix_spawn_file_actions_destroy(&actions);
    if (result != 0) throw std::runtime_error("无法创建 Bun 进程：" + std::string(std::strerror(result)));
    close(outputPipe[1]);
    outputPipe[1] = -1;
    std::thread(monitorRuntime, state, outputPipe[0]).detach();
    monitoring = true;
    outputPipe[0] = -1;
    std::unique_lock<std::mutex> lock(state->mutex);
    if (!state->condition.wait_for(lock, std::chrono::seconds(60), [&] { return !state->url.empty() || !state->error.empty() || state->stopping; })) {
      state->error = "本地 Bun 服务启动超时（60 秒）";
      state->stopping = true;
      if (state->pid > 0) kill(state->pid, SIGKILL);
    }
    if (state->stopping && state->error.empty()) state->error = "本地 Bun 服务已停止";
  } catch (const std::exception &error) {
    std::lock_guard<std::mutex> lock(state->mutex);
    state->error = error.what();
    if (state->pid > 0) {
      kill(state->pid, SIGKILL);
      if (!monitoring) {
        while (waitpid(state->pid, nullptr, 0) < 0 && errno == EINTR) {}
        state->pid = -1;
      }
    }
  }
  for (auto descriptor : outputPipe) if (descriptor >= 0) close(descriptor);
  if (!monitoring) {
    {
      std::lock_guard<std::mutex> lock(state->mutex);
      state->exited = true;
      state->condition.notify_all();
    }
    releaseRuntime(state);
  }
}

void completeStart(napi_env env, napi_status status, void *data) {
  std::unique_ptr<std::shared_ptr<RuntimeState>> reference(static_cast<std::shared_ptr<RuntimeState> *>(data));
  auto state = *reference;
  std::lock_guard<std::mutex> lock(state->mutex);
  if (status != napi_ok && state->error.empty()) state->error = "本地 Bun 启动任务被取消";
  napi_value value;
  if (!state->error.empty() || state->url.empty() || state->stopping || state->exited) {
    const auto message = (state->error.empty() ? "本地 Bun 服务未启动" : state->error) +
      (state->outputTail.empty() ? "" : "\n\n" + state->outputTail);
    napi_create_string_utf8(env, message.c_str(), message.size(), &value);
    napi_value error;
    napi_create_error(env, nullptr, value, &error);
    napi_reject_deferred(env, state->deferred, error);
  } else {
    napi_create_string_utf8(env, state->url.c_str(), state->url.size(), &value);
    napi_resolve_deferred(env, state->deferred, value);
  }
  if (state->work) napi_delete_async_work(env, state->work);
}

napi_value start(napi_env env, napi_callback_info info) {
  auto state = std::make_shared<RuntimeState>();
  napi_value promise;
  napi_create_promise(env, &state->deferred, &promise);
  size_t count = 4;
  napi_value arguments[4];
  napi_get_cb_info(env, info, &count, arguments, nullptr, nullptr);
  std::string *paths[] = {&state->runtimePath, &state->programDir, &state->dataDir, &state->cacheDir};
  for (size_t index = 0; index < count && index < 4; index++) {
    size_t length = 0;
    if (napi_get_value_string_utf8(env, arguments[index], nullptr, 0, &length) != napi_ok || length == 0 || length > 4096) break;
    std::vector<char> buffer(length + 1);
    napi_get_value_string_utf8(env, arguments[index], buffer.data(), buffer.size(), &length);
    paths[index]->assign(buffer.data(), length);
  }
  for (auto path : paths) {
    if (path->empty() || path->front() != '/' || path->find('\0') != std::string::npos) state->error = "Bun 启动参数必须是四个有效绝对路径";
  }
  if (count != 4) state->error = "Bun 启动参数必须是四个有效绝对路径";
  {
    std::lock_guard<std::mutex> lock(runtimeMutex);
    if (activeRuntime) state->error = "本地 Bun 服务正在启动或运行，请先停止";
    else if (state->error.empty()) {
      lastRuntimeError.clear();
      activeRuntime = state;
    }
  }
  auto reference = new std::shared_ptr<RuntimeState>(state);
  napi_value name;
  napi_create_string_utf8(env, "startBun", NAPI_AUTO_LENGTH, &name);
  if (!state->error.empty()) {
    completeStart(env, napi_ok, reference);
    return promise;
  }
  if (napi_create_async_work(env, nullptr, name, executeStart, completeStart, reference, &state->work) != napi_ok || napi_queue_async_work(env, state->work) != napi_ok) {
    state->error = "无法创建本地 Bun 启动任务";
    releaseRuntime(state);
    completeStart(env, napi_generic_failure, reference);
  }
  return promise;
}

napi_value stop(napi_env env, napi_callback_info) {
  stopRuntime(nullptr);
  napi_value value;
  napi_get_undefined(env, &value);
  return value;
}

napi_value getError(napi_env env, napi_callback_info) {
  std::lock_guard<std::mutex> lock(runtimeMutex);
  napi_value value;
  napi_create_string_utf8(env, lastRuntimeError.c_str(), lastRuntimeError.size(), &value);
  return value;
}

napi_value initialize(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
    {"start", nullptr, start, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"stop", nullptr, stop, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"getError", nullptr, getError, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
  napi_add_env_cleanup_hook(env, stopRuntime, nullptr);
  return exports;
}
}

static napi_module runtimeModule = {1, 0, nullptr, initialize, "toonflowRuntime", nullptr, {0}};

extern "C" __attribute__((constructor)) void registerRuntime() {
  napi_module_register(&runtimeModule);
}
