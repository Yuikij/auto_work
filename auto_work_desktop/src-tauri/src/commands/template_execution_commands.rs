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
use log::{info, warn, error};

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
    info!("开始执行模板，ID: {}", template_id);
    info!("接收到参数: {}", params);
    info!("接收到 {} 个临时文件。", transient_files.len());

    // 0. 清除此模板之前所有数据单元的缓存结果，以强制重新计算。
    info!("...正在清除旧的计算结果缓存...");
    sqlx::query("UPDATE data_cell SET specific_value = NULL WHERE template_id = ?")
        .bind(template_id)
        .execute(&*pool)
        .await
        .map_err(|e| {
            error!("清除缓存失败: {}", e);
            e.to_string()
        })?;

    // 1. 准备查找映射
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
    info!("正在计算数据单元 '{}' (ID: {})", data_cell.name, data_cell.id);

    // If value is already computed in this session, return it.
    if let Some(value) = computed_values.get(&data_cell.id) {
        info!("...在本次会話缓存中找到值。");
        return Ok(value.clone());
    }

    // If the cell already has a stored value, parse and return it.
    // This is the primary cache and avoids re-computation across runs.
    if let Some(value_str) = &data_cell.specific_value {
        if !value_str.is_empty() && value_str != "[]" && value_str != "null" {
             if let Ok(json_value) = serde_json::from_str::<Value>(value_str) {
                info!("...找到并解析了已有值: {}", json_value);
                computed_values.insert(data_cell.id, json_value.clone());
                return Ok(json_value);
            }
        }
    }

    let result = match data_cell.r#type {
        1 => { // File
            info!("...类型为 '文件'。");
            if let Some(file_id) = data_cell.source_id {
                if let Some(placeholder_name) = file_placeholders.get(&file_id) {
                    if let Some(base64_content) = transient_files.get(placeholder_name) {
                        extract_data_from_content(base64_content, data_cell)?
                    } else {
                        warn!("...未提供文件占位符 '{}' 的内容。", placeholder_name);
                        return Err(format!("未提供文件占位符 '{}' 的内容。", placeholder_name));
                    }
                } else {
                    warn!("...未找到ID为 {} 的文件占位符。", file_id);
                    return Err(format!("未找到ID为 {} 的文件占位符。", file_id));
                }
            } else {
                 warn!("...'文件'类型的数据单元没有 source_id。");
                 return Err("'文件'类型的数据单元没有 source_id。".to_string());
            }
        },
        2 => { // Script
            info!("...类型为 '脚本'。");
            if let Some(script) = &data_cell.script {
                execute_script(script, all_cells, computed_values, params, transient_files, file_placeholders).await?
            } else {
                warn!("...'脚本'类型的数据单元没有脚本内容。");
                return Err("'脚本'类型的数据单元没有脚本内容。".to_string());
            }
        },
        3 => { // Data
            info!("...类型为 '数据' (切片)。");
            if let Some(source_cell_id) = data_cell.source_cell_id {
                let source_cell_name_entry = all_cells.values()
                    .find(|c| c.id == source_cell_id)
                    .map(|c| c.name.clone());

                if let Some(source_cell_name) = source_cell_name_entry {
                     let source_cell = all_cells.get(&source_cell_name)
                        .ok_or_else(|| format!("源数据单元 '{}' (ID: {}) 未找到。", source_cell_name, source_cell_id))?;
                    
                    let source_value = Box::pin(evaluate_data_cell(source_cell, all_cells, computed_values, params, transient_files, file_placeholders)).await?;
                    
                    if let Value::Array(arr) = source_value {
                        let start = data_cell.start_index.map(|i| (i - 1) as usize).unwrap_or(0);
                        let end = data_cell.end_index.map(|i| i as usize).unwrap_or(arr.len());
                        
                        let sliced_arr = arr.get(start..end).unwrap_or(&[]).to_vec();
                        json!(sliced_arr)
                    } else {
                        warn!("...源数据单元 '{}' 的值不是一个数组，无法切片。", source_cell.name);
                        json!([])
                    }
                } else {
                    warn!("...未在 all_cells 中找到 ID 为 {} 的数据单元。", source_cell_id);
                    return Err(format!("未在 all_cells 中找到 ID 为 {} 的数据单元。", source_cell_id));
                }
            } else {
                warn!("...'数据'类型的数据单元没有 source_cell_id。");
                return Err("'数据'类型的数据单元没有 source_cell_id。".to_string());
            }
        },
        4 => { // Param
            info!("...类型为 '参数'。");
            if let Some(param_name) = &data_cell.param_name {
                if let Some(value) = params.get(param_name) {
                    json!(vec![value.clone()])
                } else {
                    warn!("...未提供参数 '{}' 的值。", param_name);
                    return Err(format!("未提供参数 '{}' 的值。", param_name));
                }
            } else {
                warn!("...'参数'类型的数据单元没有 param_name。");
                return Err("'参数'类型的数据单元没有 param_name。".to_string());
            }
        },
        5 => { // Value
            info!("...类型为 '具体值'。");
            if let Some(value) = &data_cell.specific_value {
                // Attempt to parse as JSON, otherwise treat as a plain string
                serde_json::from_str(value).unwrap_or_else(|_| json!(vec![value.clone()]))
            } else {
                json!([])
            }
        }
        _ => {
            error!("未知的数据单元类型: {}", data_cell.r#type);
            return Err(format!("未知的数据单元类型: {}", data_cell.r#type));
        }
    };

    info!("...成功计算 '{}' (ID: {})。结果: {}", data_cell.name, data_cell.id, result);
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
    info!("正在执行脚本: '{}'", script);
    let script = script.trim();

    // Regex to find all referenced cell names, e.g., [Cell1], [Cell2]
    let re_cell = Regex::new(r"\[([^\]]+)\]").unwrap();
    let cell_names: Vec<String> = re_cell.captures_iter(script)
        .map(|cap| cap[1].to_string())
        .collect();
    
    // 新增：正则表达式，用于查找脚本中的纯数字
    let re_numeric = Regex::new(r"\b\d+\b").unwrap();
    let numeric_literals: Vec<String> = re_numeric.find_iter(script)
        .map(|mat| mat.as_str().to_string())
        .collect();

    // Concurrently evaluate all referenced data cells
    let mut referenced_values: HashMap<String, Vec<f64>> = HashMap::new();
    for name in &cell_names {
        let referenced_cell = all_cells.get(name)
            .ok_or_else(|| format!("引用的数据单元 '{}' 未找到。", name))?;
        
        let value = Box::pin(evaluate_data_cell(referenced_cell, all_cells, computed_values, params, transient_files, file_placeholders)).await?;
        
        info!("  > 获取到依赖 '{}' 的值: {}", name, value);

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

    // --- Start of new logic for arithmetic operations ---
    info!("  > 作为算术表达式执行。");

    // Find the maximum length of the referenced value lists to determine the number of iterations.
    let max_len = referenced_values.values()
        .map(|v| v.len())
        .max()
        .unwrap_or(0);

    if max_len == 0 {
        return Ok(json!([])); // No data to process
    }

    // 为 meval 清理脚本：将 [var] 替换为 _var 以避免歧义
    let mut meval_script = script.to_string();
    for name in &cell_names {
        meval_script = meval_script.replace(&format!("[{}]", name), &format!("_{}", name));
    }
    info!("  > 生成的 meval 脚本: '{}'", meval_script);

    let mut results: Vec<f64> = Vec::with_capacity(max_len);

    for i in 0..max_len {
        let mut context = meval::Context::new();
        // 为数据单元填充上下文，使用带前缀的名称
        for (name, values) in &referenced_values {
            let value = if values.len() == 1 {
                values[0] // Broadcast single value
            } else {
                values.get(i).cloned().unwrap_or(0.0) // Get value for current index or default
            };
            context.var(format!("_{}", name), value);
        }

        // Evaluate the expression for the current set of values
        match meval::eval_str_with_context(&meval_script, &context) {
            Ok(val) => results.push(val),
            Err(e) => {
                error!("脚本评估出错 '{}'，错误: {}", meval_script, e);
                return Err(format!("脚本评估出错 '{}': {}", meval_script, e));
            }
        }
    }
    
    Ok(json!(results))
    // --- End of new logic ---
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
    info!("正在从文件内容中为单元 '{}' 提取数据。", data_cell.name);
    let content_bytes = general_purpose::STANDARD.decode(base64_content)
        .map_err(|e| {
            error!("Base64 解码文件数据失败: {}", e);
            e.to_string()
        })?;
    
    // For now, we only support Excel. We can add HTML/other parsers later.
    let cursor = Cursor::new(content_bytes);
    let mut workbook: Xlsx<_> = open_workbook_from_rs(cursor).map_err(|e: XlsxError| e.to_string())?;
    
    let mut values: Vec<String> = Vec::new(); // Store as string initially
    
    let sheet_name = data_cell.sheet.as_ref()
        .and_then(|s| if s.is_empty() { None } else { Some(s.clone()) })
        .or_else(|| workbook.sheet_names().first().cloned())
        .ok_or("在Excel文件中未找到工作表")?;
    
    info!("...使用工作表 '{}'。", sheet_name);

    if let Ok(range) = workbook.worksheet_range(&sheet_name) {
        // 根据是否提供了行号和列号来决定提取逻辑
        match (data_cell.row_index, data_cell.column_index.as_deref().filter(|s| !s.is_empty())) {
            // Case 1: 提供了行号和列号 -> 提取单个单元格
            (Some(row_idx), Some(col_str)) => {
                if let Some(col_idx) = excel_col_to_index(col_str) {
                    let row = row_idx as u32 - 1;
                    info!("...提取单个单元格，位于 行 {}, 列 {}", row + 1, col_str);
                    if let Some(cell_value) = range.get_value((row, col_idx)) {
                        values.push(cell_value.to_string());
                    }
                } else {
                    warn!("...列号 '{}' 格式无效，无法解析。", col_str);
                }
            },
            // Case 2: 只提供了行号 -> 提取一行中的一个范围
            (Some(row_idx), None) => {
                let row = row_idx as u32 - 1;
                let start_col = data_cell.start_index.unwrap_or(1) as u32 - 1;
                let end_col = data_cell.end_index
                    .map(|c| c as u32 - 1)
                    .unwrap_or_else(|| (range.get_size().1 as u32).saturating_sub(1));
                info!("...提取一行数据，位于行 {}，从列 {} 到 {}", row + 1, start_col + 1, end_col + 1);
                for col in start_col..=end_col {
                    if let Some(cell_value) = range.get_value((row, col)) {
                        values.push(cell_value.to_string());
                    }
                }
            },
            // Case 3: 只提供了列号 -> 提取一列中的一个范围
            (None, Some(col_str)) => {
                if let Some(col_idx) = excel_col_to_index(col_str) {
                    let start_row = data_cell.start_index.unwrap_or(1) as u32 - 1;
                    let end_row = data_cell.end_index
                        .map(|r| r as u32 - 1)
                        .unwrap_or_else(|| (range.get_size().0 as u32).saturating_sub(1));
                    info!("...提取一列数据，位于列 '{}'，从行 {} 到 {}", col_str, start_row + 1, end_row + 1);
                    for row in start_row..=end_row {
                        if let Some(cell_value) = range.get_value((row, col_idx)) {
                            values.push(cell_value.to_string());
                        }
                    }
                } else {
                    warn!("...列号 '{}' 格式无效，无法解析。", col_str);
                }
            },
            // Case 4: 行号和列号都未提供 -> 无效
            (None, None) => {
                warn!("...必须为文件类型的数据单元提供行号或列号之一。");
            }
        }
    } else {
        warn!("...无法读取工作表 '{}' 的范围数据。", sheet_name);
    }
    
    info!("...成功提取 {} 个值。", values.len());
    Ok(json!(values))
}

fn excel_col_to_index(col_str: &str) -> Option<u32> {
    // 首先，尝试将输入解析为数字 (例如 "1", "2", "3")。
    if let Ok(num) = col_str.trim().parse::<u32>() {
        if num > 0 {
            return Some(num - 1); // 用户输入是基于1的，我们需要基于0的索引。
        } else {
            return None; // 列号必须是正数。
        }
    }

    // 如果解析数字失败，则假定它是Excel样式的字母列 (例如 "A", "B", "C")。
    let mut col: u32 = 0;
    for c in col_str.to_uppercase().chars() {
        if !c.is_ascii_alphabetic() {
            return None; // 对于基于字母的列，这是无效字符。
        }
        col = col * 26 + (c as u32 - 'A' as u32 + 1);
    }
    
    // 检查是否处理了任何字符。空字符串将导致 col = 0。
    if col > 0 {
        Some(col - 1)
    } else {
        None
    }
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