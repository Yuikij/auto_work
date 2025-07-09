use crate::models::{DataCell, Files, Template, TemplateParam};
use sqlx::SqlitePool;
use tauri::State;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;
use base64::{engine::general_purpose, Engine as _};
use std::io::Cursor;
use calamine::{Reader, Xlsx, open_workbook_from_rs, XlsxError};
use regex::Regex;

#[derive(Debug, Serialize, Deserialize)]
pub struct TransientFile {
    name: String,
    content: String, // Base64 encoded
}

#[tauri::command]
pub async fn execute_template(
    template_id: i64,
    params: String,
    transient_files: Vec<TransientFile>,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<DataCell>, String> {
    // 1. Prepare lookup maps
    let params_map: HashMap<String, String> = serde_json::from_str(&params)
        .unwrap_or_else(|_| HashMap::new());
    
    let transient_file_map: HashMap<String, String> = transient_files.into_iter()
        .map(|f| (f.name, f.content))
        .collect();

    // 2. Fetch all data cells and file placeholders for this template
    let mut data_cells: Vec<DataCell> = sqlx::query_as(
        "SELECT * FROM data_cell WHERE template_id = ? ORDER BY id"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let file_placeholders: Vec<Files> = sqlx::query_as(
        "SELECT * FROM files WHERE template_id = ?"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let file_placeholder_map: HashMap<i64, String> = file_placeholders.into_iter()
        .map(|f| (f.id, f.name))
        .collect();
    
    // Create a map of data cells by name for easy lookup
    let data_cell_name_map: HashMap<String, DataCell> = data_cells.iter()
        .map(|dc| (dc.name.clone(), dc.clone()))
        .collect();

    // 3. Process each data cell that is a final result
    let mut computed_values: HashMap<i64, Value> = HashMap::new();
    for data_cell in &mut data_cells {
        if data_cell.res {
            let result = evaluate_data_cell(
                data_cell, 
                &data_cell_name_map,
                &mut computed_values, 
                &params_map, 
                &transient_file_map,
                &file_placeholder_map
            ).await?;
            update_data_cell_value(data_cell.id, &result, &pool).await?;
        }
    }

    // 4. Fetch and return updated data cells
    let updated_data_cells: Vec<DataCell> = sqlx::query_as(
        "SELECT * FROM data_cell WHERE template_id = ? ORDER BY id"
    )
    .bind(template_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(updated_data_cells)
}

async fn evaluate_data_cell(
    data_cell: &DataCell,
    all_cells: &HashMap<String, DataCell>,
    computed_values: &mut HashMap<i64, Value>,
    params: &HashMap<String, String>,
    transient_files: &HashMap<String, String>,
    file_placeholders: &HashMap<i64, String>
) -> Result<Value, String> {
    // If value is already computed, return it
    if let Some(value) = computed_values.get(&data_cell.id) {
        return Ok(value.clone());
    }

    let result = match data_cell.r#type {
        1 => { // File
            if let Some(file_id) = data_cell.source_id {
                if let Some(placeholder_name) = file_placeholders.get(&file_id) {
                    if let Some(base64_content) = transient_files.get(placeholder_name) {
                        extract_data_from_content(base64_content, data_cell)?
                    } else {
                        return Err(format!("File content for placeholder '{}' not provided.", placeholder_name));
                    }
                } else {
                    return Err(format!("File placeholder with id {} not found.", file_id));
                }
            } else {
                 return Err("File type data cell has no source_id.".to_string());
            }
        },
        2 => { // Script
            if let Some(script) = &data_cell.script {
                execute_script(script, all_cells, computed_values, params, transient_files, file_placeholders).await?
            } else {
                return Err("Script type data cell has no script.".to_string());
            }
        },
        3 => { // Data
             return Err("Data type data cell evaluation not implemented yet.".to_string());
        },
        4 => { // Param
            if let Some(param_name) = &data_cell.param_name {
                if let Some(value) = params.get(param_name) {
                    json!(vec![value.clone()])
                } else {
                    return Err(format!("Parameter '{}' not provided.", param_name));
                }
            } else {
                return Err("Param type data cell has no param_name.".to_string());
            }
        },
        5 => { // Value
            if let Some(value) = &data_cell.specific_value {
                // Attempt to parse as JSON, otherwise treat as a plain string
                serde_json::from_str(value).unwrap_or_else(|_| json!(vec![value.clone()]))
            } else {
                json!([])
            }
        }
        _ => return Err(format!("Unknown data cell type: {}", data_cell.r#type)),
    };

    computed_values.insert(data_cell.id, result.clone());
    Ok(result)
}


async fn execute_script<'a>(
    script: &str,
    all_cells: &'a HashMap<String, DataCell>,
    computed_values: &'a mut HashMap<i64, Value>,
    params: &'a HashMap<String, String>,
    transient_files: &'a HashMap<String, String>,
    file_placeholders: &'a HashMap<i64, String>
) -> Result<Value, String> {
    let script = script.trim();

    // Regex to find all referenced cell names, e.g., [Cell1], [Cell2]
    let re_cell = Regex::new(r"\[([^\]]+)\]").unwrap();
    let cell_names: Vec<String> = re_cell.captures_iter(script)
        .map(|cap| cap[1].to_string())
        .collect();

    // Concurrently evaluate all referenced data cells
    let mut referenced_values: HashMap<String, Vec<f64>> = HashMap::new();
    for name in &cell_names {
        let referenced_cell = all_cells.get(name)
            .ok_or_else(|| format!("Referenced data cell '{}' not found.", name))?;
        
        let value = Box::pin(evaluate_data_cell(referenced_cell, all_cells, computed_values, params, transient_files, file_placeholders)).await?;
        
        let numeric_values: Vec<f64> = match value {
            Value::Array(arr) => arr.iter()
                .map(|v| v.as_f64().or_else(|| v.as_str().and_then(|s| s.parse::<f64>().ok())))
                .flatten()
                .collect(),
            Value::Number(n) => vec![n.as_f64().unwrap_or(0.0)],
            _ => vec![],
        };
        referenced_values.insert(name.clone(), numeric_values);
    }

    // Handle special functions: sum, multi, group
    if script.starts_with("sum(") {
        let total: f64 = referenced_values.values().flatten().sum();
        return Ok(json!([total]));
    }
    if script.starts_with("multi(") {
        let product: f64 = referenced_values.values().flatten().product();
        return Ok(json!([product]));
    }
    if script.starts_with("group(") {
        let grouped: Vec<f64> = referenced_values.values().flatten().cloned().collect();
        return Ok(json!(grouped));
    }

    // Handle arithmetic expressions
    let mut final_expression = script.to_string();
    let first_cell_name = cell_names.get(0).ok_or("No data cells found in expression")?;
    let first_cell_values = referenced_values.get(first_cell_name).unwrap();
    let array_len = first_cell_values.len();

    // Check if all arrays have the same length
    for name in &cell_names {
        if referenced_values.get(name).unwrap().len() != array_len {
            return Err("Data cells in expression have different lengths".to_string());
        }
    }
    
    // Perform element-wise calculation
    let mut results: Vec<f64> = Vec::new();
    for i in 0..array_len {
        let mut temp_expr = script.to_string();
        for name in &cell_names {
            let val = referenced_values.get(name).unwrap()[i];
            temp_expr = temp_expr.replace(&format!("[{}]", name), &val.to_string());
        }
        let result: f64 = meval::eval_str(&temp_expr).map_err(|e| e.to_string())?;
        results.push(result);
    }
    
    Ok(json!(results))
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

fn extract_data_from_content(
    base64_content: &str,
    data_cell: &DataCell,
) -> Result<Value, String> {
    let content_bytes = general_purpose::STANDARD.decode(base64_content)
        .map_err(|e| e.to_string())?;
    
    // For now, we only support Excel. We can add HTML/other parsers later.
    let cursor = Cursor::new(content_bytes);
    let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor).map_err(|e: XlsxError| e.to_string())?;
    
    let mut values: Vec<String> = Vec::new(); // Store as string initially
    
    let sheet_name = data_cell.sheet.as_ref()
        .and_then(|s| if s.is_empty() { None } else { Some(s.clone()) })
        .or_else(|| workbook.sheet_names().first().cloned())
        .ok_or("No sheet found in the Excel file")?;
    
    if let Ok(range) = workbook.worksheet_range(&sheet_name) {
        if let Some(col_str) = &data_cell.column_index {
             if let Some(col) = excel_col_to_index(col_str) {
                let start_row = data_cell.start_index.unwrap_or(1) as u32 -1;
                let end_row = data_cell.end_index
                    .map(|r| r as u32 -1)
                    .unwrap_or_else(|| (range.get_size().0 as u32).saturating_sub(1));
                
                for row in start_row..=end_row {
                    if let Some(cell_value) = range.get_value((row, col)) {
                        values.push(cell_value.to_string());
                    }
                }
            }
        }
    }
    
    Ok(json!(values))
}

fn excel_col_to_index(col_str: &str) -> Option<u32> {
    let mut col: u32 = 0;
    for c in col_str.to_uppercase().chars() {
        if !c.is_ascii_alphabetic() {
            return None;
        }
        col = col * 26 + (c as u32 - 'A' as u32 + 1);
    }
    Some(col - 1)
}

#[tauri::command]
pub async fn get_params(
    pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<Vec<TemplateParam>, String> {
    sqlx::query_as("SELECT * FROM template_params WHERE template_id = ?")
        .bind(template_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_param(
    pool: State<'_, SqlitePool>,
    template_id: i64,
    key: String,
    value: String,
) -> Result<(), String> {
    sqlx::query("INSERT INTO template_params (template_id, key, value) VALUES (?, ?, ?)")
        .bind(template_id)
        .bind(key)
        .bind(value)
        .execute(&*pool)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_param(
    pool: State<'_, SqlitePool>,
    template_id: i64,
    key: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM template_params WHERE template_id = ? AND key = ?")
        .bind(template_id)
        .bind(key)
        .execute(&*pool)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start(
    _pool: State<'_, SqlitePool>,
    template_id: i64,
) -> Result<(), String> {
    // Placeholder for starting execution
    println!("Starting execution for template_id: {}", template_id);
    Ok(())
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