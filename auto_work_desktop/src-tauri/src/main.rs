// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, AppHandle};
use sqlx::SqlitePool;
use sqlx::sqlite::SqliteConnectOptions;
use std::str::FromStr;

mod commands;
mod models;

use commands::{template_commands, file_commands, data_cell_commands, import_export_commands, template_execution_commands, app_info_commands};

fn get_db_path(app_handle: &AppHandle) -> String {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    
    // Ensure the directory exists
    std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
    
    app_data_dir.join("app.db").to_string_lossy().to_string()
}

// #[tauri::command]
// async fn migrate_db(pool: State<'_, SqlitePool>) -> Result<(), String> {
//     sqlx::migrate!("./migrations")
//         .run(&*pool)
//         .await
//         .map_err(|e| e.to_string())?;
//     Ok(())
// }

fn main() {
    pretty_env_logger::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Perform setup in an async block
            tauri::async_runtime::block_on(async move {
                let db_path = get_db_path(&app_handle);
                let db_url = format!("sqlite:{}", db_path);
                
                let connect_options = SqliteConnectOptions::from_str(&db_url)
                    .expect("Failed to parse database URL")
                    .create_if_missing(true);

                let pool = SqlitePool::connect_with(connect_options)
                    .await
                    .expect("Failed to connect to database");

                // Run migrations
                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .expect("Database migration failed");

                app_handle.manage(pool);
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            template_commands::add_template,
            template_commands::list_templates,
            template_commands::delete_template,
            template_commands::edit_template,
            file_commands::upload_file_to_template,
            file_commands::list_files_by_template,
            file_commands::delete_file,
            file_commands::parse_data_cell,
            file_commands::add_file,
            data_cell_commands::add_data_cell,
            data_cell_commands::list_data_cells,
            data_cell_commands::update_data_cell,
            data_cell_commands::delete_data_cell,
            data_cell_commands::get_data_cell,
            data_cell_commands::get_data_cells,
            import_export_commands::export_all_data,
            import_export_commands::import_all_data,
            template_execution_commands::execute_template,
            template_execution_commands::get_templates,
            app_info_commands::get_app_info,
            app_info_commands::create_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
