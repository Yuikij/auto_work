
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool};
use crate::models::{Template, Files, DataCell};

#[derive(Serialize, Deserialize, Debug)]
pub struct AllData {
    templates: Vec<Template>,
    files: Vec<Files>,
    data_cells: Vec<DataCell>,
}

#[tauri::command]
pub async fn export_all_data(db: tauri::State<'_, SqlitePool>) -> Result<String, String> {
    let templates = sqlx::query_as::<_, Template>("SELECT * FROM templates")
        .fetch_all(&*db)
        .await
        .map_err(|e| e.to_string())?;

    let files = sqlx::query_as::<_, Files>("SELECT * FROM files")
        .fetch_all(&*db)
        .await
        .map_err(|e| e.to_string())?;

    let data_cells = sqlx::query_as::<_, DataCell>("SELECT * FROM data_cell")
        .fetch_all(&*db)
        .await
        .map_err(|e| e.to_string())?;

    let all_data = AllData {
        templates,
        files,
        data_cells,
    };

    serde_json::to_string(&all_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_all_data(db: tauri::State<'_, SqlitePool>, data_json: String) -> Result<(), String> {
    let all_data: AllData = serde_json::from_str(&data_json).map_err(|e| e.to_string())?;

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    // Clear existing data
    sqlx::query("DELETE FROM data_cell").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM files").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM templates").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    
    // Reset autoincrement counters for SQLite
    sqlx::query("DELETE FROM sqlite_sequence WHERE name IN ('templates', 'files', 'data_cell')").execute(&mut *tx).await.map_err(|e| e.to_string())?;


    // Insert new data
    for t in all_data.templates {
        sqlx::query("INSERT INTO templates (id, name, content, type_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(t.id)
            .bind(t.name)
            .bind(t.content)
            .bind(t.type_id)
            .bind(t.created_at)
            .bind(t.updated_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    for f in all_data.files {
        sqlx::query("INSERT INTO files (id, name, path, template_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(f.id)
            .bind(f.name)
            .bind(f.path)
            .bind(f.template_id)
            .bind(f.created_at)
            .bind(f.updated_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    for dc in all_data.data_cells {
        sqlx::query(
            r#"
            INSERT INTO data_cell (
                id, name, source_id, row_index, column_index, sheet, 
                script, start_index, end_index, res, 
                template_id, specific_value, param_name, type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(dc.id)
        .bind(dc.name)
        .bind(dc.source_id)
        .bind(dc.row_index)
        .bind(dc.column_index)
        .bind(dc.sheet)
        .bind(dc.script)
        .bind(dc.start_index)
        .bind(dc.end_index)
        .bind(dc.res)
        .bind(dc.template_id)
        .bind(dc.specific_value)
        .bind(dc.param_name)
        .bind(dc.r#type)
        .bind(dc.created_at)
        .bind(dc.updated_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
} 