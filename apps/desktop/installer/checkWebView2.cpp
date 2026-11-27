// 安装器独立检测程序：按目标架构原生编译并静态链接 WebView2Loader，不依赖 .NET。
#include <windows.h>
#include <objbase.h>
#include <shellapi.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <softpub.h>
#include <wrl/client.h>
#include <atomic>
#include <filesystem>
#include <functional>
#include <regex>
#include <string>
#include <vector>
#include "WebView2.h"

using Microsoft::WRL::ComPtr;

namespace {

// ACT: URL.canParse 需要 Chromium 120；同时覆盖 Map.groupBy 和 Promise.withResolvers。
const wchar_t minimumVersion[] = L"120.0.0.0";
std::atomic<const wchar_t*> stage{L"version"};
std::wstring runtimeVersion = L"<none>";
std::wstring userDataFolder = L"<none>";
std::wstring account = L"<unknown>";
bool elevated = false;

HWND window = nullptr;
HANDLE watchdogCancel = nullptr;
ComPtr<ICoreWebView2Environment> environment;
ComPtr<ICoreWebView2Controller> controller;
std::wstring nonce;
bool navigationCompleted = false;
bool scriptCompleted = false;
bool completed = false;
bool browserExited = false;
bool cleanedUp = false;
int probeResult = 2;

// 按控制台输出代码页编码，无控制台时回退 OEM 代码页，供 nsExec 正确读取中文路径。
void writeLine(const std::wstring& text) {
  std::wstring line = text + L"\r\n";
  UINT codePage = GetConsoleOutputCP();
  if (!codePage) codePage = CP_OEMCP;
  int size = WideCharToMultiByte(codePage, 0, line.c_str(), static_cast<int>(line.size()), nullptr, 0, nullptr, nullptr);
  if (size <= 0) return;
  std::string bytes(size, '\0');
  WideCharToMultiByte(codePage, 0, line.c_str(), static_cast<int>(line.size()), bytes.data(), size, nullptr, nullptr);
  DWORD written = 0;
  WriteFile(GetStdHandle(STD_OUTPUT_HANDLE), bytes.data(), static_cast<DWORD>(bytes.size()), &written, nullptr);
}

void log(const std::wstring& message, HRESULT hresult) {
  wchar_t code[9];
  swprintf_s(code, L"%08X", static_cast<unsigned>(hresult));
  writeLine(L"WebView2 " + message + L"; stage=" + stage.load() + L"; HRESULT=0x" + code + L"; version=" + runtimeVersion
    + L"; account=" + account + L"; elevated=" + (elevated ? L"True" : L"False") + L"; profile=" + userDataFolder);
}

HRESULT lastError() {
  return HRESULT_FROM_WIN32(GetLastError());
}

std::wstring newGuid() {
  GUID guid{};
  CoCreateGuid(&guid);
  wchar_t text[33];
  swprintf_s(text, L"%08lx%04hx%04hx%02x%02x%02x%02x%02x%02x%02x%02x", guid.Data1, guid.Data2, guid.Data3, guid.Data4[0],
    guid.Data4[1], guid.Data4[2], guid.Data4[3], guid.Data4[4], guid.Data4[5], guid.Data4[6], guid.Data4[7]);
  return text;
}

std::wstring fullPath(const std::wstring& path) {
  DWORD size = GetFullPathNameW(path.c_str(), 0, nullptr, nullptr);
  if (!size) return L"";
  std::wstring result(size, L'\0');
  result.resize(GetFullPathNameW(path.c_str(), size, result.data(), nullptr));
  return result;
}

bool sameText(const std::wstring& left, const std::wstring& right) {
  return CompareStringOrdinal(left.c_str(), static_cast<int>(left.size()), right.c_str(), static_cast<int>(right.size()), TRUE) == CSTR_EQUAL;
}

template <typename Interface, typename Method = decltype(&Interface::Invoke)>
class callback;

// 最小 COM 回调对象：只实现 IUnknown 与 Invoke，避免引入 WRL 运行时实现。
template <typename Interface, typename Owner, typename... Args>
class callback<Interface, HRESULT (STDMETHODCALLTYPE Owner::*)(Args...)> final : public Interface {
public:
  explicit callback(std::function<HRESULT(Args...)> handler) : handler(std::move(handler)) {}

  ULONG STDMETHODCALLTYPE AddRef() override {
    return static_cast<ULONG>(InterlockedIncrement(&references));
  }

  ULONG STDMETHODCALLTYPE Release() override {
    LONG count = InterlockedDecrement(&references);
    if (!count) delete this;
    return static_cast<ULONG>(count);
  }

  HRESULT STDMETHODCALLTYPE QueryInterface(REFIID iid, void** object) override {
    if (!object) return E_POINTER;
    if (iid != __uuidof(Interface) && iid != __uuidof(IUnknown)) {
      *object = nullptr;
      return E_NOINTERFACE;
    }
    *object = static_cast<Interface*>(this);
    AddRef();
    return S_OK;
  }

  HRESULT STDMETHODCALLTYPE Invoke(Args... args) override {
    return handler(args...);
  }

private:
  ~callback() = default;
  LONG references = 1;
  std::function<HRESULT(Args...)> handler;
};

template <typename Interface, typename Function>
ComPtr<Interface> makeCallback(Function function) {
  ComPtr<Interface> result;
  result.Attach(new callback<Interface>(std::move(function)));
  return result;
}

int checkVersion() {
  LPWSTR versionInfo = nullptr;
  HRESULT result = GetAvailableCoreWebView2BrowserVersionString(nullptr, &versionInfo);
  runtimeVersion = versionInfo ? versionInfo : L"<none>";
  CoTaskMemFree(versionInfo);
  int comparison = 0;
  if (SUCCEEDED(result)) result = CompareBrowserVersions(runtimeVersion.c_str(), L"0.0.0.0", &comparison);
  if (FAILED(result) || comparison <= 0) {
    log(L"Runtime unavailable; required>=" + std::wstring(minimumVersion), result);
    return 1;
  }
  result = CompareBrowserVersions(runtimeVersion.c_str(), minimumVersion, &comparison);
  if (FAILED(result)) {
    log(L"Runtime version comparison failed; required>=" + std::wstring(minimumVersion), result);
    return 1;
  }
  if (comparison < 0) {
    log(L"Runtime outdated; required>=" + std::wstring(minimumVersion), 0);
    return 3;
  }
  log(L"Runtime version available", 0);
  return 0;
}

// 不终止共享 Runtime 进程；浏览器未确认退出时保留本次临时目录。
void finishCleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  KillTimer(window, 1);
  DWORD attributes = GetFileAttributesW(userDataFolder.c_str());
  bool exists = attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_DIRECTORY);
  if (browserExited && exists && !(attributes & FILE_ATTRIBUTE_REPARSE_POINT)) {
    std::error_code error;
    std::filesystem::remove_all(userDataFolder, error);
    if (error) log(L"Temporary profile retained: delete failed", HRESULT_FROM_WIN32(error.value()));
  } else if (exists) {
    log(L"Temporary profile retained: browser exit not confirmed", 0);
  }
  PostQuitMessage(0);
}

void finish(int code) {
  if (completed) return;
  completed = true;
  probeResult = code;
  if (code == 0) log(L"Runtime startup, local navigation and JavaScript passed", 0);
  SetEvent(watchdogCancel);
  stage = L"cleanup";
  if (controller) controller->Close();
  if (!environment) {
    PostQuitMessage(0);
    return;
  }
  if (browserExited) finishCleanup();
  else SetTimer(window, 1, 3000, nullptr);
}

void fail(const std::wstring& operation, HRESULT result) {
  log(operation + L" failed", result);
  finish(wcscmp(stage.load(), L"profileIsolation") == 0 ? 2 : 4);
}

HRESULT onController(HRESULT error, ICoreWebView2Controller* created) {
  if (FAILED(error) || !created) {
    fail(L"Controller creation", FAILED(error) ? error : E_POINTER);
    return S_OK;
  }
  controller = created;
  ComPtr<ICoreWebView2> webView;
  EventRegistrationToken token{};
  HRESULT result = controller->put_Bounds(RECT{0, 0, 16, 16});
  if (SUCCEEDED(result)) result = controller->put_IsVisible(FALSE);
  if (SUCCEEDED(result)) result = controller->get_CoreWebView2(&webView);
  if (SUCCEEDED(result)) {
    result = webView->add_NavigationCompleted(makeCallback<ICoreWebView2NavigationCompletedEventHandler>(
      [](ICoreWebView2*, ICoreWebView2NavigationCompletedEventArgs* args) {
        BOOL success = FALSE;
        HRESULT query = args->get_IsSuccess(&success);
        if (FAILED(query) || !success) {
          COREWEBVIEW2_WEB_ERROR_STATUS status = COREWEBVIEW2_WEB_ERROR_STATUS_UNKNOWN;
          args->get_WebErrorStatus(&status);
          log(L"Local navigation failed: " + std::to_wstring(static_cast<int>(status)), FAILED(query) ? query : 0);
          finish(4);
          return S_OK;
        }
        navigationCompleted = true;
        if (scriptCompleted) finish(0);
        return S_OK;
      }).Get(), &token);
  }
  if (SUCCEEDED(result)) {
    result = webView->add_WebMessageReceived(makeCallback<ICoreWebView2WebMessageReceivedEventHandler>(
      [](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) {
        LPWSTR message = nullptr;
        HRESULT query = args->TryGetWebMessageAsString(&message);
        bool matches = SUCCEEDED(query) && message && nonce == message;
        CoTaskMemFree(message);
        if (FAILED(query)) {
          log(L"Script response failed", query);
          finish(4);
          return S_OK;
        }
        if (!matches) return S_OK;
        scriptCompleted = true;
        if (navigationCompleted) finish(0);
        return S_OK;
      }).Get(), &token);
  }
  if (SUCCEEDED(result)) {
    result = webView->add_ProcessFailed(makeCallback<ICoreWebView2ProcessFailedEventHandler>(
      [](ICoreWebView2*, ICoreWebView2ProcessFailedEventArgs* args) {
        COREWEBVIEW2_PROCESS_FAILED_KIND kind = COREWEBVIEW2_PROCESS_FAILED_KIND_BROWSER_PROCESS_EXITED;
        args->get_ProcessFailedKind(&kind);
        log(L"WebView2 process failed: " + std::to_wstring(static_cast<int>(kind)), 0);
        finish(4);
        return S_OK;
      }).Get(), &token);
  }
  if (SUCCEEDED(result)) {
    stage = L"navigationAndScript";
    std::wstring html = L"<!doctype html><meta charset=\"utf-8\"><script>window.chrome.webview.postMessage(\"" + nonce + L"\");</script>";
    result = webView->NavigateToString(html.c_str());
  }
  if (FAILED(result)) fail(L"Probe setup", result);
  return S_OK;
}

HRESULT onEnvironment(HRESULT error, ICoreWebView2Environment* created) {
  if (FAILED(error) || !created) {
    fail(L"Environment creation", FAILED(error) ? error : E_POINTER);
    return S_OK;
  }
  environment = created;
  ComPtr<ICoreWebView2Environment5> environment5;
  EventRegistrationToken token{};
  HRESULT result = environment.As(&environment5);
  if (SUCCEEDED(result)) {
    result = environment5->add_BrowserProcessExited(makeCallback<ICoreWebView2BrowserProcessExitedEventHandler>(
      [](ICoreWebView2Environment*, ICoreWebView2BrowserProcessExitedEventArgs*) {
        browserExited = true;
        if (completed) finishCleanup();
        return S_OK;
      }).Get(), &token);
  }
  if (FAILED(result)) {
    fail(L"Browser exit subscription", result);
    return S_OK;
  }
  LPWSTR version = nullptr;
  result = environment->get_BrowserVersionString(&version);
  if (SUCCEEDED(result)) runtimeVersion = version ? version : L"<none>";
  CoTaskMemFree(version);
  int comparison = 0;
  if (SUCCEEDED(result)) result = CompareBrowserVersions(runtimeVersion.c_str(), minimumVersion, &comparison);
  if (FAILED(result)) {
    fail(L"Created Runtime version check", result);
    return S_OK;
  }
  if (comparison < 0) {
    log(L"Created Runtime does not meet minimum version " + std::wstring(minimumVersion), 0);
    finish(4);
    return S_OK;
  }

  stage = L"profileIsolation";
  ComPtr<ICoreWebView2Environment7> environment7;
  LPWSTR folder = nullptr;
  result = environment.As(&environment7);
  if (SUCCEEDED(result)) result = environment7->get_UserDataFolder(&folder);
  std::wstring actual = SUCCEEDED(result) && folder ? fullPath(folder) : L"";
  CoTaskMemFree(folder);
  if (FAILED(result)) {
    fail(L"Profile folder query", result);
    return S_OK;
  }
  while (!actual.empty() && actual.back() == L'\\') actual.pop_back();
  if (!sameText(actual, userDataFolder)) {
    log(L"Runtime redirected the isolated profile; probe stopped", 0);
    finish(2);
    return S_OK;
  }

  stage = L"controller";
  result = environment->CreateCoreWebView2Controller(window, makeCallback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(onController).Get());
  if (FAILED(result)) fail(L"Controller creation", result);
  return S_OK;
}

DWORD WINAPI watchdog(void*) {
  // ACT: 独立线程覆盖 UI 消息循环本身卡死；超时不能证明 Runtime 文件损坏。
  if (WaitForSingleObject(watchdogCancel, 30000) == WAIT_TIMEOUT) {
    log(L"Startup probe timed out after 30 seconds", HRESULT_FROM_WIN32(ERROR_TIMEOUT));
    ExitProcess(5);
  }
  return 0;
}

LRESULT CALLBACK windowProcedure(HWND handle, UINT message, WPARAM wParam, LPARAM lParam) {
  if (message == WM_TIMER) {
    finishCleanup();
    return 0;
  }
  return DefWindowProcW(handle, message, wParam, lParam);
}

// ACT: 独立临时用户目录只验证内核启动，不代表 Toonflow 实际用户目录一定健康。
int probeRuntime() {
  stage = L"temporaryProfile";
  wchar_t temporary[MAX_PATH + 1];
  DWORD length = GetTempPathW(MAX_PATH + 1, temporary);
  if (!length || length > MAX_PATH) {
    log(L"Temporary path unavailable", lastError());
    return 2;
  }
  userDataFolder = std::wstring(temporary) + L"toonflowWebView2-" + newGuid();
  if (!CreateDirectoryW(userDataFolder.c_str(), nullptr)) {
    log(L"Temporary profile creation failed", lastError());
    return 2;
  }
  // 仅覆盖本检测进程，避免全局环境变量让探测误用用户的真实浏览器目录。
  SetEnvironmentVariableW(L"WEBVIEW2_USER_DATA_FOLDER", userDataFolder.c_str());

  stage = L"window";
  watchdogCancel = CreateEventW(nullptr, TRUE, FALSE, nullptr);
  HANDLE thread = watchdogCancel ? CreateThread(nullptr, 0, watchdog, nullptr, 0, nullptr) : nullptr;
  if (!thread) {
    log(L"Watchdog creation failed", lastError());
    return 2;
  }
  CloseHandle(thread);
  WNDCLASSW windowClass{};
  windowClass.lpfnWndProc = windowProcedure;
  windowClass.hInstance = GetModuleHandleW(nullptr);
  windowClass.lpszClassName = L"toonflowWebView2Check";
  RegisterClassW(&windowClass);
  window = CreateWindowExW(0, windowClass.lpszClassName, L"", WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, 16, 16,
    nullptr, nullptr, windowClass.hInstance, nullptr);
  if (!window) {
    log(L"Probe window creation failed", lastError());
    return 2;
  }

  stage = L"environment";
  nonce = newGuid();
  HRESULT result = CreateCoreWebView2EnvironmentWithOptions(nullptr, userDataFolder.c_str(), nullptr,
    makeCallback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(onEnvironment).Get());
  if (FAILED(result)) fail(L"Environment creation", result);
  MSG message;
  while (GetMessageW(&message, nullptr, 0, 0) > 0) {
    TranslateMessage(&message);
    DispatchMessageW(&message);
  }
  controller.Reset();
  environment.Reset();
  DestroyWindow(window);
  return probeResult;
}

void readIdentity() {
  HANDLE token = nullptr;
  if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)) {
    DWORD size = 0;
    GetTokenInformation(token, TokenUser, nullptr, 0, &size);
    std::vector<BYTE> buffer(size);
    wchar_t name[256];
    wchar_t domain[256];
    DWORD nameSize = 256;
    DWORD domainSize = 256;
    SID_NAME_USE use;
    if (size && GetTokenInformation(token, TokenUser, buffer.data(), size, &size)
      && LookupAccountSidW(nullptr, reinterpret_cast<TOKEN_USER*>(buffer.data())->User.Sid, name, &nameSize, domain, &domainSize, &use)) {
      account = std::wstring(domain) + L"\\" + name;
    }
    CloseHandle(token);
  }
  BYTE administrators[SECURITY_MAX_SID_SIZE];
  DWORD sidSize = sizeof(administrators);
  BOOL member = FALSE;
  if (CreateWellKnownSid(WinBuiltinAdministratorsSid, nullptr, administrators, &sidSize)
    && CheckTokenMembership(nullptr, administrators, &member)) {
    elevated = member != FALSE;
  }
}

struct registryKey {
  HKEY handle = nullptr;
  ~registryKey() {
    if (handle) RegCloseKey(handle);
  }
};

std::wstring readString(HKEY key, const wchar_t* name) {
  DWORD size = 0;
  if (RegGetValueW(key, nullptr, name, RRF_RT_REG_SZ, nullptr, nullptr, &size) != ERROR_SUCCESS) return L"";
  std::wstring value(size / sizeof(wchar_t) + 1, L'\0');
  if (RegGetValueW(key, nullptr, name, RRF_RT_REG_SZ, nullptr, value.data(), &size) != ERROR_SUCCESS) return L"";
  value.resize(wcslen(value.c_str()));
  return value;
}

bool repairDisabled(HKEY key) {
  ULONGLONG number = 0;
  DWORD size = sizeof(number);
  if (RegGetValueW(key, nullptr, L"NoModify", RRF_RT_REG_DWORD | RRF_RT_REG_QWORD, nullptr, &number, &size) == ERROR_SUCCESS) {
    return number == 1;
  }
  return readString(key, L"NoModify") == L"1";
}

std::wstring knownFolder(REFKNOWNFOLDERID id) {
  PWSTR path = nullptr;
  std::wstring result;
  if (SUCCEEDED(SHGetKnownFolderPath(id, 0, nullptr, &path))) result = path;
  CoTaskMemFree(path);
  return result;
}

// ACT: 离线校验 Authenticode 与签名者简单名称，不检查吊销；与原 PowerShell 校验的判定口径一致。
HRESULT verifyMicrosoftSignature(const std::wstring& path) {
  WINTRUST_FILE_INFO fileInfo{};
  fileInfo.cbStruct = sizeof(fileInfo);
  fileInfo.pcwszFilePath = path.c_str();
  WINTRUST_DATA data{};
  data.cbStruct = sizeof(data);
  data.dwUIChoice = WTD_UI_NONE;
  data.fdwRevocationChecks = WTD_REVOKE_NONE;
  data.dwUnionChoice = WTD_CHOICE_FILE;
  data.pFile = &fileInfo;
  data.dwStateAction = WTD_STATEACTION_VERIFY;
  GUID action = WINTRUST_ACTION_GENERIC_VERIFY_V2;
  HRESULT result = WinVerifyTrust(nullptr, &action, &data);
  if (SUCCEEDED(result)) {
    CRYPT_PROVIDER_DATA* provider = WTHelperProvDataFromStateData(data.hWVTStateData);
    CRYPT_PROVIDER_SGNR* signer = provider ? WTHelperGetProvSignerFromChain(provider, 0, FALSE, 0) : nullptr;
    CRYPT_PROVIDER_CERT* certificate = signer ? WTHelperGetProvCertFromChain(signer, 0) : nullptr;
    wchar_t name[256] = L"";
    if (!certificate || !CertGetNameStringW(certificate->pCert, CERT_NAME_SIMPLE_DISPLAY_TYPE, 0, nullptr, name, 256)
      || wcscmp(name, L"Microsoft Corporation") != 0) {
      result = TRUST_E_SUBJECT_NOT_TRUSTED;
    }
  }
  data.dwStateAction = WTD_STATEACTION_CLOSE;
  WinVerifyTrust(nullptr, &action, &data);
  return result;
}

int repairRuntime(bool infoOnly) {
  stage = L"repairDiscovery";
  checkVersion();
  std::wstring repairPath;
  std::wstring repairArguments;
  bool machineScope = false;
  bool matchedVersion = false;
  bool policyBlocked = false;
  const std::wregex commandPattern(
    LR"re(^"([^"]+)" (/install appguid=\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5\}&appname=Microsoft%20Edge%20WebView&needsadmin=(true|false)&repairtype=windowsonlinerepair /installsource [a-zA-Z0-9]+)$)re",
    std::regex::ECMAScript | std::regex::icase);
  for (HKEY hive : {HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER}) {
    registryKey key;
    if (RegOpenKeyExW(hive, L"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Microsoft EdgeWebView", 0,
      KEY_READ | KEY_WOW64_32KEY, &key.handle) != ERROR_SUCCESS) continue;
    bool isMachine = hive == HKEY_LOCAL_MACHINE;
    std::wstring hiveName = isMachine ? L"LocalMachine" : L"CurrentUser";
    bool matches = sameText(readString(key.handle, L"DisplayVersion"), runtimeVersion);
    if (!repairPath.empty() && (!matches || matchedVersion)) continue;
    // ACT: NoRepair 只隐藏独立 Repair 按钮；微软的 ModifyPath 仍提供在线修复。
    if (repairDisabled(key.handle)) {
      policyBlocked = true;
      log(L"Runtime repair disabled by registered policy: " + hiveName, 0);
      if (matches) return 2;
      continue;
    }
    std::wstring command = readString(key.handle, L"ModifyPath");
    if (command.find_first_not_of(L" \t\r\n") == std::wstring::npos) continue;
    std::wsmatch parsed;
    std::wstring expectedPath = knownFolder(isMachine ? FOLDERID_ProgramFilesX86 : FOLDERID_LocalAppData) + L"\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe";
    if (!std::regex_match(command, parsed, commandPattern) || PathIsRelativeW(parsed[1].str().c_str())
      || !sameText(fullPath(parsed[1].str()), expectedPath) || parsed[3].str() != (isMachine ? L"true" : L"false")) {
      log(L"Unsupported registered repair command: " + hiveName, 0);
      continue;
    }
    repairPath = expectedPath;
    repairArguments = parsed[2].str();
    machineScope = isMachine;
    matchedVersion = matches;
  }
  if (repairPath.empty()) {
    log(L"No supported registered repair entry", 0);
    return policyBlocked ? 2 : 1;
  }

  stage = L"repairSignature";
  writeLine(L"Repair scope=" + std::wstring(machineScope ? L"machine" : L"user") + L"; path=" + repairPath + L"; arguments=" + repairArguments);
  DWORD attributes = GetFileAttributesW(repairPath.c_str());
  if (attributes == INVALID_FILE_ATTRIBUTES || (attributes & FILE_ATTRIBUTE_DIRECTORY)) {
    log(L"Registered repair executable is missing", 0);
    return 1;
  }
  if (!machineScope && elevated) {
    log(L"User-scope repair must run without administrator elevation", 0);
    return 2;
  }
  HRESULT signature = verifyMicrosoftSignature(repairPath);
  if (FAILED(signature)) {
    log(L"Microsoft signature verification failed", signature);
    return 2;
  }
  writeLine(L"Microsoft signature valid");
  if (infoOnly) {
    log(L"Supported Microsoft repair entry verified; no repair started", 0);
    return 0;
  }

  stage = L"repairExecution";
  SHELLEXECUTEINFOW execute{};
  execute.cbSize = sizeof(execute);
  execute.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NOASYNC;
  execute.lpVerb = machineScope && !elevated ? L"runas" : nullptr;
  execute.lpFile = repairPath.c_str();
  execute.lpParameters = repairArguments.c_str();
  execute.nShow = SW_SHOWNORMAL;
  if (!ShellExecuteExW(&execute)) {
    log(L"Microsoft repair start failed", lastError());
    return 2;
  }
  if (!execute.hProcess) {
    log(L"Microsoft repair process handle unavailable", 0);
    return 2;
  }
  WaitForSingleObject(execute.hProcess, INFINITE);
  DWORD exitCode = 0;
  GetExitCodeProcess(execute.hProcess, &exitCode);
  CloseHandle(execute.hProcess);
  log(L"Microsoft repair process exited: " + std::to_wstring(static_cast<int>(exitCode)) + L"; run a new startup probe to verify", 0);
  return 0;
}

}  // namespace

int wmain(int argc, wchar_t** argv) {
  try {
    HRESULT com = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    readIdentity();
    if (FAILED(com)) {
      log(L"COM initialization failed", com);
      return 2;
    }
    std::wstring argument = argc == 2 ? argv[1] : L"";
    if (argument == L"--repair" || argument == L"--repair-info") return repairRuntime(argument == L"--repair-info");
    if (argc > 2 || (argc == 2 && argument != L"--version-only")) {
      log(L"Unsupported arguments", 0);
      return 2;
    }
    int versionResult = checkVersion();
    if (versionResult != 0 || argc == 2) return versionResult;
    return probeRuntime();
  } catch (const std::exception&) {
    log(L"Unhandled exception", E_UNEXPECTED);
    return 2;
  }
}
