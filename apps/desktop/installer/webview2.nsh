!include LogicLib.nsh

Function logWebView2Check
  SetDetailsPrint both
  DetailPrint "WebView2 [$4] 返回码：$0"
  DetailPrint "$1"
  ClearErrors
  FileOpen $3 "$TEMP\toonflowWebView2Check.log" a
  ${IfNot} ${Errors}
    FileWriteUTF16LE $3 "stage=$4; result=$0$\r$\n$1$\r$\n$\r$\n"
    FileClose $3
  ${EndIf}
  ${If} ${Errors}
    DetailPrint "无法写入诊断日志：$TEMP\toonflowWebView2Check.log，请保留安装详情。"
  ${Else}
    DetailPrint "诊断日志：$TEMP\toonflowWebView2Check.log"
  ${EndIf}
  ; ACT: 日志写入失败只影响诊断，不改变 WebView2 探测结果。
  ClearErrors
FunctionEnd

Function runWebView2Check
  SetDetailsPrint textonly
  DetailPrint "正在检查 WebView2 版本和实际启动能力…"
  SetDetailsPrint none
  nsExec::ExecToStack /TIMEOUT=60000 '"$PLUGINSDIR\checkWebView2.exe"'
  Pop $0
  Pop $1
  ${If} $0 == "timeout"
    StrCpy $0 5
    StrCpy $1 "$1$\r$\nWebView2 check exceeded the external 60-second timeout."
  ${EndIf}
  Call logWebView2Check
FunctionEnd

; NSIS 是 x86，使用 x64 检测程序检查与应用相同架构的 Runtime。
Function ensureWebView2
  InitPluginsDir
  File "/oname=$PLUGINSDIR\checkWebView2.exe" "${webView2Dir}\checkWebView2.exe"
  File "/oname=$PLUGINSDIR\WebView2Loader.dll" "${webView2Dir}\WebView2Loader.dll"
  File "/oname=$PLUGINSDIR\Microsoft.Web.WebView2.Core.dll" "${webView2Dir}\Microsoft.Web.WebView2.Core.dll"
  File "/oname=$PLUGINSDIR\webView2SdkLicense.txt" "${webView2Dir}\webView2SdkLicense.txt"
  File "/oname=$PLUGINSDIR\webView2SdkNotice.txt" "${webView2Dir}\webView2SdkNotice.txt"

  StrCpy $4 "initial"
  Call runWebView2Check
  ${If} $0 == 0
    Return
  ${EndIf}
  StrCpy $5 $0
  File "/oname=$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" "${webView2Dir}\MicrosoftEdgeWebview2Setup.exe"

  ${If} $0 == 4
  ${OrIf} $0 == 5
    ${If} ${Silent}
      ; ACT: 静默安装不因实测失败弹框或提权，交由调用方根据退出码和日志处理。
      Goto webView2Abort
    ${EndIf}
    MessageBox MB_YESNO|MB_ICONEXCLAMATION "检测到了 WebView2，但未能完成实际启动测试。可能与运行时、权限或系统策略有关。$\r$\n是否尝试使用微软组件修复？修复过程可能请求管理员权限；完成后将重新测试一次。$\r$\n检测返回码：$0$\r$\n诊断日志：$TEMP\toonflowWebView2Check.log" /SD IDNO IDNO webView2Abort
    SetDetailsPrint textonly
    DetailPrint "正在调用微软 WebView2 修复入口，请完成微软窗口中的操作…"
    SetDetailsPrint none
    nsExec::ExecToStack /TIMEOUT=600000 '"$PLUGINSDIR\checkWebView2.exe" --repair'
    Pop $0
    Pop $1
    StrCpy $4 "repair"
    Call logWebView2Check
    ${If} $0 == 0
      Goto recheckWebView2
    ${EndIf}
    ${If} $0 == 1
      DetailPrint "没有可用的微软注册修复入口，改用微软安装器进行安装或更新。"
      Goto installWebView2
    ${EndIf}
    MessageBox MB_OK|MB_ICONSTOP "未能完成 WebView2 修复，应用安装已停止。$\r$\n请确认微软修复进程已结束，再手动修复或重新运行安装包。$\r$\n修复返回码：$0$\r$\n诊断日志：$TEMP\toonflowWebView2Check.log$\r$\n$1" /SD IDOK
    Goto webView2Abort
  ${EndIf}
  ${If} $0 != 1
  ${AndIf} $0 != 3
    ${IfNot} ${Silent}
      MessageBox MB_OK|MB_ICONSTOP "无法完成 WebView2 检测，应用安装已停止。请重新运行安装包。$\r$\n检测返回码：$0$\r$\n诊断日志：$TEMP\toonflowWebView2Check.log$\r$\n$1" /SD IDOK
    ${EndIf}
    Goto webView2Abort
  ${EndIf}

installWebView2:
  ClearErrors
  ${If} ${Silent}
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $2
  ${ElseIf} $5 != 1
    SetDetailsPrint textonly
    DetailPrint "请允许微软安装器获取管理员权限并完成 WebView2 安装或更新…"
    SetDetailsPrint none
    ; ACT: 普通用户模式可能把已有旧 Runtime 视为已安装；仅微软更新进程请求提权。
    StrCpy $2 "管理员安装已结束，以启动实测为准"
    ExecShellWait "runas" "$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe"
  ${Else}
    SetDetailsPrint textonly
    DetailPrint "WebView2 缺失或版本过旧，请在弹出的微软窗口中完成安装或更新…"
    SetDetailsPrint none
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe"' $2
  ${EndIf}
  ${If} ${Errors}
    StrCpy $2 "无法启动或已取消管理员授权"
  ${EndIf}
  StrCpy $0 $2
  StrCpy $1 "Microsoft WebView2 installer finished; startup verification follows."
  StrCpy $4 "install"
  Call logWebView2Check

recheckWebView2:
  ; ACT: 微软操作返回成功不代表内核可用；新进程只复测一次，不循环修复。
  StrCpy $4 "recheck"
  Call runWebView2Check
  ${If} $0 != 0
    ${IfNot} ${Silent}
      MessageBox MB_YESNO|MB_ICONSTOP "WebView2 启动验证仍未通过，应用安装已停止。$\r$\n若微软安装或修复仍在进行，请等待完成后重试；否则请联系管理员检查运行时、权限与系统策略。$\r$\n是否打开微软官方下载页？$\r$\n检测返回码：$0$\r$\n诊断日志：$TEMP\toonflowWebView2Check.log$\r$\n$1" /SD IDNO IDNO webView2Abort
      ExecShell "open" "https://developer.microsoft.com/microsoft-edge/webview2/#download"
    ${EndIf}
    Goto webView2Abort
  ${EndIf}
  SetDetailsPrint both
  Return

webView2Abort:
  SetDetailsPrint both
  DetailPrint "WebView2 环境校验未通过，应用安装已停止。返回码：$0；诊断日志：$TEMP\toonflowWebView2Check.log"
  SetErrorLevel 2
  Abort
FunctionEnd
