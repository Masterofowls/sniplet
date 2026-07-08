use std::path::PathBuf;

use crate::models::{Snippet, SnippetStore, SyncMetadata};
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Store error: {0}")]
    Store(String),
}

pub type StorageResult<T> = Result<T, StorageError>;

fn snippets_path(app: &AppHandle) -> StorageResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| StorageError::Store(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("snippets.json"))
}

pub fn load_store(app: &AppHandle) -> StorageResult<SnippetStore> {
    let path = snippets_path(app)?;
    if !path.exists() {
        return Ok(SnippetStore {
            version: 1,
            snippets: Vec::new(),
            updated_at: None,
        });
    }
    let data = std::fs::read_to_string(path)?;
    Ok(serde_json::from_str(&data)?)
}

pub fn save_store(app: &AppHandle, store: &SnippetStore) -> StorageResult<()> {
    let path = snippets_path(app)?;
    let data = serde_json::to_string_pretty(store)?;
    std::fs::write(path, data)?;
    Ok(())
}

pub fn upsert_snippet(app: &AppHandle, snippet: Snippet) -> StorageResult<Snippet> {
    let mut store = load_store(app)?;
    if let Some(existing) = store.snippets.iter_mut().find(|s| s.id == snippet.id) {
        *existing = snippet.clone();
    } else {
        store.snippets.push(snippet.clone());
    }
    store.updated_at = Some(chrono::Utc::now());
    save_store(app, &store)?;
    Ok(snippet)
}

pub fn delete_snippet(app: &AppHandle, id: &str) -> StorageResult<bool> {
    let mut store = load_store(app)?;
    let before = store.snippets.len();
    store.snippets.retain(|s| s.id != id);
    if store.snippets.len() == before {
        return Ok(false);
    }
    store.updated_at = Some(chrono::Utc::now());
    save_store(app, &store)?;
    Ok(true)
}

pub fn replace_store(app: &AppHandle, store: SnippetStore) -> StorageResult<SnippetStore> {
    save_store(app, &store)?;
    Ok(store)
}

const SYNC_STORE: &str = "sync.json";

pub async fn load_sync_metadata(app: &AppHandle) -> StorageResult<SyncMetadata> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store(SYNC_STORE)
        .map_err(|e| StorageError::Store(e.to_string()))?;
    let gist_id = store.get("gist_id").and_then(|v| v.as_str().map(String::from));
    let github_username = store
        .get("github_username")
        .and_then(|v| v.as_str().map(String::from));
    let last_sync_at = store
        .get("last_sync_at")
        .and_then(|v| v.as_str().map(String::from))
        .and_then(|s| s.parse().ok());

    Ok(SyncMetadata {
        gist_id,
        github_username,
        last_sync_at,
    })
}

pub async fn save_sync_metadata(app: &AppHandle, meta: &SyncMetadata) -> StorageResult<()> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store(SYNC_STORE)
        .map_err(|e| StorageError::Store(e.to_string()))?;
    if let Some(gist_id) = &meta.gist_id {
        store.set("gist_id", gist_id.clone());
    } else {
        store.delete("gist_id");
    }
    if let Some(username) = &meta.github_username {
        store.set("github_username", username.clone());
    }
    if let Some(last_sync) = meta.last_sync_at {
        store.set("last_sync_at", last_sync.to_rfc3339());
    }
    store
        .save()
        .map_err(|e| StorageError::Store(e.to_string()))?;
    Ok(())
}

pub async fn save_github_token(app: &AppHandle, token: &str) -> StorageResult<()> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store(SYNC_STORE)
        .map_err(|e| StorageError::Store(e.to_string()))?;
    store.set("github_token", token.to_string());
    store
        .save()
        .map_err(|e| StorageError::Store(e.to_string()))?;
    Ok(())
}

pub async fn load_github_token(app: &AppHandle) -> StorageResult<Option<String>> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store(SYNC_STORE)
        .map_err(|e| StorageError::Store(e.to_string()))?;
    Ok(store
        .get("github_token")
        .and_then(|v| v.as_str().map(String::from)))
}

pub async fn clear_github_auth(app: &AppHandle) -> StorageResult<()> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store(SYNC_STORE)
        .map_err(|e| StorageError::Store(e.to_string()))?;
    store.delete("github_token");
    store.delete("gist_id");
    store.delete("github_username");
    store.delete("last_sync_at");
    store
        .save()
        .map_err(|e| StorageError::Store(e.to_string()))?;
    Ok(())
}
