//! Portable builds don't manage the server's lifecycle at all — it's started
//! separately (run.ps1 / npm start), same as always. If it's not up yet when
//! this app launches, pointing the launcher window straight at
//! http://localhost:3000/launcher would fail the initial navigation before
//! any of our own HTML/JS ever loads, leaving WebView2's generic
//! "can't reach this page" screen with nothing to hook a nicer message into.
//! Checking first avoids that entirely.

use std::net::TcpStream;
use std::time::Duration;
use windows::core::HSTRING;
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONWARNING, MB_OK};

pub fn is_reachable() -> bool {
    TcpStream::connect_timeout(&"127.0.0.1:3000".parse().unwrap(), Duration::from_millis(1500)).is_ok()
}

pub fn show_unreachable_dialog() {
    let message = HSTRING::from(
        "F1TV HUD Desktop Mode couldn't reach the server at http://localhost:3000.\n\n\
         Start the server first (run.ps1, or 'npm start'), then launch this app again.",
    );
    let title = HSTRING::from("Server Not Running");

    unsafe {
        MessageBoxW(None, &message, &title, MB_OK | MB_ICONWARNING);
    }
}
