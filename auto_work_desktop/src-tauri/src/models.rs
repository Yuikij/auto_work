use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Template {
    pub id: i64,
    pub name: String,
    pub content: Option<String>,
    pub type_id: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct DataCell {
    pub id: i64,
    pub template_id: i64,
    pub name: String,
    pub r#type: i32,
    pub res: bool,
    // Fields for 'File' type
    pub source_id: Option<i64>,
    // Fields for 'Data' type
    pub source_cell_id: Option<i64>,
    pub sheet: Option<String>,
    pub row_index: Option<i64>,
    pub column_index: Option<String>,
    pub start_index: Option<i64>,
    pub end_index: Option<i64>,
    // Field for 'Script' type
    pub script: Option<String>,
    // Field for 'Value' type
    pub specific_value: Option<String>,
    // Field for 'Param' type
    pub param_name: Option<String>,
    // Timestamps
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TemplateParam {
    pub id: i64,
    pub template_id: i64,
    pub key: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Files {
    pub id: i64,
    pub name: String,
    pub path: Option<String>,
    pub template_id: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Script {
    pub id: Option<i64>,
    pub name: String,
    pub content: String,
    pub parameters: Vec<Parameter>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Parameter {
    pub name: String,
    pub value: String,
} 