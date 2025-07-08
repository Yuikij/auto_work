use tauri::State;
use sqlx::{SqlitePool, Row};
use crate::models::DataCell;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDataCellRequest {
    pub name: String,
    pub source_id: Option<i64>,
    pub row_index: Option<i32>,
    pub column_index: Option<i32>,
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
    let data_cell_results = sqlx::query(
        "SELECT id, name, source_id, row_index, column_index, sheet, select_index, 
         script, start_index, end_index, res, template_id, specific_value, 
         param_name, type, created_at, updated_at, sheet_name, start_row, end_row, start_col, end_col, data_type, data_range, description 
         FROM data_cell WHERE template_id = ? ORDER BY created_at DESC"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let data_cells: Vec<DataCell> = data_cell_results.into_iter().map(|row| {
        DataCell {
            id: row.get("id"),
            name: row.get("name"),
            source_id: row.get("source_id"),
            row_index: row.get("row_index"),
            column_index: row.get("column_index"),
            sheet: row.get("sheet"),
            select_index: row.get("select_index"),
            script: row.get("script"),
            start_index: row.get("start_index"),
            end_index: row.get("end_index"),
            res: row.get("res"),
            template_id: row.get("template_id"),
            specific_value: row.get("specific_value"),
            param_name: row.get("param_name"),
            r#type: row.get("type"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            // Add all the new fields from models.rs
            sheet_name: row.get("sheet_name"),
            start_row: row.get("start_row"),
            end_row: row.get("end_row"),
            start_col: row.get("start_col"),
            end_col: row.get("end_col"),
            data_type: row.get("data_type"),
            data_range: row.get("data_range"),
            description: row.get("description"),
        }
    }).collect();
    
    Ok(data_cells)
}

#[tauri::command]
pub async fn add_data_cell(
    pool: State<'_, SqlitePool>,
    request: CreateDataCellRequest,
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
    .bind(request.column_index)
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
    
    let data_cell_result = sqlx::query(
        "SELECT id, name, source_id, row_index, column_index, sheet, select_index, 
         script, start_index, end_index, res, template_id, specific_value, 
         param_name, type, created_at, updated_at, sheet_name, start_row, end_row, start_col, end_col, data_type, data_range, description 
         FROM data_cell WHERE id = ?"
    )
    .bind(data_cell_id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let data_cell = DataCell {
        id: data_cell_result.get("id"),
        name: data_cell_result.get("name"),
        source_id: data_cell_result.get("source_id"),
        row_index: data_cell_result.get("row_index"),
        column_index: data_cell_result.get("column_index"),
        sheet: data_cell_result.get("sheet"),
        select_index: data_cell_result.get("select_index"),
        script: data_cell_result.get("script"),
        start_index: data_cell_result.get("start_index"),
        end_index: data_cell_result.get("end_index"),
        res: data_cell_result.get("res"),
        template_id: data_cell_result.get("template_id"),
        specific_value: data_cell_result.get("specific_value"),
        param_name: data_cell_result.get("param_name"),
        r#type: data_cell_result.get("type"),
        created_at: data_cell_result.get("created_at"),
        updated_at: data_cell_result.get("updated_at"),
        sheet_name: data_cell_result.get("sheet_name"),
        start_row: data_cell_result.get("start_row"),
        end_row: data_cell_result.get("end_row"),
        start_col: data_cell_result.get("start_col"),
        end_col: data_cell_result.get("end_col"),
        data_type: data_cell_result.get("data_type"),
        data_range: data_cell_result.get("data_range"),
        description: data_cell_result.get("description"),
    };
    
    Ok(data_cell)
}

#[tauri::command]
pub async fn update_data_cell(
    pool: State<'_, SqlitePool>,
    id: i64,
    request: CreateDataCellRequest,
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
    .bind(request.column_index)
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
    
    let data_cell_result = sqlx::query(
        "SELECT id, name, source_id, row_index, column_index, sheet, select_index, 
         script, start_index, end_index, res, template_id, specific_value, 
         param_name, type, created_at, updated_at, sheet_name, start_row, end_row, start_col, end_col, data_type, data_range, description 
         FROM data_cell WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let data_cell = DataCell {
        id: data_cell_result.get("id"),
        name: data_cell_result.get("name"),
        source_id: data_cell_result.get("source_id"),
        row_index: data_cell_result.get("row_index"),
        column_index: data_cell_result.get("column_index"),
        sheet: data_cell_result.get("sheet"),
        select_index: data_cell_result.get("select_index"),
        script: data_cell_result.get("script"),
        start_index: data_cell_result.get("start_index"),
        end_index: data_cell_result.get("end_index"),
        res: data_cell_result.get("res"),
        template_id: data_cell_result.get("template_id"),
        specific_value: data_cell_result.get("specific_value"),
        param_name: data_cell_result.get("param_name"),
        r#type: data_cell_result.get("type"),
        created_at: data_cell_result.get("created_at"),
        updated_at: data_cell_result.get("updated_at"),
        sheet_name: data_cell_result.get("sheet_name"),
        start_row: data_cell_result.get("start_row"),
        end_row: data_cell_result.get("end_row"),
        start_col: data_cell_result.get("start_col"),
        end_col: data_cell_result.get("end_col"),
        data_type: data_cell_result.get("data_type"),
        data_range: data_cell_result.get("data_range"),
        description: data_cell_result.get("description"),
    };
    
    Ok(data_cell)
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
    let data_cell_result = sqlx::query(
        "SELECT id, name, source_id, row_index, column_index, sheet, select_index, 
         script, start_index, end_index, res, template_id, specific_value, 
         param_name, type, created_at, updated_at, sheet_name, start_row, end_row, start_col, end_col, data_type, data_range, description 
         FROM data_cell WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let data_cell = DataCell {
        id: data_cell_result.get("id"),
        name: data_cell_result.get("name"),
        source_id: data_cell_result.get("source_id"),
        row_index: data_cell_result.get("row_index"),
        column_index: data_cell_result.get("column_index"),
        sheet: data_cell_result.get("sheet"),
        select_index: data_cell_result.get("select_index"),
        script: data_cell_result.get("script"),
        start_index: data_cell_result.get("start_index"),
        end_index: data_cell_result.get("end_index"),
        res: data_cell_result.get("res"),
        template_id: data_cell_result.get("template_id"),
        specific_value: data_cell_result.get("specific_value"),
        param_name: data_cell_result.get("param_name"),
        r#type: data_cell_result.get("type"),
        created_at: data_cell_result.get("created_at"),
        updated_at: data_cell_result.get("updated_at"),
        sheet_name: data_cell_result.get("sheet_name"),
        start_row: data_cell_result.get("start_row"),
        end_row: data_cell_result.get("end_row"),
        start_col: data_cell_result.get("start_col"),
        end_col: data_cell_result.get("end_col"),
        data_type: data_cell_result.get("data_type"),
        data_range: data_cell_result.get("data_range"),
        description: data_cell_result.get("description"),
    };
    
    Ok(data_cell)
} 

#[tauri::command]
pub async fn get_data_cells(
    pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<Vec<DataCell>, String> {
    sqlx::query_as("SELECT * FROM data_cells WHERE template_id = ? ORDER BY id")
        .bind(template_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())
} 