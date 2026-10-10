package com.toonflow.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.MimeTypeMap;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONTokener;
import org.mozilla.geckoview.AllowOrDeny;
import org.mozilla.geckoview.GeckoResult;
import org.mozilla.geckoview.GeckoRuntime;
import org.mozilla.geckoview.GeckoRuntimeSettings;
import org.mozilla.geckoview.GeckoSession;
import org.mozilla.geckoview.GeckoView;
import org.mozilla.geckoview.WebExtension;
import org.mozilla.geckoview.WebRequestError;

public class mobileActivity extends Activity {
  private static final Object payloadLock = new Object();
  private static final String uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  private static GeckoRuntime geckoRuntime;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private final Object processLock = new Object();
  private volatile boolean stopping;
  private volatile Uri localOrigin;
  private Process bunProcess;
  private FrameLayout root;
  private WebView webView;
  private GeckoView geckoView;
  private GeckoSession geckoSession;
  private WebExtension.Port geckoPort;
  private String geckoUrl;
  private boolean geckoCanGoBack;
  private File uploadDirectory;
  private TextView statusView;
  private ProgressBar progressView;
  private ValueCallback<Uri[]> fileCallback;
  private Uri pendingSave;
  private Object cameraRequest;
  private Uri cameraOrigin;
  private ValueCallback<Boolean> cameraCallback;
  private boolean cameraPermissionPending;
  private boolean failed;
  private String browserStage = "waiting";
  private String systemMissing = "";
  private final Runnable browserTimeout = () -> showError("浏览器启动超时。请完全退出并重新打开 Toonflow。" + (systemMissing.isEmpty() ? "" : "\n系统 WebView 缺少：" + systemMissing), null);
  private final Runnable startupTimeout = () -> {
    synchronized (processLock) {
      if (stopping || failed || localOrigin != null || bunProcess == null || !bunProcess.isAlive()) return;
      showError("Bun 启动超时（60 秒）。请通过 Logcat 查看 ToonflowMobile 日志。", null);
      stopBun();
    }
  };

  @Override
  public void onCreate(Bundle state) {
    super.onCreate(state);
    uploadDirectory = new File(getCacheDir(), "browserUploads/" + UUID.randomUUID());
    if (Build.VERSION.SDK_INT >= 28) {
      WindowManager.LayoutParams attributes = getWindow().getAttributes();
      attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
      getWindow().setAttributes(attributes);
    }
    root = new FrameLayout(this);
    if (Build.VERSION.SDK_INT >= 30) root.setOnApplyWindowInsetsListener((view, insets) -> {
      view.setPadding(0, 0, 0, insets.getInsets(WindowInsets.Type.ime()).bottom);
      return new WindowInsets.Builder(insets).setInsets(WindowInsets.Type.ime(), android.graphics.Insets.NONE).build();
    });
    statusView = new TextView(this);
    statusView.setTextSize(16);
    statusView.setTextColor(Color.rgb(30, 41, 59));
    statusView.setBackgroundColor(Color.WHITE);
    statusView.setGravity(Gravity.CENTER);
    int padding = (int) (24 * getResources().getDisplayMetrics().density);
    statusView.setPadding(padding, padding, padding, padding);
    root.addView(statusView, new FrameLayout.LayoutParams(-1, -1));
    progressView = new ProgressBar(this);
    progressView.setIndeterminateTintList(ColorStateList.valueOf(Color.rgb(64, 158, 255)));
    progressView.setContentDescription("Loading Toonflow");
    int progressSize = (int) (32 * getResources().getDisplayMetrics().density);
    root.addView(progressView, new FrameLayout.LayoutParams(progressSize, progressSize, Gravity.CENTER));
    setContentView(root);
    initializeSystemWebView();
    new Thread(this::startBun, "mobileBun").start();
  }

  private void initializeSystemWebView() {
    try {
      webView = new WebView(this);
      webView.getSettings().setJavaScriptEnabled(true);
      webView.getSettings().setDomStorageEnabled(true);
      webView.getSettings().setAllowFileAccess(false);
      webView.getSettings().setAllowContentAccess(true);
      webView.getSettings().setUseWideViewPort(true);
      webView.getSettings().setLoadWithOverviewMode(true);
      webView.getSettings().setSupportZoom(false);
      // 新窗口在当前 WebView 发起导航，统一交由下面的外链处理。
      webView.getSettings().setSupportMultipleWindows(false);
      webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
      webView.setWebChromeClient(new WebChromeClient() {
        @Override
        public void onPermissionRequest(PermissionRequest request) {
          requestCamera(request, request.getOrigin(), request.getResources(), allowed -> {
            if (allowed) request.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            else request.deny();
          });
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) { cancelCamera(request); }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
          try {
            chooseFile(params.createIntent(), callback);
          } catch (Exception error) {
            callback.onReceiveValue(null);
            Toast.makeText(mobileActivity.this, "Unable to open the file picker.", Toast.LENGTH_LONG).show();
          }
          return true;
        }
      });
      webView.setWebViewClient(new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
          return navigate(request.getUrl(), request.isForMainFrame());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
          if (allowRequest(request.getUrl(), request.isForMainFrame())) return null;
          return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", null, new ByteArrayInputStream(new byte[0]));
        }

        @Override
        public void onPageFinished(WebView view, String url) {
          if (geckoSession == null) pageFinished(url);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
          if (request.isForMainFrame() && geckoSession == null) showError("Local page failed to load: " + error.getDescription(), null);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
          if (request.isForMainFrame() && geckoSession == null) showError("Local page returned HTTP " + response.getStatusCode() + ".", null);
        }
      });
      root.addView(webView, 0, new FrameLayout.LayoutParams(-1, -1));
    } catch (RuntimeException | LinkageError error) {
      systemMissing = "系统 WebView 无法初始化";
      Log.w("ToonflowMobile", systemMissing, error);
      if (webView != null) webView.destroy();
      webView = null;
    }
  }

  private void chooseFile(Intent intent, ValueCallback<Uri[]> callback) {
    if (fileCallback != null || pendingSave != null) {
      callback.onReceiveValue(null);
      return;
    }
    fileCallback = callback;
    try {
      startActivityForResult(intent, 1);
    } catch (ActivityNotFoundException error) {
      fileCallback = null;
      callback.onReceiveValue(null);
      Toast.makeText(this, "No system file picker is available.", Toast.LENGTH_LONG).show();
    }
  }

  private boolean navigate(Uri uri, boolean mainFrame) {
    if (mainFrame && "toonflow".equals(uri.getScheme()) && "restart".equals(uri.getHost())) {
      restartApp();
      return true;
    }
    if (mainFrame && "toonflow".equals(uri.getScheme()) && "save".equals(uri.getHost())) {
      requestSave(uri);
      return true;
    }
    if (isLocalOrigin(uri)) return false;
    if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
      if (!mainFrame) return false;
      try {
        startActivity(new Intent(Intent.ACTION_VIEW, uri));
      } catch (ActivityNotFoundException error) {
        Toast.makeText(this, "No browser is available to open this link.", Toast.LENGTH_LONG).show();
      }
    }
    return true;
  }

  private boolean allowRequest(Uri uri, boolean mainFrame) {
    String scheme = uri.getScheme();
    return isLocalOrigin(uri) || !mainFrame
      && ("http".equals(scheme) || "https".equals(scheme) || "data".equals(scheme) || "blob".equals(scheme));
  }

  private String browserUrl() {
    return geckoSession == null ? (webView == null ? null : webView.getUrl()) : geckoUrl;
  }

  private boolean isLocalPage() {
    if (stopping || failed || isDestroyed()) return false;
    String url = browserUrl();
    return url != null && isLocalOrigin(Uri.parse(url));
  }

  private void requestCamera(Object request, Uri origin, String[] resources, ValueCallback<Boolean> callback) {
    boolean video = false;
    if (resources != null) for (String resource : resources) {
      if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) video = true;
    }
    if (!video || !isLocalOrigin(origin) || !isLocalPage() || cameraRequest != null || cameraPermissionPending) {
      callback.onReceiveValue(false);
      return;
    }
    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
      callback.onReceiveValue(true);
      return;
    }
    cameraRequest = request;
    cameraOrigin = origin;
    cameraCallback = callback;
    cameraPermissionPending = true;
    try {
      requestPermissions(new String[] { Manifest.permission.CAMERA }, 3);
    } catch (RuntimeException error) {
      cameraPermissionPending = false;
      finishCamera(false);
      Log.w("ToonflowMobile", "Unable to request camera permission", error);
    }
  }

  private void cancelCamera(Object request) {
    if (cameraRequest != request) return;
    cameraRequest = null;
    cameraOrigin = null;
    cameraCallback = null;
  }

  private void finishCamera(boolean allowed) {
    ValueCallback<Boolean> callback = cameraCallback;
    Uri origin = cameraOrigin;
    cameraRequest = null;
    cameraOrigin = null;
    cameraCallback = null;
    if (callback != null) callback.onReceiveValue(allowed && isLocalOrigin(origin) && isLocalPage()
      && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED);
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode != 3) return;
    cameraPermissionPending = false;
    finishCamera(grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED);
  }

  private void restartApp() {
    if (!isLocalPage() || isFinishing()) return;
    Process process;
    synchronized (processLock) {
      if (stopping) return;
      process = bunProcess;
      stopBun();
    }
    finishCamera(false);
    mainHandler.removeCallbacks(browserTimeout);
    browserStage = "restarting";
    statusView.setVisibility(View.VISIBLE);
    progressView.setVisibility(View.VISIBLE);
    new Thread(() -> {
      try {
        if (process != null && !process.waitFor(5, TimeUnit.SECONDS)) throw new IOException("The previous Bun service did not stop.");
        mainHandler.post(() -> {
          if (!isDestroyed() && !isFinishing()) recreate();
        });
      } catch (InterruptedException error) {
        Thread.currentThread().interrupt();
        showError("Unable to restart Toonflow: interrupted while stopping Bun.", error);
      } catch (IOException error) {
        showError("Unable to restart Toonflow: " + error.getMessage(), error);
      }
    }, "mobileRestart").start();
  }

  private void loadBrowserUrl(String url) {
    if (geckoSession == null) webView.loadUrl(url);
    else geckoSession.loadUri(url);
  }

  private void probeBrowser() {
    if (webView == null) {
      startGecko();
      return;
    }
    browserStage = "systemProbe";
    mainHandler.removeCallbacks(browserTimeout);
    mainHandler.postDelayed(browserTimeout, 30000);
    loadBrowserUrl(localOrigin.buildUpon().appendQueryParameter("probe", "1").build().toString());
  }

  private void pageFinished(String url) {
    if (stopping || failed || url == null || !isLocalOrigin(Uri.parse(url))) return;
    Uri page = Uri.parse(url);
    if ("page".equals(browserStage)) {
      if (!"/".equals(page.getPath()) || page.getQueryParameter("probe") != null || page.getQueryParameter("token") != null) return;
      browserStage = "ready";
      mainHandler.removeCallbacks(browserTimeout);
      if (geckoSession == null) webView.clearHistory();
      else geckoSession.purgeHistory();
      statusView.setVisibility(View.GONE);
      progressView.setVisibility(View.GONE);
      return;
    }
    if (!"systemProbe".equals(browserStage) || !"1".equals(page.getQueryParameter("probe")) || page.getQueryParameter("token") != null) return;
    webView.evaluateJavascript("JSON.stringify(window.toonflowBrowserProbe)", value -> {
      if (stopping || failed || !"systemProbe".equals(browserStage)) return;
      try {
        Object decoded = new JSONTokener(value == null ? "null" : value).nextValue();
        if (!(decoded instanceof String)) throw new IOException("Missing browser probe result.");
        browserProbed(new JSONObject((String) decoded), false);
      } catch (Exception error) {
        systemMissing = "系统 WebView 无法完成能力检测";
        Log.w("ToonflowMobile", systemMissing, error);
        startGecko();
      }
    });
  }

  private void browserProbed(JSONObject result, boolean gecko) throws Exception {
    if (stopping || failed || !(gecko ? "geckoProbe" : "systemProbe").equals(browserStage)) return;
    JSONArray missing = result.getJSONArray("missing");
    if (!(result.get("userAgent") instanceof String) || result.getString("userAgent").isEmpty()) throw new IOException("Invalid browser probe user agent.");
    StringBuilder names = new StringBuilder();
    for (int index = 0; index < missing.length(); index++) {
      Object name = missing.get(index);
      if (!(name instanceof String) || ((String) name).isEmpty()) throw new IOException("Invalid browser probe feature.");
      if (names.length() > 0) names.append(", ");
      names.append(name);
    }
    mainHandler.removeCallbacks(browserTimeout);
    if (missing.length() > 0) {
      if (gecko) showError("内置 GeckoView 缺少所需能力：" + names + "。请更新 Toonflow。\n系统 WebView 缺少：" + systemMissing, null);
      else {
        systemMissing = names.toString();
        Log.w("ToonflowMobile", "System WebView missing: " + systemMissing);
        startGecko();
      }
      return;
    }
    browserStage = "page";
    Log.i("ToonflowMobile", (gecko ? "GeckoView" : "System WebView") + " capability check passed: " + result.getString("userAgent"));
    mainHandler.postDelayed(browserTimeout, 30000);
    loadBrowserUrl("http://127.0.0.1:" + localOrigin.getPort() + "/?mobile=1" + (gecko ? "&engine=gecko" : ""));
  }

  private void showProgress(String message) {
    if (stopping || failed) return;
    statusView.setText(message);
    statusView.setGravity(Gravity.CENTER);
    int padding = (int) (24 * getResources().getDisplayMetrics().density);
    statusView.setPadding(padding, padding, padding, padding * 5);
    statusView.setVisibility(View.VISIBLE);
    progressView.setVisibility(View.VISIBLE);
  }

  private void startGecko() {
    if (geckoSession != null || stopping || failed) return;
    browserStage = "geckoProbe";
    mainHandler.removeCallbacks(browserTimeout);
    mainHandler.postDelayed(browserTimeout, 60000);
    if (webView != null) {
      webView.stopLoading();
      webView.setVisibility(View.GONE);
    }
    showProgress("正在启用内置 GeckoView 浏览器内核…");
    try {
      // ACT: Runtime 随进程复用；Activity 重建只替换 Session，保留应用内重启能力。
      if (geckoRuntime == null) geckoRuntime = GeckoRuntime.create(getApplicationContext(), new GeckoRuntimeSettings.Builder()
        .remoteDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0).build());
      geckoSession = new GeckoSession();
      geckoSession.setNavigationDelegate(new GeckoSession.NavigationDelegate() {
        @Override
        public void onLocationChange(GeckoSession session, String url, List<GeckoSession.PermissionDelegate.ContentPermission> permissions, Boolean gesture) {
          geckoUrl = url;
          if (!isLocalOrigin(Uri.parse(url))) finishCamera(false);
        }

        @Override
        public void onCanGoBack(GeckoSession session, boolean canGoBack) { geckoCanGoBack = canGoBack; }

        @Override
        public GeckoResult<AllowOrDeny> onLoadRequest(GeckoSession session, LoadRequest request) {
          return GeckoResult.fromValue(navigate(Uri.parse(request.uri), true) ? AllowOrDeny.DENY : AllowOrDeny.ALLOW);
        }

        @Override
        public GeckoResult<AllowOrDeny> onSubframeLoadRequest(GeckoSession session, LoadRequest request) {
          return GeckoResult.fromValue(allowRequest(Uri.parse(request.uri), false) ? AllowOrDeny.ALLOW : AllowOrDeny.DENY);
        }

        @Override
        public GeckoResult<GeckoSession> onNewSession(GeckoSession session, String url) {
          if (!navigate(Uri.parse(url), true)) session.loadUri(url);
          return null;
        }

        @Override
        public GeckoResult<String> onLoadError(GeckoSession session, String url, WebRequestError error) {
          if (isLocalOrigin(Uri.parse(url))) showError("GeckoView 加载本地页面失败：" + error, null);
          return GeckoResult.fromValue(null);
        }
      });
      geckoSession.setProgressDelegate(new GeckoSession.ProgressDelegate() {
        @Override
        public void onPageStop(GeckoSession session, boolean success) {
          if (success) pageFinished(geckoUrl);
        }
      });
      geckoSession.setContentDelegate(new GeckoSession.ContentDelegate() {
        @Override
        public void onCrash(GeckoSession session) { showError("GeckoView 渲染进程已崩溃。请完全退出并重新打开 Toonflow。", null); }

        @Override
        public void onKill(GeckoSession session) { showError("GeckoView 渲染进程被系统终止。请释放内存后重新打开 Toonflow。", null); }
      });
      geckoSession.setPermissionDelegate(new GeckoSession.PermissionDelegate() {
        @Override
        public void onAndroidPermissionsRequest(GeckoSession session, String[] permissions, Callback callback) {
          for (String permission : permissions) if (!Manifest.permission.CAMERA.equals(permission)) {
            callback.reject();
            return;
          }
          requestCamera(callback, geckoUrl == null ? null : Uri.parse(geckoUrl), new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE }, allowed -> {
            if (allowed) callback.grant();
            else callback.reject();
          });
        }

        @Override
        public void onMediaPermissionRequest(GeckoSession session, String url, MediaSource[] video, MediaSource[] audio, MediaCallback callback) {
          MediaSource camera = null;
          if (video != null) for (MediaSource source : video) if (source.source == MediaSource.SOURCE_CAMERA) { camera = source; break; }
          if (camera == null || audio != null && audio.length > 0) {
            callback.reject();
            return;
          }
          MediaSource selected = camera;
          requestCamera(callback, Uri.parse(url), new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE }, allowed -> {
            if (allowed) callback.grant(selected, null);
            else callback.reject();
          });
        }
      });
      geckoSession.setPromptDelegate(new GeckoSession.PromptDelegate() {
        @Override
        public GeckoResult<PromptResponse> onFilePrompt(GeckoSession session, FilePrompt prompt) {
          if (!isLocalPage() || prompt.type == FilePrompt.Type.FOLDER) return GeckoResult.fromValue(prompt.dismiss());
          GeckoResult<PromptResponse> result = new GeckoResult<>();
          Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
          intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, prompt.type == FilePrompt.Type.MULTIPLE);
          if (prompt.mimeTypes != null && prompt.mimeTypes.length > 0) intent.putExtra(Intent.EXTRA_MIME_TYPES, prompt.mimeTypes);
          ValueCallback<Uri[]> callback = files -> confirmGeckoFiles(prompt, result, files);
          prompt.setDelegate(new PromptInstanceDelegate() {
            @Override
            public void onPromptDismiss(BasePrompt dismissed) {
              if (fileCallback == callback) fileCallback = null;
              callback.onReceiveValue(null);
            }
          });
          chooseFile(intent, callback);
          return result;
        }
      });
      geckoView = new GeckoView(this);
      root.addView(geckoView, 0, new FrameLayout.LayoutParams(-1, -1));
      geckoSession.open(geckoRuntime);
      geckoView.setSession(geckoSession);
      geckoRuntime.getWebExtensionController().ensureBuiltIn("resource://android/assets/browserBridge/", "browserBridge@toonflow").accept(extension -> {
        if (stopping || failed || isDestroyed()) return;
        geckoSession.getWebExtensionController().setMessageDelegate(extension, new WebExtension.MessageDelegate() {
          @Override
          public void onConnect(WebExtension.Port port) {
            WebExtension.MessageSender sender = port.sender;
            if (stopping || failed || sender.session != geckoSession || !sender.isTopLevel()
              || sender.environmentType != WebExtension.MessageSender.ENV_TYPE_CONTENT_SCRIPT || !isLocalOrigin(Uri.parse(sender.url))) {
              port.disconnect();
              return;
            }
            geckoPort = port;
            port.setDelegate(new WebExtension.PortDelegate() {
              @Override
              public void onPortMessage(Object message, WebExtension.Port source) {
                if (stopping || failed || source != geckoPort || !(message instanceof JSONObject)) return;
                JSONObject data = (JSONObject) message;
                if (!"probe".equals(data.optString("type"))) return;
                Uri page = Uri.parse(source.sender.url);
                if (!"1".equals(page.getQueryParameter("probe")) || page.getQueryParameter("token") != null) return;
                try { browserProbed(data.getJSONObject("result"), true); }
                catch (Exception error) { showError("无法验证内置 GeckoView 的能力：" + error.getMessage(), error); }
              }

              @Override
              public void onDisconnect(WebExtension.Port source) { if (geckoPort == source) geckoPort = null; }
            });
          }
        }, "toonflow");
        loadBrowserUrl(localOrigin.buildUpon().appendQueryParameter("probe", "1").appendQueryParameter("engine", "gecko").build().toString());
      }, error -> showError("无法初始化 GeckoView 原生通信：" + error.getMessage(), new IOException(error)));
    } catch (RuntimeException | LinkageError error) {
      showError("无法启用内置 GeckoView：" + error.getMessage() + "。请更新 Toonflow 或系统 WebView。\n系统 WebView 缺少：" + systemMissing, new IOException(error));
    }
  }

  private boolean isLocalOrigin(Uri uri) {
    Uri origin = localOrigin;
    return origin != null && uri != null && "http".equals(uri.getScheme()) && "127.0.0.1".equals(uri.getHost())
      && uri.getUserInfo() == null && uri.getPort() == origin.getPort();
  }

  private void confirmGeckoFiles(GeckoSession.PromptDelegate.FilePrompt prompt, GeckoResult<GeckoSession.PromptDelegate.PromptResponse> result, Uri[] files) {
    if (prompt.isComplete()) return;
    if (files == null || files.length == 0 || prompt.type == GeckoSession.PromptDelegate.FilePrompt.Type.SINGLE && files.length != 1) {
      result.complete(prompt.dismiss());
      return;
    }
    // ACT: Gecko 需要实际文件路径；系统 content URI 先复制到专属缓存，关闭 Activity 后清理。
    new Thread(() -> {
      try {
        Uri[] selected = new Uri[files.length];
        for (int index = 0; index < files.length; index++) {
          if (stopping) throw new IOException("文件读取已取消");
          String name = "upload";
          try (Cursor cursor = getContentResolver().query(files[index], new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst() && !cursor.isNull(0)) name = cursor.getString(0);
          }
          name = name.replaceAll("[\\\\/\\x00-\\x1f]", "_");
          if (name.isEmpty() || ".".equals(name) || "..".equals(name)) name = "upload";
          File directory = new File(uploadDirectory, UUID.randomUUID().toString());
          if (!directory.mkdirs()) throw new IOException("无法创建文件缓存");
          File file = new File(directory, name);
          try (InputStream input = getContentResolver().openInputStream(files[index]); OutputStream output = new FileOutputStream(file)) {
            if (input == null) throw new IOException("无法读取选中的文件");
            copyStream(input, output);
          }
          selected[index] = Uri.fromFile(file);
        }
        mainHandler.post(() -> {
          if (prompt.isComplete()) return;
          result.complete(stopping || failed || !isLocalPage() ? prompt.dismiss() : prompt.confirm(this, selected));
        });
      } catch (IOException | RuntimeException error) {
        Log.w("ToonflowMobile", "读取导入文件失败", error);
        mainHandler.post(() -> {
          if (prompt.isComplete()) return;
          result.complete(prompt.dismiss());
          if (!stopping) Toast.makeText(this, "无法读取选中的文件：" + error.getMessage(), Toast.LENGTH_LONG).show();
        });
      } finally {
        if (stopping) try { removeProgramDirectory(uploadDirectory); }
        catch (IOException error) { Log.w("ToonflowMobile", "清理文件缓存失败", error); }
      }
    }, "mobileImport").start();
  }

  private void startBun() {
    try {
      File appDirectory;
      synchronized (payloadLock) {
        if (stopping) return;
        appDirectory = preparePayload();
      }
      String nativeDirectory = getApplicationInfo().nativeLibraryDir;
      File runtime = new File(nativeDirectory, "libbun.so");
      if (!runtime.canExecute()) throw new IOException("APK 中缺少可执行 Bun：" + runtime);
      ProcessBuilder builder = new ProcessBuilder(runtime.getAbsolutePath(), "--no-orphans", new File(appDirectory, "server.js").getAbsolutePath());
      builder.directory(appDirectory).redirectErrorStream(true);
      builder.environment().put("TOONFLOW_MOBILE_DATA_DIR", new File(getFilesDir(), "data").getAbsolutePath());
      builder.environment().put("TOONFLOW_MOBILE_DEVICE_NAME", (Build.MANUFACTURER + " " + Build.MODEL).trim());
      builder.environment().put("TMPDIR", getCacheDir().getAbsolutePath());
      builder.environment().put("HOME", getFilesDir().getAbsolutePath());
      builder.environment().put("SHELL", "/system/bin/sh");
      String oldPath = builder.environment().get("PATH");
      builder.environment().put("PATH", nativeDirectory + ":" + (oldPath == null ? "/system/bin" : oldPath));
      Process process;
      synchronized (processLock) {
        if (stopping) return;
        bunProcess = builder.start();
        process = bunProcess;
        mainHandler.postDelayed(startupTimeout, 60000);
      }
      StringBuilder outputTail = new StringBuilder();
      Thread readerThread = new Thread(() -> {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
          String line;
          while ((line = reader.readLine()) != null) {
            if (!line.startsWith("TOONFLOW_MOBILE_URL=")) {
              Log.i("ToonflowMobile", line);
              // 压缩源码上下文保留在 Logcat，避免淹没错误页面中的原因与堆栈。
              if (line.matches("^\\s*\\d+\\s*\\|.*")) continue;
              synchronized (outputTail) {
                outputTail.append(line, Math.max(0, line.length() - 8191), line.length()).append('\n');
                if (outputTail.length() > 8192) outputTail.delete(0, outputTail.length() - 8192);
              }
              continue;
            }
            Uri url = Uri.parse(line.substring("TOONFLOW_MOBILE_URL=".length()));
            if (!"http".equals(url.getScheme()) || !"127.0.0.1".equals(url.getHost()) || url.getUserInfo() != null
              || url.getPort() < 1 || url.getPort() > 65535 || !"/".equals(url.getPath())
              || url.getQueryParameter("token") == null || url.getQueryParameter("token").isEmpty()) {
              throw new IOException("Bun 返回了无效的本地服务地址");
            }
            synchronized (processLock) {
              if (stopping || localOrigin != null || !process.isAlive()) continue;
              localOrigin = url;
              mainHandler.removeCallbacks(startupTimeout);
              Log.i("ToonflowMobile", "Bun ready on port " + url.getPort());
              mainHandler.post(() -> {
                synchronized (processLock) {
                  if (!stopping && !failed && process.isAlive()) probeBrowser();
                }
              });
            }
          }
        } catch (Exception error) {
          if (!stopping && process.isAlive()) {
            showError("读取本地 Bun 服务日志失败：" + error.getMessage(), error);
            stopBun();
          }
        }
      }, "mobileBunOutput");
      readerThread.start();
      int exitCode = process.waitFor();
      mainHandler.removeCallbacks(startupTimeout);
      if (!stopping) {
        stopBun();
        // ACT: 子进程可能继承输出管道，退出提示最多等待 200ms 排空日志。
        try { readerThread.join(200); } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
        String output;
        synchronized (outputTail) { output = outputTail.toString().trim(); }
        showError("Bun 已退出，退出码：" + exitCode + (output.isEmpty() ? "。请通过 Logcat 查看 ToonflowMobile 日志。" : "\n\n" + output), null);
      }
    } catch (Exception error) {
      if (!stopping) showError("无法启动本地 Bun 服务：" + error.getMessage(), error);
      stopBun();
    }
  }

  private File preparePayload() throws IOException {
    removeProgramDirectory(new File(getCacheDir(), "browserUploads"));
    File directory = new File(getFilesDir(), "app");
    File nextDirectory = new File(getFilesDir(), "appNext");
    File previousDirectory = new File(getFilesDir(), "appPrevious");
    if (!directory.exists() && previousDirectory.exists()) Files.move(previousDirectory.toPath(), directory.toPath());
    String revision;
    try (InputStream input = getAssets().open("payload/revision.txt"); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      copyStream(input, output);
      revision = new String(output.toByteArray(), StandardCharsets.UTF_8).trim();
    }
    if (revision.isEmpty()) throw new IOException("APK 缺少有效的程序版本标识");
    File installedRevision = new File(directory, "revision.txt");
    if (installedRevision.isFile() && new File(directory, "server.js").isFile()
      && revision.equals(new String(Files.readAllBytes(installedRevision.toPath()), StandardCharsets.UTF_8).trim())) {
      removeProgramDirectory(nextDirectory);
      removeProgramDirectory(previousDirectory);
      return directory;
    }
    removeProgramDirectory(nextDirectory);
    copyPayload("payload", nextDirectory);
    removeProgramDirectory(previousDirectory);
    if (directory.exists()) Files.move(directory.toPath(), previousDirectory.toPath());
    try {
      Files.move(nextDirectory.toPath(), directory.toPath());
    } catch (IOException error) {
      if (previousDirectory.exists()) Files.move(previousDirectory.toPath(), directory.toPath());
      throw error;
    }
    removeProgramDirectory(previousDirectory);
    return directory;
  }

  private void copyPayload(String assetPath, File destination) throws IOException {
    if (stopping) throw new IOException("程序启动已取消");
    String[] entries = getAssets().list(assetPath);
    if (entries != null && entries.length > 0) {
      if (!destination.isDirectory() && !destination.mkdirs()) throw new IOException("无法创建程序目录：" + destination);
      for (String entry : entries) copyPayload(assetPath + "/" + entry, new File(destination, entry));
      return;
    }
    try (InputStream input = getAssets().open(assetPath); OutputStream output = new FileOutputStream(destination)) {
      copyStream(input, output);
    }
  }

  private void removeProgramDirectory(File directory) throws IOException {
    if (!directory.exists()) return;
    // Files.walk 默认不跟随符号链接；程序清理不会遍历链接指向的数据目录。
    try (Stream<Path> paths = Files.walk(directory.toPath())) {
      Iterator<Path> entries = paths.sorted(Comparator.reverseOrder()).iterator();
      while (entries.hasNext()) Files.delete(entries.next());
    }
  }

  private void copyStream(InputStream input, OutputStream output) throws IOException {
    byte[] buffer = new byte[32768];
    int count;
    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
  }

  private void requestSave(Uri request) {
    String requestId = request.getQueryParameter("requestId");
    String url = request.getQueryParameter("url");
    String fileName = request.getQueryParameter("fileName");
    Uri source = url == null ? null : Uri.parse(url);
    String currentUrl = browserUrl();
    if (currentUrl == null || !isLocalOrigin(Uri.parse(currentUrl)) || requestId == null || !requestId.matches(uuidPattern)) return;
    if (!isLocalOrigin(source) || source.getQuery() != null || source.getFragment() != null
      || source.getEncodedPath() == null || !source.getEncodedPath().matches("/api/mobile/exports/" + uuidPattern)
      || fileName == null || fileName.trim().isEmpty() || fileName.length() > 255 || fileName.matches("(?s).*[\\\\/\\x00-\\x1f].*")) {
      notifySave(requestId, false, "无效的导出请求");
      return;
    }
    if (pendingSave != null || fileCallback != null) {
      finishSave(request, null, "请先完成当前文件选择");
      return;
    }
    pendingSave = request;
    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
    intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, DocumentsContract.buildDocumentUri("com.android.externalstorage.documents", "primary:Download"));
    String extension = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
    String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
    intent.setType(mimeType == null ? "application/octet-stream" : mimeType).putExtra(Intent.EXTRA_TITLE, fileName);
    try {
      startActivityForResult(intent, 2);
    } catch (ActivityNotFoundException error) {
      pendingSave = null;
      finishSave(request, null, "未找到系统文件保存器");
    }
  }

  private HttpURLConnection openExport(String url, String cookie, String method) throws IOException {
    HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
    connection.setInstanceFollowRedirects(false);
    connection.setConnectTimeout(10000);
    connection.setReadTimeout(30000);
    connection.setRequestMethod(method);
    if (cookie != null) connection.setRequestProperty("Cookie", cookie);
    return connection;
  }

  private void finishSave(Uri request, Uri destination, String failure) {
    String url = request.getQueryParameter("url");
    String cookie = "toonflowMobile=" + localOrigin.getQueryParameter("token");
    new Thread(() -> {
      boolean saved = false;
      String errorMessage = failure;
      try {
        if (destination != null) {
          if (!"content".equals(destination.getScheme())) throw new IOException("系统返回了无效的保存位置");
          HttpURLConnection connection = openExport(url, cookie, "GET");
          try {
            if (connection.getResponseCode() != 200) throw new IOException("读取导出文件失败（HTTP " + connection.getResponseCode() + "）");
            try (InputStream input = connection.getInputStream(); OutputStream output = getContentResolver().openOutputStream(destination, "w")) {
              if (output == null) throw new IOException("无法打开保存位置");
              copyStream(input, output);
            }
            saved = true;
          } finally { connection.disconnect(); }
        }
      } catch (Exception error) {
        Log.e("ToonflowMobile", "导出文件失败", error);
        errorMessage = "导出文件失败：" + error.getMessage();
      } finally {
        try {
          HttpURLConnection cleanup = openExport(url, cookie, "DELETE");
          try {
            int code = cleanup.getResponseCode();
            if (code >= 400 && code != 404) Log.w("ToonflowMobile", "清理导出文件失败：HTTP " + code);
          } finally { cleanup.disconnect(); }
        } catch (IOException error) { Log.w("ToonflowMobile", "清理导出文件失败", error); }
      }
      notifySave(request.getQueryParameter("requestId"), saved, errorMessage);
    }, "mobileExport").start();
  }

  private void notifySave(String requestId, boolean saved, String error) {
    Map<String, Object> detail = new HashMap<>();
    detail.put("requestId", requestId);
    detail.put("saved", saved);
    if (error != null) detail.put("error", error);
    mainHandler.post(() -> {
      if (!isLocalPage()) return;
      if (geckoSession == null) {
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('toonflow:mobile-save',{detail:" + new JSONObject(detail) + "}))", null);
      } else if (geckoPort != null) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "save");
        message.put("detail", new JSONObject(detail));
        try { geckoPort.postMessage(new JSONObject(message)); }
        catch (RuntimeException sendError) { showError("无法返回文件保存结果：" + sendError.getMessage(), sendError); }
      } else showError("GeckoView 原生通信已断开。请重新打开 Toonflow。", null);
    });
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode == 1 && fileCallback != null) {
      Uri[] files = null;
      if (resultCode == RESULT_OK && data != null) {
        if (data.getClipData() != null) {
          files = new Uri[data.getClipData().getItemCount()];
          for (int index = 0; index < files.length; index++) files[index] = data.getClipData().getItemAt(index).getUri();
        } else if (data.getData() != null) files = new Uri[] { data.getData() };
      }
      if (files != null) for (Uri file : files) if (file == null || !"content".equals(file.getScheme())) {
        files = null;
        Toast.makeText(this, "请选择系统文件选择器提供的文件", Toast.LENGTH_LONG).show();
        break;
      }
      ValueCallback<Uri[]> callback = fileCallback;
      fileCallback = null;
      callback.onReceiveValue(files);
    }
    if (requestCode == 2 && pendingSave != null) {
      Uri request = pendingSave;
      pendingSave = null;
      finishSave(request, resultCode == RESULT_OK && data != null ? data.getData() : null, null);
    }
  }

  private void showError(String message, Exception error) {
    mainHandler.removeCallbacks(startupTimeout);
    mainHandler.removeCallbacks(browserTimeout);
    mainHandler.post(() -> {
      if (isDestroyed() || failed) return;
      failed = true;
      browserStage = "error";
      Log.e("ToonflowMobile", message, error);
      progressView.setVisibility(View.GONE);
      statusView.setGravity(Gravity.TOP | Gravity.START);
      int padding = (int) (24 * getResources().getDisplayMetrics().density);
      statusView.setPadding(padding, padding, padding, padding);
      statusView.setMovementMethod(new ScrollingMovementMethod());
      statusView.setText(message);
      statusView.setVisibility(View.VISIBLE);
    });
  }

  private void stopBun() {
    synchronized (processLock) {
      stopping = true;
      mainHandler.removeCallbacks(startupTimeout);
      if (bunProcess == null) return;
      Process process = bunProcess;
      bunProcess = null;
      if (!process.isAlive()) return;
      process.destroy();
      new Thread(() -> {
        try {
          if (!process.waitFor(2, TimeUnit.SECONDS)) process.destroyForcibly();
        } catch (InterruptedException error) {
          Thread.currentThread().interrupt();
          process.destroyForcibly();
        }
      }, "mobileBunStop").start();
    }
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (!hasFocus) return;
    if (Build.VERSION.SDK_INT >= 30) {
      getWindow().setDecorFitsSystemWindows(false);
      WindowInsetsController controller = getWindow().getInsetsController();
      if (controller == null) return;
      controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
      controller.hide(WindowInsets.Type.systemBars());
    } else {
      getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
  }

  @Override
  public void onBackPressed() {
    if (geckoSession != null && geckoCanGoBack) geckoSession.goBack();
    else if (geckoSession == null && webView != null && webView.canGoBack()) webView.goBack();
    else finish();
  }

  @Override
  protected void onDestroy() {
    // ACT: 当前版本仅随 Activity 运行；后台长任务需另行接入前台服务。
    finishCamera(false);
    cameraPermissionPending = false;
    if (fileCallback != null) fileCallback.onReceiveValue(null);
    fileCallback = null;
    if (pendingSave != null) finishSave(pendingSave, null, null);
    pendingSave = null;
    stopBun();
    mainHandler.removeCallbacksAndMessages(null);
    if (geckoPort != null) geckoPort.disconnect();
    geckoPort = null;
    if (webView != null) webView.destroy();
    if (geckoView != null) geckoView.releaseSession();
    if (geckoSession != null) geckoSession.close();
    new Thread(() -> {
      try { removeProgramDirectory(uploadDirectory); }
      catch (IOException error) { Log.w("ToonflowMobile", "清理文件缓存失败", error); }
    }, "mobileImportCleanup").start();
    super.onDestroy();
  }
}
