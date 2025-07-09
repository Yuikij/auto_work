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

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct DataCell {
    pub id: i64,
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
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TemplateParam {
    pub id: i64,
    pub template_id: i64,
    pub key: String,
    pub value: Option<String>,
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