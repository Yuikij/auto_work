-- 数据单元表
CREATE TABLE IF NOT EXISTS data_cell (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    source_id BIGINT,
    row_index INTEGER,
    column_index INTEGER,
    sheet VARCHAR(255),
    select_index INTEGER,
    script CLOB,
    start_index INTEGER,
    end_index INTEGER,
    res BOOLEAN DEFAULT FALSE,
    template_id BIGINT,
    specific_value CLOB,
    param_name VARCHAR(255),
    type INTEGER DEFAULT 0,
    deleted BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT DEFAULT 1,
    parent_id BIGINT,
    template_id BIGINT,
    name VARCHAR(255),
    path VARCHAR(500),
    type INTEGER DEFAULT 0,
    zip_type INTEGER DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    deleted BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模板表
CREATE TABLE IF NOT EXISTS template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description CLOB,
    type INTEGER DEFAULT 0,
    content CLOB,
    status INTEGER DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 脚本表
CREATE TABLE IF NOT EXISTS script (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    operator_type INTEGER DEFAULT 0,
    left_id BIGINT,
    right_id BIGINT,
    left_value DOUBLE,
    right_value DOUBLE,
    operator VARCHAR(50),
    deleted BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 应用配置表
CREATE TABLE IF NOT EXISTS app_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value CLOB,
    description VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_data_cell_template_id ON data_cell(template_id);
CREATE INDEX IF NOT EXISTS idx_data_cell_source_id ON data_cell(source_id);
CREATE INDEX IF NOT EXISTS idx_files_template_id ON files(template_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
CREATE INDEX IF NOT EXISTS idx_template_type ON template(type);
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);