use tauri::{AppHandle, State, Manager};
use sqlx::{SqlitePool};
use crate::models::{DataCell, Files};
use serde::{Deserialize, Serialize};
use scraper::{Html, Selector};
use infer;

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseResult {
    pub values: Vec<f64>,
}

#[tauri::command]
pub async fn upload_file_to_template(
    app_handle: AppHandle,
    pool: State<'_, SqlitePool>,
    template_id: i64,
    name: String,
    content: Vec<u8>,
) -> Result<Files, String> {
    // Save file to app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let file_path = app_data_dir.join("uploads").join(&name);

    // Ensure directory exists
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Write file content
    std::fs::write(&file_path, &content).map_err(|e| e.to_string())?;

    // Insert file record into database
    let result = sqlx::query(
        "INSERT INTO files (name, path, template_id) VALUES (?, ?, ?)"
    )
    .bind(&name)
    .bind(file_path.to_string_lossy().to_string())
    .bind(template_id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let file_id = result.last_insert_rowid();

    let new_file = Files {
        id: file_id,
        name: name,
        path: Some(file_path.to_string_lossy().to_string()),
        template_id: template_id,
        created_at: None, // This will be set by the database
        updated_at: None, // This will be set by the database
    };
    
    Ok(new_file)
}


#[tauri::command]
pub async fn parse_data_cell(
    pool: State<'_, SqlitePool>,
    data_cell: DataCell,
) -> Result<ParseResult, String> {
    let mut values = Vec::new();
    
    // Get file content if source_id is provided
    if let Some(source_id) = data_cell.source_id {
        let file = sqlx::query_as::<_, Files>("SELECT * FROM files WHERE id = ?")
        .bind(source_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;
        
        if let Some(path) = file.path {
            let file_content = std::fs::read(&path).map_err(|e| e.to_string())?;
            
            // Detect file type
            if let Some(file_type) = infer::get(&file_content) {
                match file_type.mime_type() {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" |
                    "application/vnd.ms-excel" => {
                        values = parse_excel_content(&file_content, &data_cell)?;
                    }
                    "text/html" => {
                        values = parse_html_content(&file_content, &data_cell)?;
                    }
                    _ => {
                        // Try to parse as HTML if MIME type is unknown
                        values = parse_html_content(&file_content, &data_cell)?;
                    }
                }
            } else {
                // Try to parse as HTML if file type is unknown
                values = parse_html_content(&file_content, &data_cell)?;
            }
        }
    }
    
    // If specific_value is provided, use it instead
    if let Some(specific_value_str) = &data_cell.specific_value {
        if let Ok(specific_values) = serde_json::from_str::<Vec<f64>>(specific_value_str) {
            values = specific_values;
        }
    }
    
    Ok(ParseResult { values })
}

fn parse_excel_content(_content: &[u8], _data_cell: &DataCell) -> Result<Vec<f64>, String> {
    // TODO: Implement proper Excel parsing with calamine
    // For now, return empty results
    Ok(Vec::new())
}

fn parse_html_content(content: &[u8], data_cell: &DataCell) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    let html_content = String::from_utf8_lossy(content);
    let document = Html::parse_document(&html_content);
    let table_selector = Selector::parse("table tr").map_err(|e| e.to_string())?;
    let cell_selector = Selector::parse("td, th").map_err(|e| e.to_string())?;
    
    let rows: Vec<_> = document.select(&table_selector).collect();
    
    for (row_index, row) in rows.iter().enumerate() {
        let cells: Vec<_> = row.select(&cell_selector).collect();
        
        // Handle specific cell
        if let (Some(target_row), Some(target_col)) = (data_cell.row_index, data_cell.column_index) {
            if row_index == (target_row - 1) as usize {
                if let Some(cell) = cells.get((target_col - 1) as usize) {
                    let text = cell.text().collect::<String>().trim().to_string();
                    if let Ok(value) = text.parse::<f64>() {
                        values.push(value);
                    }
                }
                break;
            }
            continue;
        }
        
        // Handle column range
        if let Some(target_col) = data_cell.column_index {
            let start_row = data_cell.start_index.unwrap_or(1) - 1;
            let end_row = data_cell.end_index.unwrap_or(rows.len() as i32);
            
            if row_index >= start_row as usize && row_index < end_row as usize {
                if let Some(cell) = cells.get((target_col - 1) as usize) {
                    let text = cell.text().collect::<String>().trim().to_string();
                    if let Ok(value) = text.parse::<f64>() {
                        values.push(value);
                    }
                }
            }
            continue;
        }
        
        // Handle row range
        if let Some(target_row) = data_cell.row_index {
            if row_index == (target_row - 1) as usize {
                let start_col = data_cell.start_index.unwrap_or(1) - 1;
                let end_col = data_cell.end_index.unwrap_or(cells.len() as i32);
                
                for col_index in start_col as usize..end_col.min(cells.len() as i32) as usize {
                    if let Some(cell) = cells.get(col_index) {
                        let text = cell.text().collect::<String>().trim().to_string();
                        if let Ok(value) = text.parse::<f64>() {
                            values.push(value);
                        }
                    }
                }
                break;
            }
        }
    }
    
    Ok(values)
}

#[allow(dead_code, unused_variables)]
fn cell_to_f64(cell: &dyn std::fmt::Debug) -> Option<f64> {
    // This is a temporary implementation
    // In a real implementation, you would need to properly handle calamine's DataType
    None
}

#[tauri::command]
pub async fn list_files_by_template(
    pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<Vec<Files>, String> {
    sqlx::query_as("SELECT * FROM files WHERE template_id = ? ORDER BY created_at DESC")
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file(
    pool: State<'_, SqlitePool>,
    file_id: i64,
) -> Result<(), String> {
    // Get file path before deletion
    if let Ok(file) = sqlx::query_as::<_, Files>("SELECT * FROM files WHERE id = ?")
        .bind(file_id)
        .fetch_one(&*pool)
        .await {
        if let Some(path) = file.path {
            // Delete the file from the filesystem
            let _ = std::fs::remove_file(path);
        }
    }

    // Delete the file record from the database
    sqlx::query("DELETE FROM files WHERE id = ?")
        .bind(file_id)
        .execute(&*pool)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
} 

#[tauri::command]
pub async fn add_file(
    pool: State<'_, SqlitePool>,
    template_id: i64,
    name: String,
    path: String,
) -> Result<Files, String> {
    // Insert file record into database
    let result = sqlx::query(
        "INSERT INTO files (name, path, template_id) VALUES (?, ?, ?)"
    )
    .bind(&name)
    .bind(&path)
    .bind(template_id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let file_id = result.last_insert_rowid();

    let new_file = Files {
        id: file_id,
        name: name,
        path: Some(path),
        template_id: template_id,
        created_at: None, // This will be set by the database
        updated_at: None, // This will be set by the database
    };
    
    Ok(new_file)
} 