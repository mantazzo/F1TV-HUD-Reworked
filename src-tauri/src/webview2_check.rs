//! Portable builds have no installer, so none of Tauri's built-in
//! `bundle.windows.webviewInstallMode` handling applies (it only hooks into
//! MSI/NSIS setup). This does the same presence check by hand, before any
//! window is created, so a missing WebView2 Runtime fails with a clear
//! message instead of a silent crash.

use windows::core::HSTRING;
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

// The WebView2 Runtime (Evergreen) registers itself under this client GUID,
// at one of a few possible paths depending on install scope/architecture.
const WEBVIEW2_CLIENT_KEY: &str =
    r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
const WEBVIEW2_CLIENT_KEY_WOW6432: &str =
    r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";

pub fn is_installed() -> bool {
    let candidates = [
        (HKEY_LOCAL_MACHINE, WEBVIEW2_CLIENT_KEY),
        (HKEY_LOCAL_MACHINE, WEBVIEW2_CLIENT_KEY_WOW6432),
        (HKEY_CURRENT_USER, WEBVIEW2_CLIENT_KEY),
        (HKEY_CURRENT_USER, WEBVIEW2_CLIENT_KEY_WOW6432),
    ];

    candidates.iter().any(|(hive, path)| {
        RegKey::predef(*hive)
            .open_subkey(path)
            .and_then(|key| key.get_value::<String, _>("pv"))
            .map(|version| !version.is_empty() && version != "0.0.0.0")
            .unwrap_or(false)
    })
}

pub fn show_missing_dialog() {
    let message = HSTRING::from(
        "F1TV HUD Desktop Mode requires the Microsoft Edge WebView2 Runtime, \
         which wasn't found on this system.\n\n\
         Click OK, then download and install it from:\n\
         https://developer.microsoft.com/microsoft-edge/webview2/\n\n\
         Pick the \"Evergreen Bootstrapper\". Most Windows 10/11 installs already \
         have this runtime — it's usually only missing on LTSC or minimal installs.",
    );
    let title = HSTRING::from("WebView2 Runtime Required");

    unsafe {
        MessageBoxW(None, &message, &title, MB_OK | MB_ICONERROR);
    }
}
