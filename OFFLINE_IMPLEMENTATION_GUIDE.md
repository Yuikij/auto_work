# Auto Work 离线版本实施指南

## 1. 实施步骤概览

本指南详细描述了将当前微服务架构的 Auto Work 项目改造为离线版本的具体实施步骤。

## 2. Phase 1: 后端核心功能改造

### 2.1 创建离线版本后端模块

#### 2.1.1 创建新的Maven模块
```bash
mkdir autowork-offline
cd autowork-offline
```

#### 2.1.2 修改 pom.xml 依赖
移除微服务相关依赖，添加 H2 数据库和内存缓存：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.soukon</groupId>
    <artifactId>autowork-offline</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.0</version>
        <relativePath/>
    </parent>
    
    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- H2 数据库 -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- MyBatis Plus -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
            <version>3.5.2</version>
        </dependency>
        
        <!-- Caffeine 缓存 -->
        <dependency>
            <groupId>com.github.ben-manes.caffeine</groupId>
            <artifactId>caffeine</artifactId>
        </dependency>
        
        <!-- 其他必要依赖 -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>easyexcel</artifactId>
            <version>4.0.1</version>
        </dependency>
        
        <dependency>
            <groupId>org.apache.groovy</groupId>
            <artifactId>groovy-all</artifactId>
            <version>4.0.22</version>
            <type>pom</type>
        </dependency>
        
        <!-- 文件压缩 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-compress</artifactId>
            <version>1.21</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.2 配置文件改造

#### 2.2.1 创建 application-offline.yml
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
      
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.nolog.NoLoggingImpl
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
      
# 应用配置
app:
  data-dir: ./data
  portable-mode: false
  max-file-size: 100MB
  cache:
    maximum-size: 1000
    expire-after-write: 30m
```

### 2.3 数据库初始化

#### 2.3.1 创建 schema.sql
```sql
-- 数据单元表
CREATE TABLE IF NOT EXISTS data_cell (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    source_id BIGINT,
    row_index INTEGER,
    column_index INTEGER,
    sheet VARCHAR(255),
    select_index INTEGER,
    script TEXT,
    start_index INTEGER,
    end_index INTEGER,
    res BOOLEAN DEFAULT FALSE,
    template_id BIGINT,
    specific_value TEXT,
    param_name VARCHAR(255),
    type INTEGER DEFAULT 0,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT DEFAULT 1,
    parent_id BIGINT,
    template_id BIGINT,
    name VARCHAR(255),
    type INTEGER DEFAULT 0,
    zip_type INTEGER DEFAULT 0,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 模板表
CREATE TABLE IF NOT EXISTS template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT,
    type INTEGER DEFAULT 0,
    content TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 应用配置表
CREATE TABLE IF NOT EXISTS app_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(255),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO app_config (config_key, config_value, description) VALUES 
('app.version', '1.0.0', '应用版本'),
('data.backup.auto', 'true', '自动备份开关'),
('ui.theme', 'light', '界面主题');
```

### 2.4 核心服务改造

#### 2.4.1 创建配置管理服务
```java
@Service
public class ConfigService {
    
    @Autowired
    private AppConfigMapper configMapper;
    
    private final Cache<String, String> configCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .build();
    
    public String getConfig(String key, String defaultValue) {
        return configCache.get(key, k -> {
            AppConfig config = configMapper.selectByKey(k);
            return config != null ? config.getConfigValue() : defaultValue;
        });
    }
    
    public void setConfig(String key, String value, String description) {
        AppConfig config = new AppConfig();
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(description);
        
        configMapper.insertOrUpdate(config);
        configCache.put(key, value);
    }
}
```

#### 2.4.2 创建数据导入导出服务
```java
@Service
public class DataImportExportService {
    
    @Autowired
    private DataCellService dataCellService;
    
    @Autowired
    private TemplateService templateService;
    
    @Autowired
    private FileService fileService;
    
    /**
     * 全量数据导出
     */
    public String exportAllData() throws IOException {
        String exportDir = "data/exports";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String exportFileName = "autowork_backup_" + timestamp + ".zip";
        
        Path exportPath = Paths.get(exportDir, exportFileName);
        Files.createDirectories(exportPath.getParent());
        
        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(exportPath))) {
            // 导出模板数据
            exportTemplates(zos);
            
            // 导出数据单元
            exportDataCells(zos);
            
            // 导出文件信息
            exportFiles(zos);
            
            // 导出配置
            exportConfigs(zos);
            
            // 导出用户文件
            exportUserFiles(zos);
        }
        
        return exportPath.toString();
    }
    
    /**
     * 全量数据导入
     */
    public void importAllData(MultipartFile file) throws IOException {
        Path tempDir = Files.createTempDirectory("autowork_import_");
        
        try {
            // 解压文件
            extractZipFile(file.getInputStream(), tempDir);
            
            // 导入各类数据
            importTemplates(tempDir.resolve("templates.json"));
            importDataCells(tempDir.resolve("data_cells.json"));
            importFiles(tempDir.resolve("files.json"));
            importConfigs(tempDir.resolve("configs.json"));
            importUserFiles(tempDir.resolve("user_files"));
            
        } finally {
            // 清理临时目录
            FileUtils.deleteDirectory(tempDir.toFile());
        }
    }
    
    // ... 其他导入导出方法的实现
}
```

#### 2.4.3 创建离线控制器
```java
@RestController
@RequestMapping("/api/offline")
public class OfflineController {
    
    @Autowired
    private DataImportExportService importExportService;
    
    @Autowired
    private ConfigService configService;
    
    /**
     * 系统信息
     */
    @GetMapping("/system/info")
    public ApiResponse<SystemInfo> getSystemInfo() {
        SystemInfo info = new SystemInfo();
        info.setVersion(configService.getConfig("app.version", "1.0.0"));
        info.setDataDir(Paths.get("data").toAbsolutePath().toString());
        info.setPortableMode(Boolean.parseBoolean(configService.getConfig("app.portable", "false")));
        
        return ApiResponse.success(info);
    }
    
    /**
     * 全量数据导出
     */
    @PostMapping("/data/export")
    public ApiResponse<String> exportData() {
        try {
            String exportPath = importExportService.exportAllData();
            return ApiResponse.success(exportPath);
        } catch (Exception e) {
            return ApiResponse.error("导出失败: " + e.getMessage());
        }
    }
    
    /**
     * 全量数据导入
     */
    @PostMapping("/data/import")
    public ApiResponse<String> importData(@RequestParam("file") MultipartFile file) {
        try {
            importExportService.importAllData(file);
            return ApiResponse.success("导入成功");
        } catch (Exception e) {
            return ApiResponse.error("导入失败: " + e.getMessage());
        }
    }
    
    /**
     * 模板导出
     */
    @PostMapping("/template/export")
    public ApiResponse<String> exportTemplate(@RequestParam("templateId") Long templateId) {
        try {
            String exportPath = importExportService.exportTemplate(templateId);
            return ApiResponse.success(exportPath);
        } catch (Exception e) {
            return ApiResponse.error("模板导出失败: " + e.getMessage());
        }
    }
    
    /**
     * 模板导入
     */
    @PostMapping("/template/import")
    public ApiResponse<String> importTemplate(@RequestParam("file") MultipartFile file) {
        try {
            importExportService.importTemplate(file);
            return ApiResponse.success("模板导入成功");
        } catch (Exception e) {
            return ApiResponse.error("模板导入失败: " + e.getMessage());
        }
    }
}
```

### 2.5 启动类改造

```java
@SpringBootApplication
@MapperScan("com.soukon.mapper")
@EnableCaching
public class AutoWorkOfflineApplication {
    
    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("java.awt.headless", "false");
        
        // 初始化数据目录
        initDataDirectory();
        
        // 启动Spring Boot应用
        SpringApplication.run(AutoWorkOfflineApplication.class, args);
        
        // 可选：启动完成后打开浏览器
        openBrowser();
    }
    
    private static void initDataDirectory() {
        try {
            Path dataDir = Paths.get("data");
            Files.createDirectories(dataDir.resolve("database"));
            Files.createDirectories(dataDir.resolve("files"));
            Files.createDirectories(dataDir.resolve("exports"));
            Files.createDirectories(dataDir.resolve("config"));
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize data directory", e);
        }
    }
    
    private static void openBrowser() {
        try {
            Thread.sleep(2000); // 等待服务启动
            Desktop.getDesktop().browse(new URI("http://localhost:18080"));
        } catch (Exception e) {
            // 忽略错误，用户可以手动打开
        }
    }
}
```

## 3. Phase 2: 前端改造

### 3.1 移除认证相关代码

#### 3.1.1 修改 AppRouter.jsx
```jsx
import React from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Home from "./components/home/Home";
import DataManagement from "./components/data/DataManagement";

const AppRouter = () => (
    <Router>
        <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
    </Router>
);

export default AppRouter;
```

### 3.2 创建数据管理组件

#### 3.2.1 创建 DataManagement.jsx
```jsx
import React, { useState } from 'react';
import { Upload, Button, message, Card, Space, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import axios from 'axios';

const DataManagement = () => {
    const [loading, setLoading] = useState(false);
    
    const handleExportAll = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/offline/data/export');
            if (response.data.success) {
                message.success('数据导出成功！导出文件：' + response.data.data);
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            message.error('导出失败');
        } finally {
            setLoading(false);
        }
    };
    
    const handleImportAll = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        setLoading(true);
        axios.post('/api/offline/data/import', formData)
            .then(response => {
                if (response.data.success) {
                    message.success('数据导入成功！');
                } else {
                    message.error(response.data.message);
                }
            })
            .catch(error => {
                message.error('导入失败');
            })
            .finally(() => {
                setLoading(false);
            });
        
        return false; // 阻止默认上传行为
    };
    
    const handleExportTemplate = async () => {
        // 实现模板导出
    };
    
    const handleImportTemplate = (file) => {
        // 实现模板导入
        return false;
    };
    
    return (
        <div style={{ padding: '20px' }}>
            <Card title="数据管理" style={{ marginBottom: '20px' }}>
                <h3>全量数据备份与恢复</h3>
                <Space>
                    <Button 
                        type="primary" 
                        icon={<ExportOutlined />}
                        onClick={handleExportAll}
                        loading={loading}
                    >
                        导出全部数据
                    </Button>
                    
                    <Upload
                        beforeUpload={handleImportAll}
                        showUploadList={false}
                        accept=".zip"
                    >
                        <Button 
                            icon={<ImportOutlined />}
                            loading={loading}
                        >
                            导入全部数据
                        </Button>
                    </Upload>
                </Space>
                
                <Divider />
                
                <h3>模板管理</h3>
                <Space>
                    <Button 
                        icon={<DownloadOutlined />}
                        onClick={handleExportTemplate}
                    >
                        导出模板
                    </Button>
                    
                    <Upload
                        beforeUpload={handleImportTemplate}
                        showUploadList={false}
                        accept=".json,.zip"
                    >
                        <Button icon={<UploadOutlined />}>
                            导入模板
                        </Button>
                    </Upload>
                </Space>
            </Card>
        </div>
    );
};

export default DataManagement;
```

### 3.3 更新主页导航

#### 3.3.1 修改 Home.jsx 添加数据管理入口
```jsx
// 在原有的Home组件中添加数据管理按钮
<Button 
    type="primary" 
    onClick={() => navigate('/data')}
    style={{ margin: '10px' }}
>
    数据管理
</Button>
```

## 4. Phase 3: Electron 集成

### 4.1 创建 Electron 项目

#### 4.1.1 初始化 Electron 项目
```bash
mkdir autowork-electron
cd autowork-electron
npm init -y
npm install electron electron-builder --save-dev
npm install axios --save
```

#### 4.1.2 创建 main.js
```javascript
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

let mainWindow;
let backendProcess;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets/icon.png') // 应用图标
    });

    // 等待后端启动
    waitForBackend().then(() => {
        mainWindow.loadURL('http://localhost:18080');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const startBackend = () => {
    const jarPath = path.join(__dirname, 'backend/autowork-offline.jar');
    
    backendProcess = spawn('java', [
        '-jar',
        '-Xmx512m', // 限制内存使用
        '-Dspring.profiles.active=offline',
        jarPath
    ], {
        stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
};

const waitForBackend = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            await axios.get('http://localhost:18080/api/offline/system/info');
            console.log('Backend is ready');
            return;
        } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    dialog.showErrorBox('启动失败', '后端服务启动失败，请检查Java环境');
    app.quit();
};

app.whenReady().then(() => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
```

#### 4.1.3 配置 package.json
```json
{
  "name": "autowork-offline",
  "version": "1.0.0",
  "description": "AutoWork 离线版本",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build-all": "electron-builder --win --mac --linux"
  },
  "build": {
    "appId": "com.soukon.autowork",
    "productName": "AutoWork",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "backend/**/*",
      "frontend/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  },
  "devDependencies": {
    "electron": "^20.0.0",
    "electron-builder": "^23.0.0"
  },
  "dependencies": {
    "axios": "^1.0.0"
  }
}
```

## 5. Phase 4: 构建和打包

### 5.1 构建脚本

#### 5.1.1 创建 build.sh
```bash
#!/bin/bash

echo "构建 AutoWork 离线版本..."

# 构建后端
echo "构建后端..."
cd autowork-offline
mvn clean package -DskipTests

# 构建前端
echo "构建前端..."
cd ../auto_work_web
npm install
npm run build

# 准备 Electron 打包目录
echo "准备 Electron 打包..."
cd ../autowork-electron

# 复制后端 JAR 文件
mkdir -p backend
cp ../autowork-offline/target/autowork-offline-1.0.0.jar backend/

# 复制前端构建文件
mkdir -p frontend
cp -r ../auto_work_web/build/* frontend/

# 打包 Electron 应用
echo "打包 Electron 应用..."
npm run build-all

echo "构建完成！输出目录：dist/"
```

### 5.2 发布配置

#### 5.2.1 创建 release-notes.md
```markdown
# AutoWork 离线版本 v1.0.0

## 新功能
- ✅ 完全离线运行，无需网络连接
- ✅ 内置 H2 数据库，数据本地存储
- ✅ 全量数据导入导出功能
- ✅ 模板导入导出功能
- ✅ 跨平台支持（Windows、macOS、Linux）

## 系统要求
- Java 8 或更高版本
- 内存：最少 512MB，推荐 1GB
- 磁盘空间：最少 200MB

## 安装说明
1. 下载对应平台的安装包
2. 运行安装程序
3. 启动 AutoWork
4. 首次运行会自动创建数据目录

## 数据迁移
从在线版本迁移到离线版本：
1. 在离线版本中选择"数据管理"
2. 导入从在线版本导出的数据文件
3. 验证数据完整性
```

## 6. 测试计划

### 6.1 功能测试
- [ ] 应用启动和关闭
- [ ] 基本 CRUD 操作
- [ ] Excel 文件处理
- [ ] 模板执行
- [ ] 数据导入导出
- [ ] 跨平台兼容性

### 6.2 性能测试
- [ ] 启动时间（目标：<30秒）
- [ ] 内存使用（目标：<512MB）
- [ ] 大文件处理
- [ ] 数据库性能

### 6.3 用户体验测试
- [ ] 界面响应性
- [ ] 错误处理
- [ ] 用户引导
- [ ] 帮助文档

## 7. 部署检查清单

### 7.1 构建前检查
- [ ] 代码提交并标记版本
- [ ] 依赖版本固定
- [ ] 配置文件检查
- [ ] 测试用例通过

### 7.2 打包检查
- [ ] JAR 文件正常生成
- [ ] 前端资源完整
- [ ] Electron 配置正确
- [ ] 图标和资源文件

### 7.3 发布检查
- [ ] 安装包完整性
- [ ] 数字签名（如适用）
- [ ] 病毒扫描通过
- [ ] 用户文档准备

## 8. 常见问题解决

### 8.1 Java 环境问题
```bash
# 检查 Java 版本
java -version

# 如果没有 Java，安装 OpenJDK
# Windows: 下载 OpenJDK 安装包
# Ubuntu: sudo apt install openjdk-8-jdk
# CentOS: sudo yum install java-1.8.0-openjdk
```

### 8.2 端口冲突问题
修改 `application-offline.yml` 中的端口配置：
```yaml
server:
  port: 18081  # 改为其他端口
```

### 8.3 数据库初始化失败
删除 `data/database` 目录，重新启动应用。

## 9. 后续维护

### 9.1 版本更新机制
- 自动检查更新
- 增量更新支持
- 数据备份保护

### 9.2 日志和监控
- 应用日志收集
- 性能监控
- 错误报告

### 9.3 用户支持
- 在线帮助文档
- 常见问题解答
- 用户反馈机制