using System;
using System.Runtime.InteropServices;

internal static class checkWebView2
{
    // ACT: URL.canParse 需要 Chromium 120；同时覆盖 Map.groupBy 和 Promise.withResolvers。
    private static readonly Version minimumVersion = new Version(120, 0, 0, 0);

    [DllImport("WebView2Loader.dll", EntryPoint = "GetAvailableCoreWebView2BrowserVersionString",
        CharSet = CharSet.Unicode,
        ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    private static extern int getAvailableVersion(
        string browserExecutableFolder, out IntPtr versionInfo);

    private static int Main()
    {
        IntPtr versionInfo = IntPtr.Zero;
        try
        {
            int result = getAvailableVersion(null, out versionInfo);
            string version = versionInfo == IntPtr.Zero
                ? null : Marshal.PtrToStringUni(versionInfo);
            Version installedVersion;
            if (result >= 0 && Version.TryParse(version, out installedVersion)
                && installedVersion > new Version(0, 0, 0, 0))
            {
                if (installedVersion < minimumVersion)
                {
                    Console.WriteLine("WebView2 Runtime outdated: version=" + version
                        + "; required>=" + minimumVersion);
                    return 3;
                }
                Console.WriteLine("WebView2 Runtime available: " + version);
                return 0;
            }

            Console.WriteLine("WebView2 Runtime unavailable: HRESULT=0x"
                + result.ToString("X8") + "; version=" + (version ?? "<none>")
                + "; required>=" + minimumVersion);
            return 1;
        }
        catch (Exception error)
        {
            Console.WriteLine("WebView2 check failed: " + error.GetType().Name
                + ": " + error.Message);
            return 2;
        }
        finally
        {
            if (versionInfo != IntPtr.Zero)
                Marshal.FreeCoTaskMem(versionInfo);
        }
    }
}
