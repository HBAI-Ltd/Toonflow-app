Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
XPStyle on
ManifestDPIAware true
SetFont "Microsoft YaHei UI" 9

!define appName "Toonflow"
!define uninstallKey "Software\Microsoft\Windows\CurrentVersion\Uninstall\${appIdentifier}.stable"
Var removeUserData
Var removeUserDataCheckbox
Var installStep

Name "${appName}"
Caption "${appName}"
BrandingText " "
OutFile "${outputFile}"
InstallDir "$LOCALAPPDATA\${appIdentifier}\stable"
; ACT: SDK 会把 InstallLocation 改成 app 子目录，NSIS 独立保存用户选择的安装根目录。
InstallDirRegKey HKCU "${uninstallKey}" "toonflowInstallDirectory"

Icon "${appIcon}"
UninstallIcon "${appIcon}"
ShowInstDetails show

!include MUI2.nsh
!define MUI_ICON "${appIcon}"
!define MUI_UNICON "${appIcon}"
!define MUI_DIRECTORYPAGE_TEXT_TOP "请选择 Toonflow 的安装目录。"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\app\bin\launcher.exe"
!define MUI_FINISHPAGE_RUN_TEXT "立即打开 Toonflow"
!define MUI_PAGE_CUSTOMFUNCTION_SHOW showFinishPage
!insertmacro MUI_PAGE_FINISH
UninstPage custom un.showUninstallOptions un.leaveUninstallOptions
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"

!include webview2.nsh
!include nsDialogs.nsh

!macro ensureAppStopped operation
  InitPluginsDir
  ClearErrors
  File "/oname=$PLUGINSDIR\checkRunning.exe" "${runningChecker}"
  ${If} ${Errors}
    MessageBox MB_OK|MB_ICONSTOP "无法准备运行状态检查程序，已停止${operation}。请重新运行安装或卸载程序。" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
checkRunning:
  nsExec::ExecToStack /TIMEOUT=15000 '"$PLUGINSDIR\checkRunning.exe" "$INSTDIR"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    ${If} $0 == 1
      StrCpy $2 "Toonflow 仍在运行，请先关闭此安装目录的应用，再点击“重试”。$\r$\n$INSTDIR$\r$\n$1"
    ${Else}
      StrCpy $2 "无法确认 Toonflow 是否已关闭，已停止${operation}。请关闭应用后重试。$\r$\n检测返回码：$0$\r$\n$1"
    ${EndIf}
    DetailPrint "$2"
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$2" /SD IDCANCEL IDRETRY checkRunning
    SetErrorLevel 2
    Abort
  ${EndIf}
!macroend

!macro moveFinishControl control x y width height
  System::Call '*(i ${x},i ${y},i ${width},i ${height})p.r0'
  System::Call 'user32::MapDialogRect(p$mui.FinishPage,p r0)'
  System::Call '*$0(i.r1,i.r2,i.r3,i.r4)'
  System::Free $0
  System::Call 'user32::MoveWindow(p${control},i r1,i r2,i r3,i r4,i 0)'
!macroend

Function showFinishPage
  ShowWindow $mui.FinishPage.Image ${SW_HIDE}
  System::Store "S"
  ; ACT: 保留 MUI 控件与完成行为，使用对话框单位适配字体和 DPI。
  !insertmacro moveFinishControl $mui.FinishPage.Title 12 10 300 28
  !insertmacro moveFinishControl $mui.FinishPage.Text 12 45 300 40
  !insertmacro moveFinishControl $mui.FinishPage.Run 12 90 300 12
  System::Store "L"
FunctionEnd

Function un.onInit
  StrCpy $removeUserData ${BST_UNCHECKED}
FunctionEnd

Function un.showUninstallOptions
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    SetErrorLevel 2
    Quit
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 24u "即将卸载 Toonflow，点击“卸载”继续。"
  Pop $0
  ${NSD_CreateCheckbox} 0 36u 100% 14u "同时删除用户数据"
  Pop $removeUserDataCheckbox
  ${NSD_SetState} $removeUserDataCheckbox $removeUserData
  ${NSD_CreateLabel} 12u 56u 94% 36u "删除本安装目录内的设置、素材、插件、项目列表及 WebView2 本地状态（若存在）。勾选后无法恢复；不勾选则保留。"
  Pop $0
  GetDlgItem $0 $HWNDPARENT 1
  ${NSD_SetText} $0 "卸载"
  nsDialogs::Show
FunctionEnd

Function un.leaveUninstallOptions
  ${NSD_GetState} $removeUserDataCheckbox $removeUserData
FunctionEnd

Section "Install"
  SetShellVarContext current
  StrCpy $installStep "创建安装目录"
  ClearErrors
  CreateDirectory "$INSTDIR"
  IfErrors installFailed
  ; ACT: NSIS 的 GetFullPathName 要求目录已存在；先创建，再通过临时变量保留失败时的原路径。
  StrCpy $installStep "确认安装目录"
  GetFullPathName $0 "$INSTDIR"
  IfErrors installFailed
  StrCpy $INSTDIR $0
  IfFileExists "$INSTDIR\app\*.*" 0 installApp
  ReadINIStr $0 "$INSTDIR\toonflow.ini" "application" "identifier"
  ${If} $0 != "${appIdentifier}"
    MessageBox MB_OK|MB_ICONSTOP "所选目录中已有不属于 Toonflow 的 app 文件夹，请选择其他安装目录。" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}

installApp:
  ; NSIS 是 x86，Sysnative 指向系统 x64 tar，避免重定向到 SysWOW64。
  IfFileExists "$WINDIR\Sysnative\tar.exe" tarReady 0
    MessageBox MB_OK|MB_ICONSTOP "未找到 Windows 系统 tar.exe，无法解压应用，请更新 Windows 后重试。" /SD IDOK
    SetErrorLevel 2
    Abort
tarReady:
  Call ensureWebView2
  !insertmacro ensureAppStopped "安装"
  ClearErrors
  StrCpy $installStep "创建应用目录"
  SetOutPath "$INSTDIR\app"
  IfErrors installFailed
  StrCpy $installStep "写入安装标识"
  WriteINIStr "$INSTDIR\toonflow.ini" "application" "identifier" "${appIdentifier}"
  IfErrors installFailed
  StrCpy $installStep "保存安装目录"
  WriteINIStr "$INSTDIR\toonflow.ini" "application" "installDirectory" "$INSTDIR"
  IfErrors installFailed
  StrCpy $installStep "创建更新文件目录"
  SetOutPath "$INSTDIR\self-extraction"
  IfErrors installFailed
  StrCpy $installStep "释放应用压缩包"
  File "/oname=${appHash}.tar" "${appTar}"
  IfErrors installFailed
  ; 重新解压前清理包内插件副本，避免旧构建的文件残留并在下次启动时被同步。
  StrCpy $installStep "更新内置插件文件"
  IfFileExists "$INSTDIR\app\Resources\app\nodes\*.*" 0 +2
    RMDir /r "$INSTDIR\app\Resources\app\nodes"
  IfFileExists "$INSTDIR\app\Resources\app\tools\*.*" 0 +2
    RMDir /r "$INSTDIR\app\Resources\app\tools"
  IfFileExists "$INSTDIR\app\Resources\app\skills\*.*" 0 +2
    RMDir /r "$INSTDIR\app\Resources\app\skills"
  IfFileExists "$INSTDIR\app\Resources\app\providers\*.*" 0 +2
    RMDir /r "$INSTDIR\app\Resources\app\providers"
  IfErrors installFailed
  ; ACT: 仅打包一份 tar，释放应用后保留原文件作为增量更新基线。
  nsExec::ExecToStack '"$WINDIR\Sysnative\tar.exe" -xf "$INSTDIR\self-extraction\${appHash}.tar" -C "$INSTDIR\app" --strip-components=1'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "应用解压失败，请确认目标目录可写并关闭正在运行的 Toonflow 后重试。$\r$\n解压返回码：$0$\r$\n$1" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
  StrCpy $installStep "检查应用启动文件"
  IfFileExists "$INSTDIR\app\bin\launcher.exe" 0 installFailed
  StrCpy $installStep "设置应用启动目录"
  SetOutPath "$INSTDIR\app\bin"
  IfErrors installFailed
  StrCpy $installStep "初始化 SDK 安装记录"
  File "/oname=$PLUGINSDIR\initializeInstall.ts" "initializeInstall.ts"
  IfErrors installFailed
  nsExec::ExecToStack '"$INSTDIR\app\bin\bun.exe" "$PLUGINSDIR\initializeInstall.ts" "$INSTDIR" "$DESKTOP" "$SMPROGRAMS"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    DetailPrint "$1"
    Goto installFailed
  ${EndIf}
  ; SDK 将 uninstall.exe 当作原生更新助手，NSIS 卸载器必须使用不同名称。
  StrCpy $installStep "生成卸载程序"
  WriteUninstaller "$INSTDIR\UninstallNSIS.exe"
  IfErrors installFailed
  StrCpy $installStep "写入系统卸载信息"
  WriteRegStr HKCU "${uninstallKey}" "DisplayName" "${appName}"
  WriteRegStr HKCU "${uninstallKey}" "DisplayVersion" "${appVersion}"
  WriteRegStr HKCU "${uninstallKey}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${uninstallKey}" "toonflowInstallDirectory" "$INSTDIR"
  WriteRegStr HKCU "${uninstallKey}" "DisplayIcon" "$INSTDIR\app\Resources\app.ico"
  WriteRegStr HKCU "${uninstallKey}" "UninstallString" '$\"$INSTDIR\UninstallNSIS.exe$\"'
  WriteRegStr HKCU "${uninstallKey}" "QuietUninstallString" '$\"$INSTDIR\UninstallNSIS.exe$\" /S'
  IfErrors installFailed
  StrCpy $installStep "注册 toonflow:// 协议"
  WriteRegStr HKCU "Software\Classes\toonflow" "" "URL:Toonflow Protocol"
  WriteRegStr HKCU "Software\Classes\toonflow" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\toonflow\DefaultIcon" "" '$\"$INSTDIR\app\Resources\app.ico$\",0'
  WriteRegStr HKCU "Software\Classes\toonflow\shell\open\command" "" '$\"$INSTDIR\app\Resources\app\protocolLauncher.exe$\" $\"%1$\"'
  IfErrors installFailed
  CreateShortCut "$DESKTOP\${appName}.lnk" "$INSTDIR\app\bin\launcher.exe" "" "$INSTDIR\app\Resources\app.ico"
  IfErrors 0 installDone
  ; ACT: 快捷方式不影响程序使用，失败时保留成功安装结果并告知手动启动路径。
  MessageBox MB_OK|MB_ICONEXCLAMATION "Toonflow 已安装，但无法创建桌面快捷方式。可以从以下位置启动：$\r$\n$INSTDIR\app\bin\launcher.exe" /SD IDOK
  Goto installDone

installFailed:
  MessageBox MB_OK|MB_ICONSTOP "安装未完成。$\r$\n失败步骤：$installStep$\r$\n安装目录：$INSTDIR$\r$\n$\r$\n请确认目录可写并关闭 Toonflow 后重试，详细信息见安装窗口。" /SD IDOK
  SetErrorLevel 2
  Abort
installDone:
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  GetFullPathName $0 "$INSTDIR"
  ReadINIStr $1 "$INSTDIR\toonflow.ini" "application" "installDirectory"
  ${If} $0 != $1
    MessageBox MB_OK|MB_ICONSTOP "卸载目录与 Toonflow 的安装目录不一致，已停止卸载。" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
  ReadINIStr $0 "$INSTDIR\toonflow.ini" "application" "identifier"
  ${If} $0 != "${appIdentifier}"
    MessageBox MB_OK|MB_ICONSTOP "无法确认此目录属于 Toonflow，已停止卸载。" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
  !insertmacro ensureAppStopped "卸载"
  SetOutPath "$TEMP"
  ClearErrors
  RMDir /r "$INSTDIR\app"
  IfErrors uninstallFailed
  RMDir /r "$INSTDIR\self-extraction"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$INSTDIR\.electrobun-uninstall.json"
  Delete "$INSTDIR\.electrobun-update-*.json"
  Delete "$INSTDIR\.electrobun-observed-update-result.json"
  IfErrors uninstallFailed
  ${If} $removeUserData == ${BST_CHECKED}
    RMDir /r "$INSTDIR\data"
    RMDir /r "$INSTDIR\WebView2"
    IfErrors uninstallFailed
  ${EndIf}
  ReadRegStr $0 HKCU "${uninstallKey}" "toonflowInstallDirectory"
  ${If} $0 == $INSTDIR
    Delete "$DESKTOP\${appName}.lnk"
    Delete "$SMPROGRAMS\${appName}.lnk"
    IfErrors uninstallFailed
  ${EndIf}
  ClearErrors
  ; ACT: 清理成功后才移除卸载入口；文件被占用时保留入口供用户重试。
  Delete "$INSTDIR\UninstallNSIS.exe"
  IfErrors uninstallFailed
  Delete "$INSTDIR\toonflow.ini"
  IfErrors uninstallMetadataFailed
  ReadRegStr $0 HKCU "${uninstallKey}" "toonflowInstallDirectory"
  ${If} $0 == $INSTDIR
    DeleteRegKey HKCU "${uninstallKey}"
    IfErrors uninstallMetadataFailed
  ${EndIf}
  ClearErrors
  ReadRegStr $0 HKCU "Software\Classes\toonflow\shell\open\command" ""
  ${If} $0 == '$\"$INSTDIR\app\Resources\app\protocolLauncher.exe$\" $\"%1$\"'
    DeleteRegKey HKCU "Software\Classes\toonflow"
    IfErrors uninstallMetadataFailed
  ${EndIf}
  ClearErrors
  RMDir "$INSTDIR"
  ${If} $removeUserData == ${BST_CHECKED}
  ${AndIf} ${Errors}
    MessageBox MB_OK|MB_ICONEXCLAMATION "程序已卸载，但安装目录仍有其他文件，请手动确认：$\r$\n$INSTDIR" /SD IDOK
    SetErrorLevel 2
  ${EndIf}
  Goto uninstallDone
uninstallMetadataFailed:
  MessageBox MB_OK|MB_ICONEXCLAMATION "程序已卸载，但卸载信息清理失败，请检查安装目录及系统的应用列表。$\r$\n$INSTDIR" /SD IDOK
  SetErrorLevel 2
  Goto uninstallDone
uninstallFailed:
  MessageBox MB_OK|MB_ICONSTOP "未能删除全部文件，请关闭 Toonflow 及相关窗口后重新卸载。用户数据仅按刚才的选择处理。" /SD IDOK
  SetErrorLevel 2
  Abort
uninstallDone:
SectionEnd
