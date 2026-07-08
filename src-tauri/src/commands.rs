use crate::github::{
    disconnect, get_auth_status, poll_device_flow, pull_sync, push_sync, start_device_flow, AuthStatus,
    DeviceFlowStart, GitHubError,
};
use crate::models::{Snippet, SnippetStore};
use crate::storage::{
    delete_snippet, load_store, replace_store, upsert_snippet, StorageError,
};
use chrono::Utc;
use serde::Deserialize;
use tauri::{AppHandle, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use uuid::Uuid;

pub struct DeviceFlowState {
    pub device_code: Option<String>,
}

impl Default for DeviceFlowState {
    fn default() -> Self {
        Self {
            device_code: None,
        }
    }
}

fn map_storage_err(err: StorageError) -> String {
    err.to_string()
}

fn map_github_err(err: GitHubError) -> String {
    err.to_string()
}

#[tauri::command]
pub fn list_snippets(app: AppHandle) -> Result<SnippetStore, String> {
    load_store(&app).map_err(map_storage_err)
}

#[tauri::command]
pub fn save_snippet(app: AppHandle, snippet: Snippet) -> Result<Snippet, String> {
    upsert_snippet(&app, snippet).map_err(map_storage_err)
}

#[tauri::command]
pub fn create_snippet(
    app: AppHandle,
    title: String,
    code: String,
    language: String,
    tags: Vec<String>,
) -> Result<Snippet, String> {
    let snippet = Snippet::new(title, code, language, tags);
    upsert_snippet(&app, snippet).map_err(map_storage_err)
}

#[tauri::command]
pub fn remove_snippet(app: AppHandle, id: String) -> Result<bool, String> {
    delete_snippet(&app, &id).map_err(map_storage_err)
}

#[derive(Debug, Deserialize)]
struct ImportPayload {
    title: Option<String>,
    code: String,
    language: Option<String>,
    tags: Option<Vec<String>>,
}

#[tauri::command]
pub fn import_snippets(app: AppHandle, payload: String) -> Result<Vec<Snippet>, String> {
    let mut created = Vec::new();

    if let Ok(items) = serde_json::from_str::<Vec<ImportPayload>>(&payload) {
        for item in items {
            let snippet = Snippet::new(
                item.title.unwrap_or_else(|| "Imported snippet".into()),
                item.code,
                item.language.unwrap_or_else(|| "plaintext".into()),
                item.tags.unwrap_or_default(),
            );
            created.push(upsert_snippet(&app, snippet).map_err(map_storage_err)?);
        }
        return Ok(created);
    }

    if let Ok(item) = serde_json::from_str::<ImportPayload>(&payload) {
        let snippet = Snippet::new(
            item.title.unwrap_or_else(|| "Imported snippet".into()),
            item.code,
            item.language.unwrap_or_else(|| "plaintext".into()),
            item.tags.unwrap_or_default(),
        );
        created.push(upsert_snippet(&app, snippet).map_err(map_storage_err)?);
        return Ok(created);
    }

    let snippet = Snippet::new(
        "Quick import".into(),
        payload,
        "plaintext".into(),
        Vec::new(),
    );
    created.push(upsert_snippet(&app, snippet).map_err(map_storage_err)?);
    Ok(created)
}

#[tauri::command]
pub fn export_snippets(app: AppHandle) -> Result<String, String> {
    let store = load_store(&app).map_err(map_storage_err)?;
    serde_json::to_string_pretty(&store).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn quick_copy(app: AppHandle, content: String) -> Result<(), String> {
    app.clipboard()
        .write_text(content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_clipboard(app: AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_start_flow(
    state: State<'_, tokio::sync::Mutex<DeviceFlowState>>,
) -> Result<DeviceFlowStart, String> {
    let flow = start_device_flow().await.map_err(map_github_err)?;
    let mut guard = state.lock().await;
    guard.device_code = Some(flow.device_code.clone());
    Ok(flow)
}

#[tauri::command]
pub async fn github_poll_flow(
    app: AppHandle,
    state: State<'_, tokio::sync::Mutex<DeviceFlowState>>,
) -> Result<AuthStatus, String> {
    let device_code = {
        let guard = state.lock().await;
        guard
            .device_code
            .clone()
            .ok_or_else(|| "Device flow not started".to_string())?
    };

    match poll_device_flow(&app, &device_code).await {
        Ok(_) => get_auth_status(&app).await.map_err(map_github_err),
        Err(GitHubError::Pending) => Err("authorization_pending".into()),
        Err(err) => Err(map_github_err(err)),
    }
}

#[tauri::command]
pub async fn github_auth_status(app: AppHandle) -> Result<AuthStatus, String> {
    get_auth_status(&app).await.map_err(map_github_err)
}

#[tauri::command]
pub async fn github_logout(app: AppHandle) -> Result<(), String> {
    disconnect(&app).await.map_err(map_github_err)
}

#[tauri::command]
pub async fn github_push(app: AppHandle) -> Result<AuthStatus, String> {
    push_sync(&app).await.map_err(map_github_err)?;
    get_auth_status(&app).await.map_err(map_github_err)
}

#[tauri::command]
pub async fn github_pull(app: AppHandle) -> Result<SnippetStore, String> {
    pull_sync(&app).await.map_err(map_github_err)
}

#[tauri::command]
pub fn merge_remote_store(app: AppHandle, remote: SnippetStore) -> Result<SnippetStore, String> {
    let mut local = load_store(&app).map_err(map_storage_err)?;
    for remote_snippet in remote.snippets {
        if let Some(existing) = local
            .snippets
            .iter_mut()
            .find(|s| s.id == remote_snippet.id)
        {
            if remote_snippet.updated_at > existing.updated_at {
                *existing = remote_snippet;
            }
        } else {
            local.snippets.push(remote_snippet);
        }
    }
    local.updated_at = Some(Utc::now());
    replace_store(&app, local).map_err(map_storage_err)
}

#[tauri::command]
pub fn duplicate_snippet(app: AppHandle, id: String) -> Result<Snippet, String> {
    let store = load_store(&app).map_err(map_storage_err)?;
    let source = store
        .snippets
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| "Snippet not found".to_string())?;

    let mut copy = source;
    copy.id = Uuid::new_v4().to_string();
    copy.title = format!("{} (copy)", copy.title);
    let now = Utc::now();
    copy.created_at = now;
    copy.updated_at = now;
    upsert_snippet(&app, copy).map_err(map_storage_err)
}
