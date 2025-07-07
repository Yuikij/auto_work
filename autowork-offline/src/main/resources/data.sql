-- 插入默认配置（使用 MERGE 避免重复插入）
MERGE INTO app_config (config_key, config_value, description) VALUES 
('app.version', '1.0.0', '应用版本'),
('app.name', 'AutoWork 离线版', '应用名称'),
('data.backup.auto', 'true', '自动备份开关'),
('data.backup.interval', '24', '自动备份间隔（小时）'),
('ui.theme', 'light', '界面主题'),
('cache.enabled', 'true', '缓存开关'),
('file.max-size', '104857600', '文件大小限制（字节）'),
('system.init-time', CURRENT_TIMESTAMP(), '系统初始化时间');