use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Snippet {
    pub id: String,
    pub title: String,
    pub code: String,
    pub language: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Snippet {
    pub fn new(title: String, code: String, language: String, tags: Vec<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            code,
            language,
            tags,
            favorite: false,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SnippetStore {
    pub version: u32,
    pub snippets: Vec<Snippet>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncMetadata {
    pub gist_id: Option<String>,
    pub last_sync_at: Option<DateTime<Utc>>,
    pub github_username: Option<String>,
}
