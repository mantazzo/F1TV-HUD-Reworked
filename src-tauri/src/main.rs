// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  #[cfg(windows)]
  if !app_lib::webview2_check::is_installed() {
    app_lib::webview2_check::show_missing_dialog();
    std::process::exit(1);
  }

  #[cfg(windows)]
  if !app_lib::server_check::is_reachable() {
    app_lib::server_check::show_unreachable_dialog();
    std::process::exit(1);
  }

  app_lib::run();
}
