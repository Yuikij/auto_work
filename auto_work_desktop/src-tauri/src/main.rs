// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, AppHandle};
use sqlx::SqlitePool;

mod commands;
mod models;

use commands::{template_commands, file_commands, data_cell_commands, import_export_commands};

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
            tauri::async_runtime::spawn(async move {
                let db_path = get_db_path(&app_handle);
                let db_url = format!("sqlite:{}", db_path);
                
                let pool = SqlitePool::connect(&db_url).await.unwrap();
                
                // info!("Running database migrations...");
                // let migration_result = sqlx::migrate!("./migrations")
                //     .run(&pool)
                //     .await;

                // match migration_result {
                //     Ok(_) => {
                //         info!("Database migration successful!");
                //     }
                //     Err(e) => {
                //         error!("Database migration failed: {:?}", e);
                //         panic!("Database migration failed: {:?}", e);
                //     }
                // }
                
                app_handle.manage(pool);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            template_commands::add_template,
            template_commands::list_templates,
            template_commands::delete_template,
            template_commands::edit_template,
            file_commands::upload_files,
            file_commands::list_files,
            file_commands::delete_file,
            file_commands::parse_data_cell,
            data_cell_commands::add_data_cell,
            data_cell_commands::list_data_cells,
            data_cell_commands::update_data_cell,
            data_cell_commands::delete_data_cell,
            data_cell_commands::get_data_cell,
            import_export_commands::export_all_data,
            import_export_commands::import_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
