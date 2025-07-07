# AutoWork 离线版本迁移指南

## 1. 迁移概述

本文档详细描述了从在线版本迁移到离线版本的完整流程，包括数据迁移、配置调整、功能对比等内容。

## 2. 版本对比

### 2.1 架构差异

| 组件 | 在线版本 | 离线版本 |
|------|----------|----------|
| 部署方式 | 微服务架构 | 单体应用 |
| 数据库 | MySQL/PostgreSQL | H2 嵌入式数据库 |
| 缓存 | Redis | Caffeine 内存缓存 |
| 配置中心 | Nacos | 本地配置文件 |
| 注册中心 | Nacos | 无需注册中心 |
| 认证系统 | 完整用户系统 | 无需认证 |
| 文件存储 | 分布式存储 | 本地文件系统 |

### 2.2 功能对比

| 功能模块 | 在线版本 | 离线版本 | 备注 |
|----------|----------|----------|------|
| 用户管理 | ✅ | ❌ | 离线版本无需用户系统 |
| 模板管理 | ✅ | ✅ | 功能完全保留 |
| 文件处理 | ✅ | ✅ | 功能完全保留 |
| 数据计算 | ✅ | ✅ | 功能完全保留 |
| 数据导入导出 | 基础功能 | ✅ | 离线版本增强 |
| 多租户 | ✅ | ❌ | 离线版本单租户 |
| 权限控制 | ✅ | ❌ | 离线版本无权限控制 |
| 审计日志 | ✅ | 简化版本 | 保留基本日志 |

## 3. 数据迁移策略

### 3.1 迁移前准备

#### 3.1.1 评估现有数据
1. **统计数据量**
   ```sql
   -- 统计模板数量
   SELECT COUNT(*) FROM template;
   
   -- 统计数据单元数量
   SELECT COUNT(*) FROM data_cell;
   
   -- 统计文件数量
   SELECT COUNT(*) FROM files;
   
   -- 评估数据库大小
   SELECT 
     table_name,
     table_rows,
     ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Size(MB)'
   FROM information_schema.tables 
   WHERE table_schema = 'autowork';
   ```

2. **检查数据完整性**
   ```sql
   -- 检查孤立的数据单元
   SELECT COUNT(*) FROM data_cell dc 
   LEFT JOIN template t ON dc.template_id = t.id 
   WHERE t.id IS NULL;
   
   -- 检查孤立的文件记录
   SELECT COUNT(*) FROM files f 
   LEFT JOIN template t ON f.template_id = t.id 
   WHERE f.template_id IS NOT NULL AND t.id IS NULL;
   ```

3. **备份现有数据**
   ```bash
   # MySQL 备份
   mysqldump -u username -p autowork > autowork_backup.sql
   
   # 备份文件目录
   tar -czf files_backup.tar.gz /path/to/files/
   ```

#### 3.1.2 兼容性检查
1. **检查不兼容的功能**
   - 多用户相关的数据
   - 权限配置
   - 分布式存储路径

2. **数据类型映射**
   | MySQL类型 | H2类型 | 说明 |
   |-----------|--------|------|
   | BIGINT | BIGINT | 直接映射 |
   | VARCHAR | VARCHAR | 直接映射 |
   | TEXT | CLOB | 大文本字段 |
   | LONGTEXT | CLOB | 超大文本字段 |
   | DATETIME | TIMESTAMP | 时间类型 |
   | JSON | VARCHAR | H2不支持JSON |

### 3.2 迁移工具开发

#### 3.2.1 数据导出工具
```java
@Component
public class OnlineDataExporter {
    
    @Autowired
    private DataSource dataSource;
    
    public void exportAllData(String outputPath) throws IOException {
        Path exportDir = Paths.get(outputPath);
        Files.createDirectories(exportDir);
        
        // 导出模板数据
        exportTemplates(exportDir.resolve("templates.json"));
        
        // 导出数据单元
        exportDataCells(exportDir.resolve("data_cells.json"));
        
        // 导出文件信息
        exportFiles(exportDir.resolve("files.json"));
        
        // 导出用户文件
        exportUserFiles(exportDir.resolve("user_files"));
        
        // 创建迁移清单
        createMigrationManifest(exportDir.resolve("migration.json"));
    }
    
    private void exportTemplates(Path outputFile) throws IOException {
        String sql = "SELECT * FROM template WHERE deleted = 0";
        List<Map<String, Object>> templates = jdbcTemplate.queryForList(sql);
        
        // 清理用户相关字段
        templates.forEach(template -> {
            template.remove("user_id");
            template.remove("org_id");
        });
        
        writeJsonFile(outputFile, templates);
    }
    
    private void exportDataCells(Path outputFile) throws IOException {
        String sql = "SELECT * FROM data_cell WHERE deleted = 0";
        List<Map<String, Object>> dataCells = jdbcTemplate.queryForList(sql);
        
        // 处理JSON字段
        dataCells.forEach(cell -> {
            // 将MySQL的JSON字段转换为字符串
            if (cell.get("script") != null) {
                cell.put("script", cell.get("script").toString());
            }
            if (cell.get("specific_value") != null) {
                cell.put("specific_value", cell.get("specific_value").toString());
            }
        });
        
        writeJsonFile(outputFile, dataCells);
    }
    
    private void createMigrationManifest(Path outputFile) throws IOException {
        MigrationManifest manifest = new MigrationManifest();
        manifest.setSourceVersion("online-1.0");
        manifest.setTargetVersion("offline-1.0");
        manifest.setExportTime(LocalDateTime.now());
        manifest.setDataCount(countTotalRecords());
        
        writeJsonFile(outputFile, manifest);
    }
}
```

#### 3.2.2 数据导入工具
```java
@Component
public class OfflineDataImporter {
    
    @Autowired
    private TemplateService templateService;
    
    @Autowired
    private DataCellService dataCellService;
    
    @Autowired
    private FileService fileService;
    
    public void importAllData(Path importDir) throws IOException {
        // 验证迁移清单
        MigrationManifest manifest = readMigrationManifest(importDir.resolve("migration.json"));
        validateMigration(manifest);
        
        // 清空现有数据（可选）
        if (shouldClearExistingData()) {
            clearAllData();
        }
        
        // 导入数据
        importTemplates(importDir.resolve("templates.json"));
        importDataCells(importDir.resolve("data_cells.json"));
        importFiles(importDir.resolve("files.json"));
        importUserFiles(importDir.resolve("user_files"));
        
        // 验证导入结果
        validateImportResult(manifest);
    }
    
    private void importTemplates(Path templateFile) throws IOException {
        if (!Files.exists(templateFile)) return;
        
        List<Template> templates = readJsonFile(templateFile, 
            new TypeReference<List<Template>>() {});
        
        templates.forEach(template -> {
            // 重置ID，让数据库自动生成
            template.setId(null);
            template.setCreatedTime(LocalDateTime.now());
            template.setUpdatedTime(LocalDateTime.now());
            
            templateService.save(template);
        });
    }
    
    private void importDataCells(Path dataCellFile) throws IOException {
        if (!Files.exists(dataCellFile)) return;
        
        List<DataCell> dataCells = readJsonFile(dataCellFile, 
            new TypeReference<List<DataCell>>() {});
        
        dataCells.forEach(dataCell -> {
            // 处理外键关联
            updateTemplateReferences(dataCell);
            
            // 重置ID
            dataCell.setId(null);
            dataCell.setCreatedTime(LocalDateTime.now());
            dataCell.setUpdatedTime(LocalDateTime.now());
            
            dataCellService.save(dataCell);
        });
    }
}
```

### 3.3 自动化迁移脚本

#### 3.3.1 完整迁移脚本
```bash
#!/bin/bash

# AutoWork 在线版本到离线版本迁移脚本
# 使用方法: ./migrate.sh [online_backup_path] [offline_install_path]

set -e

ONLINE_BACKUP_PATH=${1:-"./online_backup"}
OFFLINE_INSTALL_PATH=${2:-"./autowork-offline"}
TEMP_DIR="/tmp/autowork_migration_$$"

echo "开始 AutoWork 迁移..."
echo "在线版本备份路径: $ONLINE_BACKUP_PATH"
echo "离线版本安装路径: $OFFLINE_INSTALL_PATH"

# 1. 验证输入
if [ ! -d "$ONLINE_BACKUP_PATH" ]; then
    echo "错误: 在线版本备份路径不存在"
    exit 1
fi

if [ ! -d "$OFFLINE_INSTALL_PATH" ]; then
    echo "错误: 离线版本安装路径不存在"
    exit 1
fi

# 2. 创建临时工作目录
mkdir -p "$TEMP_DIR"
echo "创建临时目录: $TEMP_DIR"

# 3. 数据转换
echo "开始数据转换..."
python3 << EOF
import json
import os
import sys
from pathlib import Path

def convert_mysql_to_h2(input_dir, output_dir):
    """转换MySQL数据格式为H2兼容格式"""
    
    # 转换模板数据
    templates_file = Path(input_dir) / "templates.json"
    if templates_file.exists():
        with open(templates_file, 'r', encoding='utf-8') as f:
            templates = json.load(f)
        
        # 移除在线版本特有字段
        for template in templates:
            template.pop('user_id', None)
            template.pop('org_id', None)
            template.pop('tenant_id', None)
        
        output_file = Path(output_dir) / "templates.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(templates, f, ensure_ascii=False, indent=2)
    
    # 转换数据单元
    data_cells_file = Path(input_dir) / "data_cells.json"
    if data_cells_file.exists():
        with open(data_cells_file, 'r', encoding='utf-8') as f:
            data_cells = json.load(f)
        
        # 处理JSON字段
        for cell in data_cells:
            # MySQL的JSON字段转换为字符串
            if 'script' in cell and isinstance(cell['script'], dict):
                cell['script'] = json.dumps(cell['script'])
            if 'specific_value' in cell and isinstance(cell['specific_value'], list):
                cell['specific_value'] = json.dumps(cell['specific_value'])
        
        output_file = Path(output_dir) / "data_cells.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data_cells, f, ensure_ascii=False, indent=2)

convert_mysql_to_h2("$ONLINE_BACKUP_PATH", "$TEMP_DIR")
print("数据转换完成")
EOF

# 4. 创建迁移包
echo "创建迁移包..."
cd "$TEMP_DIR"
zip -r "autowork_migration.zip" ./*
MIGRATION_PACKAGE="$TEMP_DIR/autowork_migration.zip"

# 5. 启动离线版本
echo "启动离线版本..."
cd "$OFFLINE_INSTALL_PATH"
if [ ! -f "autowork-offline.jar" ]; then
    echo "错误: 找不到离线版本可执行文件"
    exit 1
fi

# 检查离线版本是否已在运行
if pgrep -f "autowork-offline.jar" > /dev/null; then
    echo "离线版本已在运行，跳过启动"
else
    java -jar autowork-offline.jar --spring.profiles.active=offline &
    BACKEND_PID=$!
    echo "后端进程ID: $BACKEND_PID"
    
    # 等待服务启动
    echo "等待服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:18080/api/offline/system/info > /dev/null; then
            echo "服务启动成功"
            break
        fi
        sleep 2
    done
fi

# 6. 执行数据导入
echo "执行数据导入..."
curl -X POST \
     -H "Content-Type: multipart/form-data" \
     -F "file=@$MIGRATION_PACKAGE" \
     http://localhost:18080/api/offline/data/import

if [ $? -eq 0 ]; then
    echo "数据导入成功"
else
    echo "数据导入失败"
    exit 1
fi

# 7. 验证迁移结果
echo "验证迁移结果..."
RESULT=$(curl -s http://localhost:18080/api/offline/system/info)
echo "系统信息: $RESULT"

# 8. 清理临时文件
echo "清理临时文件..."
rm -rf "$TEMP_DIR"

echo "迁移完成！请访问 http://localhost:18080 查看离线版本"
```

### 3.4 数据验证和回滚

#### 3.4.1 迁移验证工具
```java
@Component
public class MigrationValidator {
    
    public ValidationResult validateMigration(MigrationManifest manifest) {
        ValidationResult result = new ValidationResult();
        
        // 验证数据完整性
        validateDataIntegrity(result);
        
        // 验证功能可用性
        validateFunctionality(result);
        
        // 验证性能
        validatePerformance(result);
        
        return result;
    }
    
    private void validateDataIntegrity(ValidationResult result) {
        // 检查模板数量
        long templateCount = templateService.count();
        result.addCheck("template_count", templateCount);
        
        // 检查数据单元数量
        long dataCellCount = dataCellService.count();
        result.addCheck("data_cell_count", dataCellCount);
        
        // 检查数据完整性
        List<DataCell> orphanCells = dataCellService.findOrphanCells();
        result.addCheck("orphan_cells", orphanCells.size());
        
        // 检查文件完整性
        long fileCount = fileService.count();
        result.addCheck("file_count", fileCount);
    }
    
    private void validateFunctionality(ValidationResult result) {
        try {
            // 测试模板创建
            Template testTemplate = createTestTemplate();
            result.addCheck("template_creation", "success");
            
            // 测试数据处理
            DataCell testCell = createTestDataCell(testTemplate.getId());
            result.addCheck("data_processing", "success");
            
            // 清理测试数据
            cleanupTestData(testTemplate, testCell);
            
        } catch (Exception e) {
            result.addCheck("functionality_test", "failed: " + e.getMessage());
        }
    }
}
```

#### 3.4.2 回滚机制
```java
@Component
public class MigrationRollback {
    
    public void createBackup() {
        String backupDir = "data/backup/" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        try {
            // 备份数据库
            backupDatabase(backupDir);
            
            // 备份文件
            backupFiles(backupDir);
            
            // 备份配置
            backupConfigs(backupDir);
            
        } catch (Exception e) {
            throw new RuntimeException("备份创建失败", e);
        }
    }
    
    public void rollback(String backupPath) {
        try {
            // 停止应用服务
            stopServices();
            
            // 恢复数据库
            restoreDatabase(backupPath);
            
            // 恢复文件
            restoreFiles(backupPath);
            
            // 恢复配置
            restoreConfigs(backupPath);
            
            // 重启服务
            startServices();
            
        } catch (Exception e) {
            throw new RuntimeException("回滚失败", e);
        }
    }
}
```

## 4. 配置迁移

### 4.1 配置文件对比

#### 4.1.1 在线版本配置 (application.yml)
```yaml
server:
  port: 9915

spring:
  cloud:
    nacos:
      discovery:
        server-addr: nacos-server:8848
      config:
        server-addr: nacos-server:8848
        file-extension: yml
        
  datasource:
    url: jdbc:mysql://mysql-server:3306/autowork
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    
  redis:
    host: redis-server
    port: 6379
    password: ${REDIS_PASSWORD}
```

#### 4.1.2 离线版本配置 (application-offline.yml)
```yaml
server:
  port: 18080

spring:
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:file:./data/database/autowork;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1
    username: sa
    password: 
    
  h2:
    console:
      enabled: true
      path: /h2-console

# 应用配置
app:
  data-dir: ./data
  portable-mode: false
  max-file-size: 100MB
```

### 4.2 环境变量映射

| 在线版本环境变量 | 离线版本配置 | 说明 |
|------------------|-------------|------|
| `DB_USERNAME` | 固定为 `sa` | H2默认用户名 |
| `DB_PASSWORD` | 空 | H2默认无密码 |
| `REDIS_PASSWORD` | 移除 | 使用内存缓存 |
| `NACOS_SERVER` | 移除 | 使用本地配置 |
| `FILE_STORAGE_PATH` | `app.data-dir` | 本地文件存储 |

## 5. 用户培训和支持

### 5.1 功能差异培训

#### 5.1.1 移除的功能
- **用户管理**: 无需登录和用户注册
- **权限控制**: 所有功能均可访问
- **多租户**: 单实例单租户
- **集群部署**: 单机部署

#### 5.1.2 新增的功能
- **数据导入导出**: 完整的备份和恢复功能
- **便携模式**: 支持U盘等可移动存储
- **离线运行**: 无需网络连接

#### 5.1.3 操作流程变化
```
在线版本流程:
登录 → 选择组织 → 使用功能

离线版本流程:
启动应用 → 直接使用功能
```

### 5.2 迁移检查清单

#### 5.2.1 迁移前检查
- [ ] 备份在线版本所有数据
- [ ] 确认离线版本系统要求
- [ ] 准备迁移工具和脚本
- [ ] 制定回滚方案
- [ ] 通知相关用户

#### 5.2.2 迁移过程检查
- [ ] 验证数据导出完整性
- [ ] 执行数据格式转换
- [ ] 启动离线版本服务
- [ ] 执行数据导入
- [ ] 验证数据完整性

#### 5.2.3 迁移后检查
- [ ] 功能可用性测试
- [ ] 性能测试
- [ ] 用户接受度测试
- [ ] 建立数据备份计划
- [ ] 更新操作文档

## 6. 持续维护

### 6.1 数据同步策略

#### 6.1.1 定期同步
如果需要在多个离线实例间同步数据：
```bash
# 每日同步脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_FILE="autowork_sync_$DATE.zip"

# 导出数据
curl -X POST http://source:18080/api/offline/data/export > $BACKUP_FILE

# 同步到目标实例
scp $BACKUP_FILE target-server:/tmp/
ssh target-server "curl -X POST -F 'file=@/tmp/$BACKUP_FILE' http://localhost:18080/api/offline/data/import"
```

#### 6.1.2 增量同步
开发增量同步机制以减少同步时间：
```java
@Service
public class IncrementalSyncService {
    
    public void exportChanges(LocalDateTime since, String outputPath) {
        // 导出指定时间后的变更数据
        List<Template> changedTemplates = templateService.findChangedSince(since);
        List<DataCell> changedCells = dataCellService.findChangedSince(since);
        
        // 创建增量包
        createIncrementalPackage(changedTemplates, changedCells, outputPath);
    }
    
    public void importChanges(String packagePath) {
        // 导入增量变更
        IncrementalPackage pkg = readIncrementalPackage(packagePath);
        
        // 应用变更
        applyChanges(pkg);
    }
}
```

### 6.2 版本升级策略

#### 6.2.1 升级兼容性
确保离线版本的升级不会影响现有数据：
```java
@Component
public class VersionUpgradeManager {
    
    public void upgradeDatabase(String fromVersion, String toVersion) {
        List<MigrationScript> scripts = getMigrationScripts(fromVersion, toVersion);
        
        for (MigrationScript script : scripts) {
            executeUpgradeScript(script);
        }
    }
    
    private void executeUpgradeScript(MigrationScript script) {
        // 创建备份点
        createCheckpoint();
        
        try {
            // 执行升级脚本
            script.execute();
        } catch (Exception e) {
            // 升级失败，回滚到备份点
            rollbackToCheckpoint();
            throw new UpgradeException("升级失败", e);
        }
    }
}
```

### 6.3 监控和告警

#### 6.3.1 健康检查
```java
@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    @GetMapping("/status")
    public HealthStatus getHealthStatus() {
        HealthStatus status = new HealthStatus();
        
        // 检查数据库连接
        status.setDatabaseHealth(checkDatabaseHealth());
        
        // 检查磁盘空间
        status.setDiskSpaceHealth(checkDiskSpace());
        
        // 检查内存使用
        status.setMemoryHealth(checkMemoryUsage());
        
        return status;
    }
}
```

#### 6.3.2 性能监控
```java
@Component
public class PerformanceMonitor {
    
    @Scheduled(fixedRate = 60000) // 每分钟检查一次
    public void collectMetrics() {
        // 收集性能指标
        long usedMemory = getUsedMemory();
        long diskSpace = getAvailableDiskSpace();
        int activeConnections = getActiveConnections();
        
        // 记录指标
        logMetrics(usedMemory, diskSpace, activeConnections);
        
        // 检查阈值
        checkThresholds(usedMemory, diskSpace);
    }
}
```

## 7. 故障处理

### 7.1 常见迁移问题

#### 7.1.1 数据类型不兼容
**问题**: MySQL JSON字段在H2中无法正确处理

**解决方案**:
```java
// 数据转换工具
public class DataTypeConverter {
    
    public String convertJsonField(Object mysqlJson) {
        if (mysqlJson == null) return null;
        
        if (mysqlJson instanceof String) {
            return (String) mysqlJson;
        } else if (mysqlJson instanceof Map || mysqlJson instanceof List) {
            return objectMapper.writeValueAsString(mysqlJson);
        }
        
        return mysqlJson.toString();
    }
}
```

#### 7.1.2 文件路径问题
**问题**: 绝对路径在不同环境下无法访问

**解决方案**:
```java
@Service
public class FilePathMigrator {
    
    public void convertFilePaths() {
        List<Files> allFiles = fileService.findAll();
        
        for (Files file : allFiles) {
            String oldPath = file.getPath();
            String newPath = convertToRelativePath(oldPath);
            file.setPath(newPath);
            fileService.update(file);
        }
    }
    
    private String convertToRelativePath(String absolutePath) {
        // 将绝对路径转换为相对于数据目录的路径
        Path dataDir = Paths.get("data");
        Path filePath = Paths.get(absolutePath);
        
        if (filePath.isAbsolute()) {
            return dataDir.relativize(filePath).toString();
        }
        
        return absolutePath;
    }
}
```

### 7.2 应急处理流程

#### 7.2.1 迁移失败处理
```bash
#!/bin/bash
# 迁移失败应急处理脚本

echo "检测到迁移失败，开始应急处理..."

# 1. 停止离线版本服务
pkill -f "autowork-offline.jar"

# 2. 恢复备份
if [ -f "data_backup.zip" ]; then
    echo "恢复数据备份..."
    rm -rf data/
    unzip data_backup.zip
fi

# 3. 重启服务
echo "重启服务..."
java -jar autowork-offline.jar &

# 4. 验证服务状态
sleep 10
if curl -s http://localhost:18080/api/health/status; then
    echo "服务恢复成功"
else
    echo "服务恢复失败，请手动检查"
fi
```

#### 7.2.2 数据损坏恢复
```java
@Service
public class DataRecoveryService {
    
    public void recoverCorruptedData() {
        // 检测数据损坏
        List<String> issues = detectDataIssues();
        
        if (issues.isEmpty()) {
            return;
        }
        
        // 尝试自动修复
        for (String issue : issues) {
            try {
                autoRepair(issue);
            } catch (Exception e) {
                // 记录无法自动修复的问题
                logManualRepairNeeded(issue, e);
            }
        }
    }
    
    private void autoRepair(String issue) {
        switch (issue) {
            case "orphan_data_cells":
                removeOrphanDataCells();
                break;
            case "invalid_file_references":
                fixFileReferences();
                break;
            case "corrupted_json_fields":
                repairJsonFields();
                break;
        }
    }
}
```

通过以上详细的迁移指南，可以确保从在线版本到离线版本的平滑迁移，最大限度地保护现有数据和功能的连续性。