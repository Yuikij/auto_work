use crate::models::Template;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn add_template(
    name: String,
    content: String,
    type_id: i32,
    pool: State<'_, SqlitePool>,
) -> Result<i64, String> {
    sqlx::query("INSERT INTO templates (name, content, type_id) VALUES (?, ?, ?)")
        .bind(name)
        .bind(content)
        .bind(type_id)
        .execute(&*pool)
        .await
        .map(|res| res.last_insert_rowid())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_templates(pool: State<'_, SqlitePool>, type_id: i32) -> Result<Vec<Template>, String> {
    sqlx::query_as("SELECT * FROM templates WHERE type_id = ?")
        .bind(type_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn edit_template(
    id: i64,
    name: String,
    content: String,
    pool: State<'_, SqlitePool>,
) -> Result<u64, String> {
    sqlx::query("UPDATE templates SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(name)
        .bind(content)
        .bind(id)
        .execute(&*pool)
        .await
        .map(|res| res.rows_affected())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_template(id: i64, pool: State<'_, SqlitePool>) -> Result<u64, String> {
    sqlx::query("DELETE FROM templates WHERE id = ?")
        .bind(id)
        .execute(&*pool)
        .await
        .map(|res| res.rows_affected())
        .map_err(|e| e.to_string())
} 