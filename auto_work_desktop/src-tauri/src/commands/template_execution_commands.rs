use crate::models::{DataCell, Files, Template};
use sqlx::SqlitePool;
use tauri::State;
use serde_json::{Value, json};
use std::collections::HashMap;

#[tauri::command]
pub async fn execute_template(
    template_id: i64,
    params: String,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<DataCell>, String> {
    // Parse parameters
    let params_map: HashMap<String, String> = serde_json::from_str(&params)
        .unwrap_or_else(|_| HashMap::new());

    // Get all data cells for this template
    let mut data_cells: Vec<DataCell> = sqlx::query_as(
        "SELECT * FROM data_cell WHERE template_id = ? ORDER BY id"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    // Get all files for this template
    let files: Vec<Files> = sqlx::query_as(
        "SELECT * FROM files WHERE template_id = ? ORDER BY id"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    // Process each data cell
    for data_cell in &mut data_cells {
        if data_cell.res {
            // Execute the data cell based on its type
            match data_cell.r#type {
                1 => {
                    // File data extraction
                    if let Some(file_id) = data_cell.source_id {
                        if let Some(file) = files.iter().find(|f| f.id == file_id) {
                            // Extract data based on data cell configuration
                            let result = extract_data_from_file(file, data_cell, &params_map)?;
                            
                            // Update data cell with result
                            update_data_cell_value(data_cell.id, &result, &pool).await?;
                        }
                    }
                },
                2 => {
                    // Script execution
                    if let Some(script) = &data_cell.script {
                        let result = execute_script(script, &params_map)?;
                        update_data_cell_value(data_cell.id, &result, &pool).await?;
                    }
                },
                3 => {
                    // Parameter value
                    if let Some(param_name) = &data_cell.param_name {
                        if let Some(value) = params_map.get(param_name) {
                            let result = json!(vec![value.clone()]);
                            update_data_cell_value(data_cell.id, &result, &pool).await?;
                        }
                    }
                },
                _ => {}
            }
        }
    }

    // Fetch updated data cells
    let updated_data_cells: Vec<DataCell> = sqlx::query_as(
        "SELECT * FROM data_cell WHERE template_id = ? ORDER BY id"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(updated_data_cells)
}

async fn update_data_cell_value(
    data_cell_id: i64,
    value: &Value,
    pool: &SqlitePool,
) -> Result<(), String> {
    let value_str = value.to_string();
    sqlx::query(
        "UPDATE data_cell SET specific_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(value_str)
    .bind(data_cell_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn extract_data_from_file(
    _file: &Files,
    _data_cell: &DataCell,
    _params: &HashMap<String, String>,
) -> Result<Value, String> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Read the file from disk
    // 2. Parse it based on file type (Excel, HTML, etc.)
    // 3. Extract data based on data_cell configuration
    
    // For now, return a dummy value
    Ok(json!(vec!["Extracted value"]))
}

fn execute_script(
    _script: &str,
    _params: &HashMap<String, String>,
) -> Result<Value, String> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Parse the script JSON
    // 2. Execute the script logic
    // 3. Return the result
    
    // For now, return a dummy value
    Ok(json!(vec!["Script result"]))
}

#[tauri::command]
pub async fn get_templates(
    type_id: i32,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Template>, String> {
    sqlx::query_as("SELECT * FROM templates WHERE type_id = ? ORDER BY name")
        .bind(type_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())
}