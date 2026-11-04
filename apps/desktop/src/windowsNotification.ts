import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import type { DesktopRuntime } from "@toonflow/server/desktop";

const execFileAsync = promisify(execFile);

export default async function showWindowsNotification(
  appId: string,
  iconPath: string,
  options: Parameters<DesktopRuntime["showNotification"]>[0],
) {
  const payload = Buffer.from(JSON.stringify({ appId, iconPath, ...options })).toString("base64");
  // ACT: SDK 的通知区气泡由 Windows 推断为 bun；WinRT 显式指定应用身份，避免依赖进程名和通用托盘图标。
  const script = `
$ErrorActionPreference = 'Stop'
$options = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$registration = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Software\\Classes\\AppUserModelId\\' + $options.appId)
try {
  $registration.SetValue('DisplayName', 'Toonflow')
  $registration.SetValue('IconUri', $options.iconPath, [Microsoft.Win32.RegistryValueKind]::ExpandString)
} finally {
  $registration.Dispose()
}
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime] > $null
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml('<toast><visual><binding template="ToastGeneric"><text/><text/></binding></visual></toast>')
$texts = $xml.GetElementsByTagName('text')
$texts.Item(0).InnerText = $options.title
$texts.Item(1).InnerText = [string]$options.body
if ($options.silent) {
  $audio = $xml.CreateElement('audio')
  $audio.SetAttribute('silent', 'true')
  $xml.DocumentElement.AppendChild($audio) > $null
}
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($options.appId).Show($toast)
`;
  const powershell = resolve(process.env.WINDIR!, "System32/WindowsPowerShell/v1.0/powershell.exe");
  await execFileAsync(powershell, ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], {
    windowsHide: true,
    timeout: 15000,
  });
}
