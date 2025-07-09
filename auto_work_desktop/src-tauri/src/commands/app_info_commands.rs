use serde::{Deserialize, Serialize};
use tauri::State;
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub app_name: String,
    pub version: String,
    pub mode: String,
    pub description: String,
}

#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo, String> {
    Ok(AppInfo {
        app_name: "Auto Work Desktop".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        mode: "Offline".to_string(),
        description: "自动化数据处理工作流系统（离线版）".to_string(),
    })
}

#[tauri::command]
pub async fn create_backup(_pool: State<'_, SqlitePool>) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    use chrono::Local;
    
    // Create backup directory if it doesn't exist
    let backup_dir = Path::new("./backups");
    if !backup_dir.exists() {
        fs::create_dir_all(backup_dir).map_err(|e| e.to_string())?;
    }
    
    // Generate backup filename with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("auto_work_backup_{}.db", timestamp);
    let backup_path = backup_dir.join(&backup_filename);
    
    // Get current database path
    let db_path = Path::new("./data/auto_work.db");
    
    // Copy database file
    fs::copy(db_path, &backup_path).map_err(|e| e.to_string())?;
    
    Ok(backup_path.to_string_lossy().to_string())
}