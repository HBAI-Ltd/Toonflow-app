!include LogicLib.nsh

; NSIS 是 x86，使用 x64 检测程序检查与应用相同架构的 Runtime。
Function ensureWebView2
  InitPluginsDir
  File "/oname=$PLUGINSDIR\checkWebView2.exe" "${webView2Dir}\checkWebView2.exe"
  File "/oname=$PLUGINSDIR\WebView2Loader.dll" "${webView2Dir}\WebView2Loader.dll"

  SetDetailsPrint textonly
  DetailPrint "正在检查 WebView2 运行时…"
  SetDetailsPrint none
  nsExec::ExecToStack /TIMEOUT=15000 '"$PLUGINSDIR\checkWebView2.exe"'
  Pop $0
  Pop $1
  ${If} $0 == 0
    SetDetailsPrint both
    Return
  ${EndIf}
  ${If} $0 != 1
    MessageBox MB_OK|MB_ICONSTOP "无法检测 WebView2 运行时，请重新运行安装包。$\r$\n检测返回码：$0$\r$\n$1" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}

  File "/oname=$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" "${webView2Dir}\MicrosoftEdgeWebview2Setup.exe"
  ClearErrors
  ${If} ${Silent}
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $2
  ${Else}
    SetDetailsPrint textonly
    DetailPrint "请在弹出的 WebView2 窗口中完成安装…"
    SetDetailsPrint none
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe"' $2
  ${EndIf}
  ${If} ${Errors}
    StrCpy $2 "无法启动"
  ${EndIf}

  ; 安装返回码不能证明 Runtime 可用，使用新进程再次检测。
  SetDetailsPrint textonly
  DetailPrint "正在验证 WebView2 运行时…"
  SetDetailsPrint none
  nsExec::ExecToStack /TIMEOUT=15000 '"$PLUGINSDIR\checkWebView2.exe"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "WebView2 运行时仍不可用，应用安装已停止。$\r$\n请确认网络连接，或手动安装微软 WebView2 运行时后重试。$\r$\n安装返回码：$2；检测返回码：$0$\r$\n$1" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
  SetDetailsPrint both
FunctionEnd
