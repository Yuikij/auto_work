# Auto Work 离线版本实施指南

## 实施步骤详解

### 步骤 1: 环境准备

#### 1.1 安装必要工具
```bash
# 安装Node.js (推荐 LTS 版本)
# 下载: https://nodejs.org/

# 安装Electron开发工具
npm install -g electron
npm install -g electron-builder

# 验证Java环境 (JDK 17+)
java -version
mvn -version
```

#### 1.2 创建项目结构
```bash
mkdir auto-work-offline
cd auto-work-offline

# 创建目录结构
mkdir -p electron frontend backend build
mkdir -p build/icons

# 初始化package.json
npm init -y
```

### 步骤 2: Electron 基础框架搭建

#### 2.1 主进程文件 (electron/main.js)
```javascript
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const axios = require('axios');

class AutoWorkOffline {
    constructor() {
        this.mainWindow = null;
        this.springBootProcess = null;
        this.backendPort = null;
        this.isBackendReady = false;
    }

    async startSpringBoot() {
        return new Promise((resolve, reject) => {
            const jarPath = path.join(__dirname, '../backend/auto-work-offline.jar');
            
            if (!fs.existsSync(jarPath)) {
                reject(new Error('后端JAR文件不存在'));
                return;
            }

            // 启动Spring Boot，使用随机端口
            this.springBootProcess = spawn('java', [
                '-Xmx512m', // 限制内存使用
                '-Dspring.profiles.active=offline',
                '-Dserver.port=0', // 使用随机端口
                '-Dfile.encoding=UTF-8',
                '-jar', jarPath
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true
            });

            let startupOutput = '';

            this.springBootProcess.stdout.on('data', (data) => {
                const output = data.toString();
                startupOutput += output;
                
                // 查找端口号
                const portMatch = output.match(/Tomcat started on port\(s\): (\d+)/);
                if (portMatch) {
                    this.backendPort = parseInt(portMatch[1]);
                    this.isBackendReady = true;
                    console.log(`后端服务启动成功，端口: ${this.backendPort}`);
                    resolve(this.backendPort);
                }

                // 检查启动完成
                if (output.includes('Started OfflineApplication')) {
                    console.log('Spring Boot 应用启动完成');
                }
            });

            this.springBootProcess.stderr.on('data', (data) => {
                console.error('后端错误:', data.toString());
            });

            this.springBootProcess.on('error', (error) => {
                console.error('启动后端服务失败:', error);
                reject(error);
            });

            this.springBootProcess.on('exit', (code) => {
                console.log(`后端服务退出，代码: ${code}`);
                this.isBackendReady = false;
            });

            // 设置超时
            setTimeout(() => {
                if (!this.isBackendReady) {
                    reject(new Error('后端服务启动超时'));
                }
            }, 30000); // 30秒超时
        });
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1000,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, '../build/icons/icon.png'),
            title: 'Auto Work 离线版',
            show: false, // 先隐藏，等待后端就绪
            titleBarStyle: 'default'
        });

        // 加载加载页面
        this.mainWindow.loadFile(path.join(__dirname, '../frontend/dist/loading.html'));

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // 开发者工具 (仅在开发模式)
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }

        // 处理外部链接
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    async initializeApp() {
        try {
            // 显示启动画面
            this.createWindow();
            
            // 启动后端服务
            await this.startSpringBoot();
            
            // 等待后端完全就绪
            await this.waitForBackendReady();
            
            // 加载主应用页面
            const appUrl = `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
            await this.mainWindow.loadURL(appUrl);
            
            // 通知前端后端就绪
            this.mainWindow.webContents.send('backend-ready', {
                port: this.backendPort,
                baseUrl: `http://localhost:${this.backendPort}`
            });

        } catch (error) {
            console.error('应用初始化失败:', error);
            dialog.showErrorBox('启动失败', `应用启动失败: ${error.message}`);
            app.quit();
        }
    }

    async waitForBackendReady() {
        const maxRetries = 30;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const response = await axios.get(`http://localhost:${this.backendPort}/health`, {
                    timeout: 1000
                });
                if (response.status === 200) {
                    console.log('后端健康检查通过');
                    return;
                }
            } catch (error) {
                // 继续重试
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            retries++;
        }

        throw new Error('后端服务健康检查失败');
    }

    setupIpcHandlers() {
        // 导出数据
        ipcMain.handle('export-data', async () => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow, {
                    title: '导出Auto Work数据',
                    defaultPath: `autowork_backup_${new Date().getTime()}.awb`,
                    filters: [
                        { name: 'Auto Work备份文件', extensions: ['awb'] },
                        { name: '所有文件', extensions: ['*'] }
                    ]
                });

                if (result.canceled) {
                    return { canceled: true };
                }

                // 调用后端导出API
                const response = await axios.get(`http://localhost:${this.backendPort}/backup/export`, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                // 保存文件
                fs.writeFileSync(result.filePath, response.data);

                return { 
                    success: true, 
                    filePath: result.filePath,
                    message: '数据导出成功'
                };

            } catch (error) {
                console.error('导出数据失败:', error);
                return { 
                    success: false, 
                    error: error.message 
                };
            }
        });

        // 导入数据
        ipcMain.handle('import-data', async () => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    title: '导入Auto Work数据',
                    filters: [
                        { name: 'Auto Work备份文件', extensions: ['awb'] },
                        { name: '所有文件', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                if (result.canceled) {
                    return { canceled: true };
                }

                const filePath = result.filePaths[0];
                const fileData = fs.readFileSync(filePath);

                // 调用后端导入API
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', fileData, {
                    filename: path.basename(filePath),
                    contentType: 'application/octet-stream'
                });

                const response = await axios.post(`http://localhost:${this.backendPort}/backup/import`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 60000
                });

                return {
                    success: true,
                    message: '数据导入成功'
                };

            } catch (error) {
                console.error('导入数据失败:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // 选择文件
        ipcMain.handle('select-files', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                title: '选择Excel文件',
                filters: [
                    { name: 'Excel文件', extensions: ['xlsx', 'xls'] },
                    { name: '所有文件', extensions: ['*'] }
                ],
                properties: ['openFile', 'multiSelections']
            });

            return result;
        });

        // 获取应用信息
        ipcMain.handle('get-app-info', () => {
            return {
                version: app.getVersion(),
                name: app.getName(),
                platform: process.platform,
                arch: process.arch
            };
        });
    }

    cleanup() {
        if (this.springBootProcess) {
            console.log('正在关闭后端服务...');
            this.springBootProcess.kill('SIGTERM');
            
            // 强制终止
            setTimeout(() => {
                if (this.springBootProcess && !this.springBootProcess.killed) {
                    this.springBootProcess.kill('SIGKILL');
                }
            }, 5000);
        }
    }
}

// 应用实例
const autoWorkApp = new AutoWorkOffline();

// 应用事件处理
app.whenReady().then(() => {
    autoWorkApp.setupIpcHandlers();
    autoWorkApp.initializeApp();
});

app.on('window-all-closed', () => {
    autoWorkApp.cleanup();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        autoWorkApp.createWindow();
    }
});

app.on('before-quit', () => {
    autoWorkApp.cleanup();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    dialog.showErrorBox('应用错误', `发生未预期的错误: ${error.message}`);
});
```

#### 2.2 预加载脚本 (electron/preload.js)
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 数据导入导出
    exportData: () => ipcRenderer.invoke('export-data'),
    importData: () => ipcRenderer.invoke('import-data'),
    
    // 文件选择
    selectFiles: () => ipcRenderer.invoke('select-files'),
    
    // 应用信息
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    
    // 监听后端就绪事件
    onBackendReady: (callback) => {
        ipcRenderer.on('backend-ready', (event, data) => callback(data));
    },
    
    // 移除监听器
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// 暴露版本信息
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});
```

### 步骤 3: 后端改造

#### 3.1 Spring Boot主应用类
```java
package com.soukon.offline;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@MapperScan("com.soukon.mapper")
public class OfflineApplication {
    
    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("java.awt.headless", "true");
        System.setProperty("spring.jmx.enabled", "false");
        System.setProperty("file.encoding", "UTF-8");
        
        // 配置Spring应用
        SpringApplication app = new SpringApplication(OfflineApplication.class);
        app.setAdditionalProfiles("offline");
        
        // 禁用横幅
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        
        app.run(args);
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

#### 3.2 SQLite配置
```java
package com.soukon.offline.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.io.File;
import java.nio.file.Paths;

@Configuration
public class SQLiteConfig {
    
    @Bean
    @Primary
    public DataSource dataSource() {
        // 获取用户目录下的应用数据目录
        String userHome = System.getProperty("user.home");
        String appDataDir = Paths.get(userHome, ".autowork").toString();
        
        // 确保目录存在
        File dataDir = new File(appDataDir);
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
        
        String dbPath = Paths.get(appDataDir, "autowork.db").toString();
        
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:sqlite:" + dbPath);
        dataSource.setDriverClassName("org.sqlite.JDBC");
        
        // SQLite 特定配置
        dataSource.setMaximumPoolSize(1); // SQLite 不支持多连接
        dataSource.setConnectionTestQuery("SELECT 1");
        dataSource.setValidationTimeout(3000);
        
        return dataSource;
    }
}
```

#### 3.3 数据库初始化
```java
package com.soukon.offline.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        try {
            // 检查表是否存在
            String checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='template'";
            
            if (jdbcTemplate.queryForList(checkTableSql).isEmpty()) {
                log.info("初始化数据库表...");
                executeSqlScript("db/sqlite-schema.sql");
                log.info("数据库表初始化完成");
            } else {
                log.info("数据库表已存在，跳过初始化");
            }
            
        } catch (Exception e) {
            log.error("数据库初始化失败", e);
            throw e;
        }
    }
    
    private void executeSqlScript(String scriptPath) throws Exception {
        ClassPathResource resource = new ClassPathResource(scriptPath);
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            
            StringBuilder sqlBuilder = new StringBuilder();
            String line;
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                // 跳过注释和空行
                if (line.isEmpty() || line.startsWith("--")) {
                    continue;
                }
                
                sqlBuilder.append(line).append(" ");
                
                // 执行SQL语句
                if (line.endsWith(";")) {
                    String sql = sqlBuilder.toString().trim();
                    if (!sql.isEmpty()) {
                        jdbcTemplate.execute(sql);
                    }
                    sqlBuilder.setLength(0);
                }
            }
        }
    }
}
```

#### 3.4 健康检查端点
```java
package com.soukon.offline.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("timestamp", System.currentTimeMillis());
        result.put("version", "1.0.0");
        return result;
    }
}
```

### 步骤 4: 前端改造 (Vue.js)

#### 4.1 项目结构搭建
```bash
cd frontend
npm init vue@latest .

# 选择配置
# ✔ Add TypeScript? No
# ✔ Add JSX Support? No
# ✔ Add Vue Router for Single Page Application development? Yes
# ✔ Add Pinia for state management? Yes
# ✔ Add Vitest for Unit Testing? No
# ✔ Add an End-to-End Testing Solution? No
# ✔ Add ESLint for code quality? Yes

npm install
npm install element-plus @element-plus/icons-vue axios
```

#### 4.2 主应用组件
```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <el-config-provider :locale="zhCn">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { useAppStore } from './stores/app';

const appStore = useAppStore();

onMounted(() => {
  // 监听后端就绪事件
  window.electronAPI?.onBackendReady((data) => {
    console.log('后端就绪:', data);
    appStore.setBackendInfo(data);
  });
});
</script>

<style>
#app {
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
```

#### 4.3 主页面组件
```vue
<!-- src/views/Home.vue -->
<template>
  <el-container class="home-container">
    <!-- 顶部工具栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1>Auto Work 离线版</h1>
        <el-tag size="small" type="success">v{{ appInfo.version }}</el-tag>
      </div>
      
      <div class="header-right">
        <el-button-group>
          <el-button @click="handleImport" :icon="Upload">
            导入数据
          </el-button>
          <el-button @click="handleExport" :icon="Download">
            导出数据
          </el-button>
        </el-button-group>
      </div>
    </el-header>
    
    <!-- 主体内容 -->
    <el-container>
      <el-aside width="350px" class="sidebar">
        <el-tabs v-model="activeTab" class="sidebar-tabs">
          <el-tab-pane label="模板管理" name="templates">
            <template-list 
              :templates="templates" 
              @select="selectTemplate"
              @refresh="loadTemplates"
            />
          </el-tab-pane>
          
          <el-tab-pane label="文件配置" name="files">
            <file-list 
              :files="files"
              :template-id="selectedTemplateId"
              @refresh="loadFiles"
            />
          </el-tab-pane>
        </el-tabs>
      </el-aside>
      
      <el-main class="main-content">
        <template-workspace 
          v-if="selectedTemplate"
          :template="selectedTemplate"
          :data-cells="dataCells"
          @execute="executeTemplate"
          @refresh="loadDataCells"
        />
        
        <el-empty 
          v-else
          description="请选择一个模板开始工作"
          :image-size="200"
        />
      </el-main>
    </el-container>
    
    <!-- 加载遮罩 -->
    <el-loading-service 
      v-if="loading" 
      text="处理中..." 
      background="rgba(0, 0, 0, 0.7)"
    />
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download } from '@element-plus/icons-vue';
import { useAppStore } from '../stores/app';
import { useTemplateStore } from '../stores/template';
import TemplateList from '../components/TemplateList.vue';
import FileList from '../components/FileList.vue';
import TemplateWorkspace from '../components/TemplateWorkspace.vue';

const appStore = useAppStore();
const templateStore = useTemplateStore();

const activeTab = ref('templates');
const loading = ref(false);

// 计算属性
const appInfo = computed(() => appStore.appInfo);
const templates = computed(() => templateStore.templates);
const selectedTemplate = computed(() => templateStore.selectedTemplate);
const selectedTemplateId = computed(() => templateStore.selectedTemplate?.id);
const dataCells = computed(() => templateStore.dataCells);
const files = computed(() => templateStore.files);

// 选择模板
const selectTemplate = async (template) => {
  await templateStore.selectTemplate(template);
  await loadDataCells();
  await loadFiles();
};

// 加载数据
const loadTemplates = () => templateStore.loadTemplates();
const loadDataCells = () => templateStore.loadDataCells();
const loadFiles = () => templateStore.loadFiles();

// 执行模板
const executeTemplate = async (params) => {
  try {
    loading.value = true;
    const result = await templateStore.executeTemplate(params);
    ElMessage.success('模板执行成功');
    await loadDataCells(); // 刷新结果
  } catch (error) {
    ElMessage.error('执行失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 导出数据
const handleExport = async () => {
  try {
    loading.value = true;
    const result = await window.electronAPI.exportData();
    
    if (result.canceled) {
      return;
    }
    
    if (result.success) {
      ElMessage.success(`数据导出成功: ${result.filePath}`);
    } else {
      ElMessage.error('导出失败: ' + result.error);
    }
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 导入数据
const handleImport = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      '导入数据将覆盖当前所有数据，是否继续？',
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    if (confirmResult !== 'confirm') {
      return;
    }
    
    loading.value = true;
    const result = await window.electronAPI.importData();
    
    if (result.canceled) {
      return;
    }
    
    if (result.success) {
      ElMessage.success('数据导入成功');
      // 重新加载所有数据
      await loadTemplates();
      templateStore.clearSelection();
    } else {
      ElMessage.error('导入失败: ' + result.error);
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导入失败: ' + error.message);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 加载应用信息
  const info = await window.electronAPI.getAppInfo();
  appStore.setAppInfo(info);
  
  // 加载初始数据
  await loadTemplates();
});
</script>

<style scoped>
.home-container {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.sidebar {
  background: #f5f5f5;
  border-right: 1px solid #e6e6e6;
}

.sidebar-tabs {
  height: 100%;
}

.sidebar-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.main-content {
  background: #fff;
  padding: 20px;
}
</style>
```

### 步骤 5: 构建和打包

#### 5.1 构建脚本配置
```json
{
  "name": "auto-work-offline",
  "version": "1.0.0",
  "description": "Auto Work 离线版本",
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" \"wait-on http://localhost:3000 && electron .\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=offline",
    
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && mvn clean package -DskipTests -Poffline",
    
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    
    "postinstall": "electron-builder install-app-deps"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "electron": "^25.3.0",
    "electron-builder": "^24.4.0",
    "wait-on": "^7.0.1"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "form-data": "^4.0.0"
  }
}
```

#### 5.2 Electron Builder配置
```yaml
# electron-builder.yml
appId: com.soukon.autowork.offline
productName: Auto Work 离线版
copyright: Copyright © 2024 Soukon

directories:
  output: dist
  buildResources: build

files:
  - "frontend/dist/**/*"
  - "backend/target/auto-work-offline.jar"
  - "electron/**/*"
  - "package.json"
  - "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
  - "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}"
  - "!**/node_modules/*.d.ts"
  - "!**/node_modules/.bin"
  - "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
  - "!.editorconfig"
  - "!**/._*"
  - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"
  - "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}"
  - "!**/{appveyor.yml,.travis.yml,circle.yml}"
  - "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"

extraResources:
  - from: "build/icons"
    to: "icons"

win:
  target:
    - target: nsis
      arch: [x64]
  icon: build/icons/icon.ico
  artifactName: "AutoWork-Offline-Setup-${version}.exe"
  requestedExecutionLevel: asInvoker

nsis:
  oneClick: false
  allowElevation: true
  allowToChangeInstallationDirectory: true
  installerIcon: build/icons/icon.ico
  uninstallerIcon: build/icons/icon.ico
  installerHeaderIcon: build/icons/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "Auto Work 离线版"
  include: build/installer.nsh

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icons/icon.icns
  category: public.app-category.productivity
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

linux:
  target:
    - target: AppImage
      arch: [x64]
  icon: build/icons/icon.png
  category: Office
  synopsis: "Excel数据自动化处理工具"
  description: "一个功能强大的Excel数据处理和计算工具"

publish:
  provider: generic
  url: "https://your-domain.com/releases/"
```

### 步骤 6: 测试和部署

#### 6.1 开发环境测试
```bash
# 安装依赖
npm install
cd frontend && npm install && cd ..
cd backend && mvn dependency:resolve && cd ..

# 启动开发模式
npm run dev

# 构建测试
npm run build
npm run pack
```

#### 6.2 生产构建
```bash
# 构建所有平台
npm run dist

# 构建特定平台
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

这个实施指南提供了完整的步骤和代码示例，帮助您将Auto Work改造为离线版本。主要改进包括：

1. **完整的Electron集成** - 包含主进程、预加载脚本和IPC通信
2. **后端服务嵌入** - Spring Boot作为子进程运行
3. **SQLite数据库** - 替代MySQL，支持离线存储
4. **Vue.js前端** - 现代化的响应式界面
5. **数据导入导出** - 完整的备份和恢复功能
6. **跨平台打包** - 支持Windows、macOS和Linux

按照这个指南，您可以创建一个功能完整的离线版Auto Work应用。 