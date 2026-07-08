fn main() {
    if let Ok(contents) = std::fs::read_to_string("../.env") {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                if key == "GITHUB_CLIENT_ID" && !value.is_empty() {
                    println!("cargo:rustc-env=GITHUB_CLIENT_ID={value}");
                }
            }
        }
    }
    tauri_build::build();
}
