package com.toonflow.mobile;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.net.ConnectivityManager;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
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
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONTokener;
import com.tencent.smtt.sdk.QbSdk;
import com.tencent.smtt.sdk.TbsCommonCode;
import com.tencent.smtt.sdk.TbsDownloadConfig;
import com.tencent.smtt.sdk.TbsDownloader;
import com.tencent.smtt.sdk.TbsListener;

public class mobileActivity extends Activity {
  private static final Object payloadLock = new Object();
  private static final String uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  private static boolean x5InitializationStarted;
  private static Boolean x5InitializationResult;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private final Object processLock = new Object();
  private volatile boolean stopping;
  private volatile Uri localOrigin;
  private Process bunProcess;
  private FrameLayout root;
  private WebView webView;
  private com.tencent.smtt.sdk.WebView x5WebView;
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
  private boolean x5Requested;
  private boolean x5DownloadStarted;
  private int downloadCode = Integer.MIN_VALUE;
  private int installCode = Integer.MIN_VALUE;
  private final Runnable browserTimeout = () -> showError("Browser startup timed out. Close and reopen Toonflow to retry.", null);
  private final Runnable x5Timeout = () -> showError("X5 initialization timed out (180 seconds). " + x5Status() + " Close and reopen Toonflow to retry.", null);
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
        if (x5WebView == null) pageFinished(url);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame() && x5WebView == null && !x5Requested) showError("Local page failed to load: " + error.getDescription(), null);
      }

      @Override
      public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
        if (request.isForMainFrame() && x5WebView == null && !x5Requested) showError("Local page returned HTTP " + response.getStatusCode() + ".", null);
      }
    });
    root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
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
    new Thread(this::startBun, "mobileBun").start();
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
    return x5WebView == null ? webView.getUrl() : x5WebView.getUrl();
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
    mainHandler.removeCallbacks(x5Timeout);
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
    if (x5WebView == null) webView.loadUrl(url);
    else x5WebView.loadUrl(url);
  }

  private void evaluateBrowser(String script, ValueCallback<String> callback) {
    if (x5WebView == null) webView.evaluateJavascript(script, callback);
    else x5WebView.evaluateJavascript(script, callback == null ? null : callback::onReceiveValue);
  }

  private void probeBrowser() {
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
      if (x5WebView == null) webView.clearHistory();
      else x5WebView.clearHistory();
      statusView.setVisibility(View.GONE);
      progressView.setVisibility(View.GONE);
      return;
    }
    if (!"systemProbe".equals(browserStage) || !"1".equals(page.getQueryParameter("probe")) || page.getQueryParameter("token") != null) return;
    String stage = browserStage;
    evaluateBrowser("JSON.stringify(window.toonflowBrowserProbe)", value -> {
      if (stopping || failed || !stage.equals(browserStage)) return;
      try {
        Object decoded = new JSONTokener(value == null ? "null" : value).nextValue();
        if (!(decoded instanceof String)) throw new IOException("Missing browser probe result.");
        JSONObject result = new JSONObject((String) decoded);
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
        if (missing.length() == 0) {
          browserStage = "page";
          Log.i("ToonflowMobile", "System WebView capability check passed");
          mainHandler.postDelayed(browserTimeout, 30000);
          loadBrowserUrl("http://127.0.0.1:" + localOrigin.getPort() + "/?mobile=1");
        } else {
          systemMissing = names.toString();
          startX5();
        }
      } catch (Exception error) {
        showError("Unable to verify browser capabilities: " + error.getMessage(), error);
      }
    });
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

  private String x5Status() {
    return "SDK download code: " + (downloadCode == Integer.MIN_VALUE ? "pending" : downloadCode)
      + "; install code: " + (installCode == Integer.MIN_VALUE ? "pending" : installCode) + ".";
  }

  private void startX5() {
    if (x5Requested || stopping || failed) return;
    x5Requested = true;
    browserStage = "x5Download";
    webView.stopLoading();
    webView.setVisibility(View.GONE);
    showProgress("Preparing X5 browser core...");
    ConnectivityManager connectivity = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
    if (connectivity == null || connectivity.isActiveNetworkMetered()) {
      new AlertDialog.Builder(this).setTitle("Download browser core?")
        .setMessage("The system browser is missing required features. Allow X5 to download its browser core using mobile data? Data charges may apply.")
        .setPositiveButton("Allow mobile data", (dialog, which) -> initializeX5(true))
        .setNegativeButton("Not now", (dialog, which) -> showError("X5 download was not allowed. Connect to Wi-Fi and reopen Toonflow to retry.", null))
        .setOnCancelListener(dialog -> showError("X5 download was cancelled. Reopen Toonflow to retry.", null)).show();
    } else initializeX5(false);
  }

  private void initializeX5(boolean mobileDataAllowed) {
    if (stopping || failed) return;
    mainHandler.postDelayed(x5Timeout, 180000);
    try {
      QbSdk.disableSensitiveApi();
      com.tencent.smtt.sdk.TbsPrivacyAccess.AppList.setEnabled(false);
      QbSdk.setDownloadWithoutWifi(mobileDataAllowed);
      QbSdk.setTbsListener(new TbsListener() {
        @Override
        public void onDownloadFinish(int code) {
          mainHandler.post(() -> {
            if (stopping || failed || !"x5Download".equals(browserStage)) return;
            downloadCode = code;
            if (code != TbsCommonCode.DOWNLOAD_SUCCESS) {
              showError("X5 download failed. " + x5Status() + " Force stop Toonflow and reopen it to retry.", null);
            } else showProgress("Installing X5 browser core...");
          });
        }

        @Override
        public void onInstallFinish(int code) {
          mainHandler.post(() -> {
            if (stopping || failed || !"x5Download".equals(browserStage)) return;
            installCode = code;
            if (code == TbsCommonCode.INSTALL_FOR_PREINIT_CALLBACK || code == TbsListener.ErrorCode.INSTALL_FROM_UNZIP) return;
            switch (code) {
              case TbsCommonCode.INSTALL_SUCCESS:
              case TbsListener.ErrorCode.COPY_INSTALL_SUCCESS:
              case TbsListener.ErrorCode.INCRUPDATE_INSTALL_SUCCESS:
              case TbsListener.ErrorCode.RENAME_SUCCESS:
              case TbsListener.ErrorCode.INSTALL_SUCCESS_AND_RELEASE_LOCK:
              case TbsListener.ErrorCode.DECOUPLE_INSTLL_SUCCESS:
              case TbsListener.ErrorCode.DECOUPLE_INCURUPDATE_SUCCESS:
              case TbsListener.ErrorCode.TPATCH_INSTALL_SUCCESS:
              case TbsListener.ErrorCode.DECOUPLE_TPATCH_INSTALL_SUCCESS:
                preInitializeX5();
                break;
              default:
                showError("X5 installation failed. " + x5Status() + " Force stop Toonflow and reopen it to retry.", null);
            }
          });
        }

        @Override
        public void onDownloadProgress(int progress) {
          mainHandler.post(() -> {
            if (!"x5Download".equals(browserStage)) return;
            showProgress("Downloading X5 browser core: " + Math.max(0, Math.min(progress, 100)) + "%");
          });
        }
      });
      if (QbSdk.getTbsVersion(getApplicationContext()) > 0) {
        preInitializeX5();
        return;
      }
      TbsDownloader.needDownload(getApplicationContext(), false, false, (needed, version) -> mainHandler.post(() -> {
        if (stopping || failed || !"x5Download".equals(browserStage)) return;
        if (!needed) {
          if (QbSdk.getTbsVersion(getApplicationContext()) > 0) preInitializeX5();
          else {
            downloadCode = TbsDownloadConfig.getInstance(getApplicationContext()).getCurrentDownloadInterruptCode();
            showError("X5 browser core is unavailable (requested version " + version + "). " + x5Status() + " Force stop Toonflow and reopen it to retry.", null);
          }
          return;
        }
        if (x5DownloadStarted) return;
        x5DownloadStarted = true;
        showProgress("Downloading X5 browser core...");
        TbsDownloader.startDownload(getApplicationContext());
      }));
    } catch (Exception error) {
      showError("Unable to initialize X5: " + error.getMessage() + ". " + x5Status(), error);
    }
  }

  private void preInitializeX5() {
    if (stopping || failed || !"x5Download".equals(browserStage)) return;
    if (Boolean.TRUE.equals(x5InitializationResult) || QbSdk.isX5Core()) {
      createX5View();
      return;
    }
    // ACT: SDK 44286 preInit is process-once; a failed process must be restarted before retrying.
    if (x5InitializationStarted) {
      showError("X5 could not activate in this process. " + x5Status() + " Force stop Toonflow and reopen it to retry.", null);
      return;
    }
    x5InitializationStarted = true;
    showProgress("Initializing X5 browser core...");
    try {
      QbSdk.preInit(getApplicationContext(), new QbSdk.PreInitCallback() {
        @Override
        public void onCoreInitFinished() {}

        @Override
        public void onViewInitFinished(boolean isX5Core) {
          mainHandler.post(() -> {
            x5InitializationResult = isX5Core;
            if (stopping || failed || !"x5Download".equals(browserStage)) return;
            if (!isX5Core) {
              Log.e("ToonflowMobile", "X5 initialization failed: " + QbSdk.getX5CoreLoadHelp(getApplicationContext()));
              showError("X5 did not activate. The system browser is missing: " + systemMissing + ". " + x5Status() + " Force stop Toonflow and reopen it to retry.", null);
              return;
            }
            createX5View();
          });
        }
      });
    } catch (Exception error) {
      x5InitializationResult = false;
      showError("Unable to initialize X5: " + error.getMessage() + ". " + x5Status(), error);
    }
  }

  private void createX5View() {
    try {
      com.tencent.smtt.sdk.WebView view = new com.tencent.smtt.sdk.WebView(this);
      if (!view.getIsX5Core()) {
        view.destroy();
        showError("X5 did not activate. The system browser is missing: " + systemMissing + ". " + x5Status() + " Reopen Toonflow to retry.", null);
        return;
      }
      x5WebView = view;
      mainHandler.removeCallbacks(x5Timeout);
      view.getSettings().setJavaScriptEnabled(true);
      view.getSettings().setDomStorageEnabled(true);
      view.getSettings().setAllowFileAccess(false);
      view.getSettings().setAllowContentAccess(true);
      view.getSettings().setUseWideViewPort(true);
      view.getSettings().setLoadWithOverviewMode(true);
      view.getSettings().setSupportZoom(false);
      view.getSettings().setSupportMultipleWindows(false);
      view.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
      view.setWebChromeClient(new com.tencent.smtt.sdk.WebChromeClient() {
        @Override
        public void onPermissionRequest(com.tencent.smtt.export.external.interfaces.PermissionRequest request) {
          requestCamera(request, request.getOrigin(), request.getResources(), allowed -> {
            if (allowed) request.grant(new String[] { com.tencent.smtt.export.external.interfaces.PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            else request.deny();
          });
        }

        @Override
        public void onPermissionRequestCanceled(com.tencent.smtt.export.external.interfaces.PermissionRequest request) { cancelCamera(request); }

        @Override
        public boolean onShowFileChooser(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.sdk.ValueCallback<Uri[]> callback, FileChooserParams params) {
          try {
            chooseFile(params.createIntent(), callback::onReceiveValue);
          } catch (Exception error) {
            callback.onReceiveValue(null);
            Toast.makeText(mobileActivity.this, "Unable to open the file picker.", Toast.LENGTH_LONG).show();
          }
          return true;
        }
      });
      view.setWebViewClient(new com.tencent.smtt.sdk.WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.export.external.interfaces.WebResourceRequest request) {
          return navigate(request.getUrl(), request.isForMainFrame());
        }

        @Override
        public boolean shouldOverrideUrlLoading(com.tencent.smtt.sdk.WebView browser, String url) {
          return navigate(Uri.parse(url), true);
        }

        @Override
        public com.tencent.smtt.export.external.interfaces.WebResourceResponse shouldInterceptRequest(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.export.external.interfaces.WebResourceRequest request) {
          if (allowRequest(request.getUrl(), request.isForMainFrame())) return null;
          return new com.tencent.smtt.export.external.interfaces.WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", null, new ByteArrayInputStream(new byte[0]));
        }

        @Override
        public com.tencent.smtt.export.external.interfaces.WebResourceResponse shouldInterceptRequest(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.export.external.interfaces.WebResourceRequest request, Bundle extras) {
          return shouldInterceptRequest(browser, request);
        }

        @Override
        public com.tencent.smtt.export.external.interfaces.WebResourceResponse shouldInterceptRequest(com.tencent.smtt.sdk.WebView browser, String url) {
          // ACT: The legacy callback has no frame information; modern callbacks enforce main-frame origin checks.
          if (allowRequest(Uri.parse(url), false)) return null;
          return new com.tencent.smtt.export.external.interfaces.WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", null, new ByteArrayInputStream(new byte[0]));
        }

        @Override
        public void onPageFinished(com.tencent.smtt.sdk.WebView browser, String url) { pageFinished(url); }

        @Override
        public void onReceivedError(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.export.external.interfaces.WebResourceRequest request, com.tencent.smtt.export.external.interfaces.WebResourceError error) {
          if (request.isForMainFrame()) showError("Local X5 page failed to load: " + error.getDescription(), null);
        }

        @Override
        public void onReceivedHttpError(com.tencent.smtt.sdk.WebView browser, com.tencent.smtt.export.external.interfaces.WebResourceRequest request, com.tencent.smtt.export.external.interfaces.WebResourceResponse response) {
          if (request.isForMainFrame()) showError("Local X5 page returned HTTP " + response.getStatusCode() + ".", null);
        }
      });
      root.addView(view, 0, new FrameLayout.LayoutParams(-1, -1));
      root.removeView(webView);
      webView.destroy();
      webView = null;
      Log.i("ToonflowMobile", "X5 activated, core version " + QbSdk.getTbsVersion(getApplicationContext()));
      browserStage = "page";
      mainHandler.postDelayed(browserTimeout, 30000);
      loadBrowserUrl(localOrigin.buildUpon().appendQueryParameter("engine", "x5").build().toString());
    } catch (Exception error) {
      showError("Unable to create X5 browser: " + error.getMessage() + ". " + x5Status(), error);
    }
  }

  private boolean isLocalOrigin(Uri uri) {
    Uri origin = localOrigin;
    return origin != null && uri != null && "http".equals(uri.getScheme()) && "127.0.0.1".equals(uri.getHost())
      && uri.getUserInfo() == null && uri.getPort() == origin.getPort();
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
    String cookie = x5WebView == null ? CookieManager.getInstance().getCookie(url) : com.tencent.smtt.sdk.CookieManager.getInstance().getCookie(url);
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
    String script = "window.dispatchEvent(new CustomEvent('toonflow:mobile-save',{detail:" + new JSONObject(detail) + "}))";
    mainHandler.post(() -> {
      if (stopping) return;
      String currentUrl = browserUrl();
      if (currentUrl != null && isLocalOrigin(Uri.parse(currentUrl))) evaluateBrowser(script, null);
    });
  }

  @Override
  protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode == 1 && fileCallback != null) {
      Uri[] files = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
      if (files != null) for (Uri file : files) if (!"content".equals(file.getScheme())) {
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
    mainHandler.removeCallbacks(x5Timeout);
    mainHandler.post(() -> {
      if (isDestroyed() || failed) return;
      failed = true;
      browserStage = "error";
      if (x5DownloadStarted) TbsDownloader.stopDownload();
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
    if (x5WebView != null && x5WebView.canGoBack()) x5WebView.goBack();
    else if (x5WebView == null && webView != null && webView.canGoBack()) webView.goBack();
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
    if (x5Requested) {
      if (x5DownloadStarted) TbsDownloader.stopDownload();
      QbSdk.setTbsListener(null);
    }
    if (webView != null) webView.destroy();
    if (x5WebView != null) x5WebView.destroy();
    super.onDestroy();
  }
}
