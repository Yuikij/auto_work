# Auto Work 离线版本改造设计文档

## 概述

将Auto Work改造为离线版本，打包成单一可执行文件（.exe），支持本地数据存储、无需登录、全量数据导入导出功能。

## 改造目标

### 核心目标
- ✅ 单一可执行文件，无需安装
- ✅ 本地数据存储，无需外部数据库
- ✅ 去除登录认证系统
- ✅ 支持完整的数据和模板导入导出
- ✅ 保持原有的Excel处理和计算功能

### 技术目标
- 使用Electron框架打包前后端
- 使用SQLite替代MySQL
- 去除Redis和Nacos依赖
- 简化架构，提高启动速度

## 技术架构设计

### 整体架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                    Auto Work 离线版 (.exe)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Electron      │    │   Spring Boot   │    │   SQLite    │  │
│  │   Main Process  │    │   Embedded      │    │   Database  │  │
│  │                 │    │                 │    │             │  │
│  │ • 窗口管理       │◄──►│ • REST API      │◄──►│ • 本地存储   │  │
│  │ • 进程通信       │    │ • 文件处理      │    │ • 数据持久化 │  │
│  │ • 文件操作       │    │ • 计算引擎      │    │ • 事务支持   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                      │      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │ Renderer Process│    │     Vue.js      │    │  本地文件    │  │
│  │                 │    │    Frontend     │    │             │  │
│  │ • UI界面        │◄──►│ • 组件化界面    │◄──►│ • 模板文件   │  │
│  │ • 用户交互       │    │ • 状态管理      │    │ • 数据备份   │  │
│  │ • 渲染页面       │    │ • 本地化存储    │    │ • 配置文件   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈选型

#### 前端技术栈
- **主框架**: Electron (跨平台桌面应用)
- **UI框架**: Vue.js 3 + Element Plus (替代React，更轻量)
- **状态管理**: Pinia
- **构建工具**: Vite
- **打包工具**: Electron Builder

#### 后端技术栈
- **框架**: Spring Boot (嵌入式运行)
- **数据库**: SQLite (嵌入式数据库)
- **ORM**: MyBatis Plus (保持不变)
- **文件处理**: EasyExcel + Apache POI (保持不变)
- **脚本引擎**: Groovy (保持不变)

## 详细改造方案

### 1. 项目结构重组

```
auto_work_offline/
├── electron/                    # Electron主进程
│   ├── main.js                 # 主进程入口
│   ├── preload.js              # 预加载脚本
│   └── utils/                  # 工具类
├── frontend/                   # 前端代码 (Vue.js)
│   ├── src/
│   │   ├── components/         # 组件
│   │   ├── views/              # 页面
│   │   ├── store/              # 状态管理
│   │   └── utils/              # 工具函数
│   ├── package.json
│   └── vite.config.js
├── backend/                    # 后端代码 (Spring Boot)
│   ├── src/main/java/
│   │   └── com/soukon/
│   │       ├── controller/     # 控制器
│   │       ├── service/        # 服务层
│   │       ├── domain/         # 实体类
│   │       └── config/         # 配置类
│   ├── src/main/resources/
│   │   ├── application.yml     # 配置文件
│   │   └── db/migration/       # 数据库初始化脚本
│   └── pom.xml
├── package.json                # Electron配置
├── electron-builder.yml        # 打包配置
└── build/                      # 构建产物
```

### 2. 核心改造点

#### 2.1 去除认证系统
```java
// 移除的组件
- soukon_common_auth 模块
- JWT相关过滤器
- Spring Security配置
- 用户登录/登出功能

// 简化的控制器
@RestController
public class AutoWorkController {
    // 直接访问，无需认证
    @PostMapping("/template/add")
    public ApiResponse<Object> templateAdd(@RequestBody Template template) {
        // 直接处理，无需用户验证
        return templateService.templateAdd(template);
    }
}
```

#### 2.2 SQLite数据库集成
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:sqlite:${user.home}/.autowork/data.db
    driver-class-name: org.sqlite.JDBC
    # 移除连接池配置，SQLite不需要
  
  jpa:
    database-platform: org.hibernate.dialect.SQLiteDialect
    hibernate:
      ddl-auto: update
```

```java
// SQLite配置类
@Configuration
public class SQLiteConfig {
    
    @Bean
    public DataSource dataSource() {
        String dbPath = System.getProperty("user.home") + "/.autowork/data.db";
        
        // 确保目录存在
        File dbFile = new File(dbPath);
        dbFile.getParentFile().mkdirs();
        
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:sqlite:" + dbPath);
        dataSource.setDriverClassName("org.sqlite.JDBC");
        return dataSource;
    }
}
```

#### 2.3 Electron主进程配置
```javascript
// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let springBootProcess;

// 启动Spring Boot后端
function startSpringBoot() {
    const jarPath = path.join(__dirname, '../backend/auto-work-offline.jar');
    springBootProcess = spawn('java', ['-jar', jarPath, '--server.port=0'], {
        stdio: 'pipe'
    });
    
    springBootProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // 解析动态端口号
        const portMatch = output.match(/Tomcat started on port\(s\): (\d+)/);
        if (portMatch) {
            const port = portMatch[1];
            // 通知渲染进程后端端口
            mainWindow.webContents.send('backend-ready', { port });
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        show: false // 等待后端启动后再显示
    });

    // 加载前端页面
    mainWindow.loadFile('../frontend/dist/index.html');
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    startSpringBoot();
    createWindow();
});

// 文件操作API
ipcMain.handle('export-data', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Auto Work Backup', extensions: ['awb'] }]
    });
    
    if (!result.canceled) {
        // 调用后端导出API
        return await exportAllData(result.filePath);
    }
});

ipcMain.handle('import-data', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Auto Work Backup', extensions: ['awb'] }]
    });
    
    if (!result.canceled) {
        return await importAllData(result.filePaths[0]);
    }
});

app.on('before-quit', () => {
    if (springBootProcess) {
        springBootProcess.kill();
    }
});
```

#### 2.4 前端架构改造 (Vue.js)
```vue
<!-- src/views/Template.vue -->
<template>
  <div class="template-container">
    <el-container>
      <el-header>
        <h1>Auto Work 离线版</h1>
        <div class="actions">
          <el-button @click="exportData" type="primary">导出数据</el-button>
          <el-button @click="importData">导入数据</el-button>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="300px">
          <template-list :templates="templates" @select="selectTemplate" />
          <file-list :files="files" />
        </el-aside>
        
        <el-main>
          <data-cell-manager 
            v-if="selectedTemplate"
            :template="selectedTemplate"
            :data-cells="dataCells"
            @execute="executeTemplate"
          />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTemplateStore } from '../store/template';

const templateStore = useTemplateStore();
const templates = ref([]);
const selectedTemplate = ref(null);
const dataCells = ref([]);

// 导出数据
const exportData = async () => {
  try {
    const result = await window.electronAPI.exportData();
    if (result.success) {
      ElMessage.success('数据导出成功');
    }
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message);
  }
};

// 导入数据
const importData = async () => {
  try {
    const result = await window.electronAPI.importData();
    if (result.success) {
      ElMessage.success('数据导入成功');
      await loadTemplates(); // 重新加载数据
    }
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message);
  }
};

onMounted(() => {
  loadTemplates();
});
</script>
```

```javascript
// src/store/template.js
import { defineStore } from 'pinia';
import { request } from '../utils/request';

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [],
    currentTemplate: null,
    dataCells: []
  }),
  
  actions: {
    async loadTemplates() {
      const response = await request.post('/template/list', { type: 2 });
      this.templates = response.data.list;
    },
    
    async executeTemplate(templateId, files, params) {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('templateId', templateId);
      formData.append('params', JSON.stringify(params));
      
      const response = await request.post('/template/execute', formData);
      return response.data;
    }
  }
});
```

### 3. 数据导入导出功能

#### 3.1 后端导入导出API
```java
@RestController
@RequestMapping("/backup")
public class BackupController {
    
    @Autowired
    private BackupService backupService;
    
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportAllData() {
        try {
            byte[] backupData = backupService.exportAllData();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", 
                "autowork_backup_" + System.currentTimeMillis() + ".awb");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(backupData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/import")
    public ApiResponse<String> importAllData(@RequestParam("file") MultipartFile file) {
        try {
            backupService.importAllData(file.getInputStream());
            return ApiResponse.success("数据导入成功");
        } catch (Exception e) {
            return ApiResponse.error("导入失败: " + e.getMessage());
        }
    }
}
```

```java
@Service
public class BackupService {
    
    @Autowired
    private TemplateService templateService;
    
    @Autowired
    private DataCellService dataCellService;
    
    @Autowired
    private FileService fileService;
    
    public byte[] exportAllData() throws Exception {
        BackupData backupData = new BackupData();
        
        // 导出所有模板
        backupData.setTemplates(templateService.list());
        
        // 导出所有数据单元格
        backupData.setDataCells(dataCellService.list());
        
        // 导出所有文件配置
        backupData.setFiles(fileService.list());
        
        // 序列化为JSON
        String json = JSONObject.toJSONString(backupData);
        
        // 压缩
        return compress(json.getBytes(StandardCharsets.UTF_8));
    }
    
    @Transactional
    public void importAllData(InputStream inputStream) throws Exception {
        // 解压缩
        byte[] decompressed = decompress(inputStream.readAllBytes());
        String json = new String(decompressed, StandardCharsets.UTF_8);
        
        // 反序列化
        BackupData backupData = JSONObject.parseObject(json, BackupData.class);
        
        // 清空现有数据
        dataCellService.remove(new QueryWrapper<>());
        fileService.remove(new QueryWrapper<>());
        templateService.remove(new QueryWrapper<>());
        
        // 导入数据
        if (backupData.getTemplates() != null) {
            templateService.saveBatch(backupData.getTemplates());
        }
        
        if (backupData.getFiles() != null) {
            fileService.saveBatch(backupData.getFiles());
        }
        
        if (backupData.getDataCells() != null) {
            dataCellService.saveBatch(backupData.getDataCells());
        }
    }
    
    private byte[] compress(byte[] data) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(out)) {
            gzip.write(data);
        }
        return out.toByteArray();
    }
    
    private byte[] decompress(byte[] compressed) throws IOException {
        ByteArrayInputStream in = new ByteArrayInputStream(compressed);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        try (GZIPInputStream gzip = new GZIPInputStream(in)) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzip.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
        }
        return out.toByteArray();
    }
}

@Data
class BackupData {
    private List<Template> templates;
    private List<DataCell> dataCells;
    private List<Files> files;
    private String version = "1.0";
    private long timestamp = System.currentTimeMillis();
}
```

### 4. 构建和打包配置

#### 4.1 Electron Builder配置
```yaml
# electron-builder.yml
appId: com.soukon.autowork.offline
productName: Auto Work 离线版
directories:
  output: dist
  buildResources: build

files:
  - "frontend/dist/**/*"
  - "backend/auto-work-offline.jar"
  - "electron/**/*"
  - "!**/{.git,node_modules,src,*.md}*"

win:
  target:
    - target: nsis
      arch: [x64]
  icon: build/icon.ico
  artifactName: "AutoWork-Offline-Setup-${version}.exe"

nsis:
  oneClick: false
  allowElevation: true
  allowToChangeInstallationDirectory: true
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.productivity

linux:
  target:
    - target: AppImage
      arch: [x64]
  icon: build/icon.png
  category: Office
```

#### 4.2 构建脚本
```json
{
  "name": "auto-work-offline",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && mvn spring-boot:run",
    "build": "npm run build:frontend && npm run build:backend && npm run build:electron",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && mvn clean package -DskipTests",
    "build:electron": "electron-builder",
    "dist": "npm run build && npm run build:electron"
  },
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0",
    "concurrently": "^8.0.0"
  },
  "dependencies": {
    "axios": "^1.4.0"
  }
}
```

### 5. 性能优化

#### 5.1 启动优化
```java
@SpringBootApplication
@EnableAutoConfiguration(exclude = {
    // 排除不需要的自动配置
    SecurityAutoConfiguration.class,
    UserDetailsServiceAutoConfiguration.class,
    DataSourceAutoConfiguration.class // 使用自定义SQLite配置
})
public class OfflineApplication {
    public static void main(String[] args) {
        // 设置headless模式
        System.setProperty("java.awt.headless", "true");
        
        // 优化启动参数
        System.setProperty("spring.jmx.enabled", "false");
        System.setProperty("spring.banner.mode", "off");
        
        SpringApplication app = new SpringApplication(OfflineApplication.class);
        app.setWebApplicationType(WebApplicationType.SERVLET);
        app.run(args);
    }
}
```

#### 5.2 内存优化
```javascript
// electron/main.js
const mainWindow = new BrowserWindow({
    webPreferences: {
        // 节省内存
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
        // 预加载优化
        preload: path.join(__dirname, 'preload.js')
    },
    // 窗口配置优化
    show: false,
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: true
});
```

### 6. 兼容性处理

#### 6.1 SQLite适配
```sql
-- 创建SQLite兼容的表结构
-- scripts/sqlite-schema.sql

CREATE TABLE IF NOT EXISTS template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    type INTEGER,
    file_template_id INTEGER,
    data_template_id INTEGER,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    parent_id INTEGER,
    template_id INTEGER,
    name TEXT,
    type INTEGER,
    zip_type INTEGER,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_cell (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    source_id INTEGER,
    row_index INTEGER,
    column_index INTEGER,
    sheet TEXT,
    select_index INTEGER,
    script TEXT, -- SQLite使用TEXT存储JSON
    start_index INTEGER,
    end_index INTEGER,
    res INTEGER DEFAULT 0,
    template_id INTEGER,
    specific_value TEXT, -- JSON字符串
    param_name TEXT,
    type INTEGER,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6.2 跨平台兼容
```javascript
// electron/utils/platform.js
const os = require('os');
const path = require('path');

class PlatformUtils {
    static getDataDir() {
        const platform = os.platform();
        const homeDir = os.homedir();
        
        switch (platform) {
            case 'win32':
                return path.join(homeDir, 'AppData', 'Local', 'AutoWork');
            case 'darwin':
                return path.join(homeDir, 'Library', 'Application Support', 'AutoWork');
            case 'linux':
                return path.join(homeDir, '.autowork');
            default:
                return path.join(homeDir, '.autowork');
        }
    }
    
    static getTempDir() {
        return path.join(this.getDataDir(), 'temp');
    }
}

module.exports = PlatformUtils;
```

## 实施计划

### 阶段一：基础架构搭建 (2周)
1. 搭建Electron项目结构
2. 集成Spring Boot嵌入式运行
3. 配置SQLite数据库
4. 实现基础的前后端通信

### 阶段二：功能迁移 (3周)
1. 迁移核心业务逻辑
2. 去除认证系统
3. 适配SQLite数据库
4. 重构前端为Vue.js

### 阶段三：导入导出功能 (1周)
1. 实现数据导出功能
2. 实现数据导入功能
3. 数据备份压缩优化

### 阶段四：测试和优化 (2周)
1. 功能测试
2. 性能优化
3. 跨平台测试
4. 打包配置优化

### 阶段五：发布准备 (1周)
1. 最终测试
2. 文档完善
3. 安装包制作
4. 发布准备

## 预期效果

### 用户体验
- 📦 单文件部署，下载即用
- 🚀 快速启动，3秒内可用
- 💾 数据本地存储，安全可控
- 🔄 完整的导入导出功能
- 🖥️ 跨平台支持 (Windows/Mac/Linux)

### 技术优势
- 🏗️ 架构简化，维护容易
- 🎯 功能专注，性能更好
- 🔒 数据安全，完全离线
- 🛠️ 易于扩展和定制

## 风险评估

### 技术风险
- **中等风险**: SQLite性能限制，大量数据时可能较慢
- **低风险**: Electron打包体积较大 (约100-200MB)
- **低风险**: 跨平台兼容性问题

### 缓解方案
- 对大数据量进行分页处理
- 使用压缩和优化减少打包体积
- 充分的跨平台测试

这个改造方案将保持Auto Work的核心功能，同时提供更好的离线使用体验。 