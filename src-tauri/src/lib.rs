mod commands;
mod github;
mod models;
mod storage;

use commands::DeviceFlowState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(tokio::sync::Mutex::new(DeviceFlowState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::list_snippets,
            commands::save_snippet,
            commands::create_snippet,
            commands::remove_snippet,
            commands::import_snippets,
            commands::export_snippets,
            commands::quick_copy,
            commands::read_clipboard,
            commands::github_start_flow,
            commands::github_poll_flow,
            commands::github_auth_status,
            commands::github_logout,
            commands::github_push,
            commands::github_pull,
            commands::merge_remote_store,
            commands::duplicate_snippet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
