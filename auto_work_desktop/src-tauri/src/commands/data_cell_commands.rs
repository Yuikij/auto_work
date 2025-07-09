use tauri::State;
use sqlx::SqlitePool;
use crate::models::DataCell;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DataCellRequest {
    pub name: String,
    pub source_id: Option<i64>,
    pub row_index: Option<i32>,
    pub column_index: Option<String>,
    pub sheet: Option<String>,
    pub select_index: Option<i32>,
    pub script: Option<String>,
    pub start_index: Option<i32>,
    pub end_index: Option<i32>,
    pub res: bool,
    pub template_id: i64,
    pub specific_value: Option<String>,
    pub param_name: Option<String>,
    pub r#type: i32,
}

#[tauri::command]
pub async fn list_data_cells(
    pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<Vec<DataCell>, String> {
    sqlx::query_as::<_, DataCell>(
        "SELECT * FROM data_cell WHERE template_id = ? ORDER BY created_at DESC"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_data_cell(
    pool: State<'_, SqlitePool>,
    request: DataCellRequest,
) -> Result<DataCell, String> {
    let result = sqlx::query(
        "INSERT INTO data_cell (name, source_id, row_index, column_index, sheet, 
         select_index, script, start_index, end_index, res, template_id, 
         specific_value, param_name, type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&request.name)
    .bind(request.source_id)
    .bind(request.row_index)
    .bind(&request.column_index)
    .bind(&request.sheet)
    .bind(request.select_index)
    .bind(&request.script)
    .bind(request.start_index)
    .bind(request.end_index)
    .bind(request.res)
    .bind(request.template_id)
    .bind(&request.specific_value)
    .bind(&request.param_name)
    .bind(request.r#type)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let data_cell_id = result.last_insert_rowid();
    
    get_data_cell(pool, data_cell_id).await
}

#[tauri::command]
pub async fn update_data_cell(
    pool: State<'_, SqlitePool>,
    id: i64,
    request: DataCellRequest,
) -> Result<DataCell, String> {
    sqlx::query(
        "UPDATE data_cell SET name = ?, source_id = ?, row_index = ?, column_index = ?, 
         sheet = ?, select_index = ?, script = ?, start_index = ?, end_index = ?, 
         res = ?, specific_value = ?, param_name = ?, type = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?"
    )
    .bind(&request.name)
    .bind(request.source_id)
    .bind(request.row_index)
    .bind(&request.column_index)
    .bind(&request.sheet)
    .bind(request.select_index)
    .bind(&request.script)
    .bind(request.start_index)
    .bind(request.end_index)
    .bind(request.res)
    .bind(&request.specific_value)
    .bind(&request.param_name)
    .bind(request.r#type)
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    get_data_cell(pool, id).await
}

#[tauri::command]
pub async fn delete_data_cell(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    sqlx::query("DELETE FROM data_cell WHERE id = ?")
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_data_cell(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<DataCell, String> {
    sqlx::query_as::<_, DataCell>(
        "SELECT * FROM data_cell WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_data_cells(
    pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<Vec<DataCell>, String> {
     sqlx::query_as::<_, DataCell>(
        "SELECT * FROM data_cell WHERE template_id = ?"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())
} 