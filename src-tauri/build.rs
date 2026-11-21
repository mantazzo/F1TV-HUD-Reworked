fn main() {
  // The app version comes from ../package.json (see tauri.conf.json), but
  // tauri_build only watches tauri.conf.json — without this, a version bump
  // alone never re-embeds the version into the exe.
  println!("cargo:rerun-if-changed=../package.json");
  tauri_build::build()
}
