use crate::models::{SnippetStore, SyncMetadata};
use crate::storage::{load_github_token, load_store, load_sync_metadata, save_github_token, save_sync_metadata, save_store, StorageError};
use reqwest::header::{AUTHORIZATION, USER_AGENT};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use thiserror::Error;

const GITHUB_CLIENT_ID: &str = match option_env!("GITHUB_CLIENT_ID") {
    Some(id) => id,
    None => "Ov23liSnipletMobile01",
};
const GIST_FILENAME: &str = "sniplet-snippets.json";
const USER_AGENT_VALUE: &str = "Sniplet/0.1.0";

#[derive(Debug, Error)]
pub enum GitHubError {
    #[error("Storage error: {0}")]
    Storage(#[from] StorageError),
    #[error("HTTP error: {0}")]
    Http(String),
    #[error("Not authenticated")]
    NotAuthenticated,
    #[error("Device flow pending")]
    Pending,
    #[error("GitHub API error: {0}")]
    Api(String),
}

type GitHubResult<T> = Result<T, GitHubError>;

fn client() -> reqwest::Client {
    reqwest::Client::new()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceFlowStart {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthStatus {
    pub authenticated: bool,
    pub username: Option<String>,
    pub gist_id: Option<String>,
    pub last_sync_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GitHubUser {
    login: String,
}

#[derive(Debug, Deserialize)]
struct GistResponse {
    id: String,
}

#[derive(Debug, Deserialize)]
struct GistFileContent {
    content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GistDetail {
    files: std::collections::HashMap<String, GistFileContent>,
}

pub async fn start_device_flow() -> GitHubResult<DeviceFlowStart> {
    let response = client()
        .post("https://github.com/login/device/code")
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header("Accept", "application/json")
        .form(&[
            ("client_id", GITHUB_CLIENT_ID),
            ("scope", "gist user:email"),
        ])
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if !response.status().is_success() {
        return Err(GitHubError::Api(format!(
            "Failed to start device flow: {}",
            response.status()
        )));
    }

    let body: DeviceCodeResponse = response
        .json()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    Ok(DeviceFlowStart {
        device_code: body.device_code,
        user_code: body.user_code,
        verification_uri: body.verification_uri,
        expires_in: body.expires_in,
        interval: body.interval,
    })
}

pub async fn poll_device_flow(app: &AppHandle, device_code: &str) -> GitHubResult<String> {
    let response = client()
        .post("https://github.com/login/oauth/access_token")
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header("Accept", "application/json")
        .form(&[
            ("client_id", GITHUB_CLIENT_ID),
            ("device_code", device_code),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    let body: TokenResponse = response
        .json()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if let Some(error) = body.error {
        if error == "authorization_pending" || error == "slow_down" {
            return Err(GitHubError::Pending);
        }
        return Err(GitHubError::Api(error));
    }

    let token = body
        .access_token
        .ok_or_else(|| GitHubError::Api("Missing access token".into()))?;

    save_github_token(app, &token).await?;

    let user = fetch_user(&token).await?;
    let mut meta = load_sync_metadata(app).await?;
    meta.github_username = Some(user.login);
    save_sync_metadata(app, &meta).await?;

    Ok(token)
}

async fn fetch_user(token: &str) -> GitHubResult<GitHubUser> {
    let response = client()
        .get("https://api.github.com/user")
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if !response.status().is_success() {
        return Err(GitHubError::Api(format!(
            "Failed to fetch user: {}",
            response.status()
        )));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))
}

pub async fn get_auth_status(app: &AppHandle) -> GitHubResult<AuthStatus> {
    let token = load_github_token(app).await?;
    let meta = load_sync_metadata(app).await?;
    Ok(AuthStatus {
        authenticated: token.is_some(),
        username: meta.github_username,
        gist_id: meta.gist_id,
        last_sync_at: meta.last_sync_at.map(|d| d.to_rfc3339()),
    })
}

pub async fn disconnect(app: &AppHandle) -> GitHubResult<()> {
    crate::storage::clear_github_auth(app).await?;
    Ok(())
}

async fn require_token(app: &AppHandle) -> GitHubResult<String> {
    load_github_token(app)
        .await?
        .ok_or(GitHubError::NotAuthenticated)
}

async fn ensure_gist(app: &AppHandle, token: &str) -> GitHubResult<String> {
    let mut meta = load_sync_metadata(app).await?;
    if let Some(gist_id) = meta.gist_id.clone() {
        return Ok(gist_id);
    }

    let store = load_store(app)?;
    let payload = serde_json::to_string_pretty(&store)
        .map_err(|e| GitHubError::Storage(StorageError::Json(e)))?;

    let body = serde_json::json!({
        "description": "Sniplet snippet sync",
        "public": false,
        "files": {
            GIST_FILENAME: { "content": payload }
        }
    });

    let response = client()
        .post("https://api.github.com/gists")
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .json(&body)
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if !response.status().is_success() {
        return Err(GitHubError::Api(format!(
            "Failed to create gist: {}",
            response.status()
        )));
    }

    let gist: GistResponse = response
        .json()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    meta.gist_id = Some(gist.id.clone());
    meta.last_sync_at = Some(chrono::Utc::now());
    save_sync_metadata(app, &meta).await?;
    Ok(gist.id)
}

pub async fn push_sync(app: &AppHandle) -> GitHubResult<SyncMetadata> {
    let token = require_token(app).await?;
    let gist_id = ensure_gist(app, &token).await?;
    let store = load_store(app)?;
    let payload = serde_json::to_string_pretty(&store)
        .map_err(|e| GitHubError::Storage(StorageError::Json(e)))?;

    let body = serde_json::json!({
        "files": {
            GIST_FILENAME: { "content": payload }
        }
    });

    let response = client()
        .patch(format!("https://api.github.com/gists/{gist_id}"))
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .json(&body)
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if !response.status().is_success() {
        return Err(GitHubError::Api(format!(
            "Failed to push sync: {}",
            response.status()
        )));
    }

    let mut meta = load_sync_metadata(app).await?;
    meta.last_sync_at = Some(chrono::Utc::now());
    save_sync_metadata(app, &meta).await?;
    Ok(meta)
}

pub async fn pull_sync(app: &AppHandle) -> GitHubResult<SnippetStore> {
    let token = require_token(app).await?;
    let gist_id = ensure_gist(app, &token).await?;

    let response = client()
        .get(format!("https://api.github.com/gists/{gist_id}"))
        .header(USER_AGENT, USER_AGENT_VALUE)
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .send()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    if !response.status().is_success() {
        return Err(GitHubError::Api(format!(
            "Failed to pull sync: {}",
            response.status()
        )));
    }

    let gist: GistDetail = response
        .json()
        .await
        .map_err(|e| GitHubError::Http(e.to_string()))?;

    let file = gist
        .files
        .get(GIST_FILENAME)
        .and_then(|f| f.content.clone())
        .ok_or_else(|| GitHubError::Api("Gist file missing".into()))?;

    let remote: SnippetStore = serde_json::from_str(&file)
        .map_err(|e| GitHubError::Storage(StorageError::Json(e)))?;

    save_store(app, &remote)?;

    let mut meta = load_sync_metadata(app).await?;
    meta.last_sync_at = Some(chrono::Utc::now());
    save_sync_metadata(app, &meta).await?;

    Ok(remote)
}
