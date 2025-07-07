# Auto Work 离线版本改造文档

## 项目概述

Auto Work 系统当前是基于微服务架构的在线版本，包含认证、配置中心、远程数据库等组件。本文档将详细说明如何将其改造为无需登录、本地数据存储、支持导入导出的离线可执行版本。

## 改造目标

- ✅ 打包成单一 `.exe` 可执行文件
- ✅ 移除用户认证和登录机制
- ✅ 使用本地SQLite数据库替换MySQL
- ✅ 移除Redis和Nacos依赖
- ✅ 实现全量数据和模板的导入导出功能
- ✅ 嵌入式Web服务，自动打开浏览器

## 技术架构调整

### 原架构 vs 离线架构对比

| 组件 | 原架构 | 离线架构 | 改造说明 |
|------|--------|----------|----------|
| 前端 | React独立部署 | 嵌入到后端资源 | 构建后打包到Spring Boot |
| 后端 | 微服务 + Nacos | 单体应用 | 移除微服务依赖 |
| 数据库 | MySQL | SQLite | 嵌入式数据库 |
| 缓存 | Redis | 内存缓存 | 使用Spring Boot Cache |
| 认证 | JWT + Spring Security | 无认证 | 完全移除认证模块 |
| 打包 | 分别部署 | GraalVM Native或Java + Launch4j | 单一可执行文件 |

## 详细改造步骤

### 第一阶段：依赖清理和配置调整

#### 1.1 移除微服务依赖

**修改 `soukon-auto-work/pom.xml`**：

```xml
<!-- 移除以下依赖 -->
<!-- 
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>com.soukon</groupId>
    <artifactId>soukon_common_redis</artifactId>
    <version>1.0</version>
</dependency>
<dependency>
    <groupId>com.soukon</groupId>
    <artifactId>soukon_common_auth</artifactId>
    <version>1.0</version>
</dependency>
-->

<!-- 添加SQLite和缓存依赖 -->
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.43.0.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>

<!-- 用于打包exe文件 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

#### 1.2 配置文件简化

**新建 `application-offline.yml`**：

```yaml
server:
  port: 9915
  
spring:
  application:
    name: auto-work-offline
  profiles:
    active: offline
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
  
  # SQLite数据库配置
  datasource:
    driver-class-name: org.sqlite.JDBC
    url: jdbc:sqlite:./data/auto_work.db
    username: 
    password: 
    
  # JPA配置自动创建表
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.community.dialect.SQLiteDialect
        
  # 缓存配置
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=1h

# 静态资源配置（嵌入前端）
  web:
    resources:
      static-locations: classpath:/static/

logging:
  level:
    com.soukon: info
  file:
    name: ./logs/auto-work.log

# 应用信息
info:
  app:
    name: Auto Work 离线版
    version: 1.0.0-offline
    description: 自动化数据处理工作流系统（离线版）
```

### 第二阶段：认证模块移除

#### 2.1 创建离线版安全配置

**新建 `OfflineSecurityConfig.java`**：

```java
package com.soukon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@Profile("offline")
public class OfflineSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
```

#### 2.2 移除认证相关Controller方法

修改所有Controller，移除认证检查和用户相关逻辑。

### 第三阶段：数据库迁移到SQLite

#### 3.1 SQLite方言配置

**新建 `SQLiteDialect.java`**：

```java
package com.soukon.config;

import org.hibernate.community.dialect.SQLiteDialect;
import org.hibernate.dialect.function.StandardSQLFunction;
import org.hibernate.type.StandardBasicTypes;

public class CustomSQLiteDialect extends SQLiteDialect {
    
    public CustomSQLiteDialect() {
        super();
        registerFunction("group_concat", new StandardSQLFunction("group_concat", StandardBasicTypes.STRING));
    }
}
```

#### 3.2 数据库初始化配置

**新建 `DatabaseInitializer.java`**：

```java
package com.soukon.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
@Profile("offline")
public class DatabaseInitializer implements CommandLineRunner {
    
    private final JdbcTemplate jdbcTemplate;
    
    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Override
    public void run(String... args) throws Exception {
        // 确保数据目录存在
        new File("./data").mkdirs();
        
        // 初始化基础数据
        initializeBasicData();
    }
    
    private void initializeBasicData() {
        // 可以在这里插入一些初始化数据
        // 例如默认模板等
    }
}
```

### 第四阶段：数据导入导出功能

#### 4.1 创建数据导入导出服务

**新建 `DataExportImportService.java`**：

```java
package com.soukon.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.soukon.domain.DataCell;
import com.soukon.domain.Template;
import com.soukon.domain.Files;
import com.soukon.mapper.DataCellMapper;
import com.soukon.mapper.TemplateMapper;
import com.soukon.mapper.FilesMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
@Slf4j
public class DataExportImportService {

    @Autowired
    private TemplateMapper templateMapper;
    @Autowired
    private DataCellMapper dataCellMapper;
    @Autowired
    private FilesMapper filesMapper;

    /**
     * 导出全量数据
     */
    public byte[] exportAllData() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            
            // 导出模板数据
            List<Template> templates = templateMapper.selectList(null);
            addToZip(zos, "templates.json", JSON.toJSONString(templates));
            
            // 导出数据单元格
            List<DataCell> dataCells = dataCellMapper.selectList(null);
            addToZip(zos, "data_cells.json", JSON.toJSONString(dataCells));
            
            // 导出文件信息
            List<Files> files = filesMapper.selectList(null);
            addToZip(zos, "files.json", JSON.toJSONString(files));
            
            // 添加元数据
            ExportMetadata metadata = new ExportMetadata();
            metadata.setExportTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            metadata.setVersion("1.0.0");
            metadata.setTemplateCount(templates.size());
            metadata.setDataCellCount(dataCells.size());
            metadata.setFileCount(files.size());
            addToZip(zos, "metadata.json", JSON.toJSONString(metadata));
        }
        
        return baos.toByteArray();
    }

    /**
     * 导入全量数据
     */
    public void importAllData(MultipartFile file) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            Map<String, String> fileContents = new HashMap<>();
            
            // 读取所有文件内容
            while ((entry = zis.getNextEntry()) != null) {
                String content = readZipEntryContent(zis);
                fileContents.put(entry.getName(), content);
            }
            
            // 验证数据完整性
            validateImportData(fileContents);
            
            // 清空现有数据（可选，或者提供覆盖选项）
            clearExistingData();
            
            // 导入数据
            importTemplates(fileContents.get("templates.json"));
            importDataCells(fileContents.get("data_cells.json"));
            importFiles(fileContents.get("files.json"));
            
            log.info("数据导入完成");
        }
    }

    /**
     * 导出指定模板
     */
    public byte[] exportTemplate(Long templateId) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            
            // 导出模板
            Template template = templateMapper.selectById(templateId);
            if (template == null) {
                throw new IllegalArgumentException("模板不存在: " + templateId);
            }
            addToZip(zos, "template.json", JSON.toJSONString(template));
            
            // 导出相关数据单元格
            List<DataCell> dataCells = dataCellMapper.selectList(
                Wrappers.lambdaQuery(DataCell.class).eq(DataCell::getTemplateId, templateId)
            );
            addToZip(zos, "data_cells.json", JSON.toJSONString(dataCells));
            
            // 导出相关文件
            List<Files> files = filesMapper.selectList(
                Wrappers.lambdaQuery(Files.class).eq(Files::getTemplateId, templateId)
            );
            addToZip(zos, "files.json", JSON.toJSONString(files));
            
            // 模板元数据
            TemplateExportMetadata metadata = new TemplateExportMetadata();
            metadata.setTemplateId(templateId);
            metadata.setTemplateName(template.getName());
            metadata.setExportTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            metadata.setDataCellCount(dataCells.size());
            metadata.setFileCount(files.size());
            addToZip(zos, "template_metadata.json", JSON.toJSONString(metadata));
        }
        
        return baos.toByteArray();
    }

    /**
     * 导入模板
     */
    public void importTemplate(MultipartFile file) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            Map<String, String> fileContents = new HashMap<>();
            
            while ((entry = zis.getNextEntry()) != null) {
                String content = readZipEntryContent(zis);
                fileContents.put(entry.getName(), content);
            }
            
            // 导入模板数据
            if (fileContents.containsKey("template.json")) {
                Template template = JSON.parseObject(fileContents.get("template.json"), Template.class);
                template.setId(null); // 重新生成ID
                templateMapper.insert(template);
                Long newTemplateId = template.getId();
                
                // 导入数据单元格
                if (fileContents.containsKey("data_cells.json")) {
                    List<DataCell> dataCells = JSON.parseArray(fileContents.get("data_cells.json"), DataCell.class);
                    dataCells.forEach(dc -> {
                        dc.setId(null);
                        dc.setTemplateId(newTemplateId);
                        dataCellMapper.insert(dc);
                    });
                }
                
                // 导入文件信息
                if (fileContents.containsKey("files.json")) {
                    List<Files> files = JSON.parseArray(fileContents.get("files.json"), Files.class);
                    files.forEach(f -> {
                        f.setId(null);
                        f.setTemplateId(newTemplateId);
                        filesMapper.insert(f);
                    });
                }
            }
            
            log.info("模板导入完成");
        }
    }

    // 辅助方法
    private void addToZip(ZipOutputStream zos, String fileName, String content) throws IOException {
        ZipEntry zipEntry = new ZipEntry(fileName);
        zos.putNextEntry(zipEntry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private String readZipEntryContent(ZipInputStream zis) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int len;
        while ((len = zis.read(buffer)) > 0) {
            baos.write(buffer, 0, len);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

    private void validateImportData(Map<String, String> fileContents) {
        if (!fileContents.containsKey("metadata.json")) {
            throw new IllegalArgumentException("缺少元数据文件");
        }
        // 更多验证逻辑...
    }

    private void clearExistingData() {
        dataCellMapper.delete(null);
        filesMapper.delete(null);
        templateMapper.delete(null);
    }

    private void importTemplates(String jsonContent) {
        if (jsonContent != null) {
            List<Template> templates = JSON.parseArray(jsonContent, Template.class);
            templates.forEach(template -> {
                template.setId(null); // 重新生成ID
                templateMapper.insert(template);
            });
        }
    }

    private void importDataCells(String jsonContent) {
        if (jsonContent != null) {
            List<DataCell> dataCells = JSON.parseArray(jsonContent, DataCell.class);
            dataCells.forEach(dataCell -> {
                dataCell.setId(null);
                dataCellMapper.insert(dataCell);
            });
        }
    }

    private void importFiles(String jsonContent) {
        if (jsonContent != null) {
            List<Files> files = JSON.parseArray(jsonContent, Files.class);
            files.forEach(file -> {
                file.setId(null);
                filesMapper.insert(file);
            });
        }
    }

    @Data
    @AllArgsConstructor
    public static class ExportMetadata {
        private String exportTime;
        private String version;
        private int templateCount;
        private int dataCellCount;
        private int fileCount;
        
        public ExportMetadata() {}
    }

    @Data
    @AllArgsConstructor
    public static class TemplateExportMetadata {
        private Long templateId;
        private String templateName;
        private String exportTime;
        private int dataCellCount;
        private int fileCount;
        
        public TemplateExportMetadata() {}
    }
}
```

#### 4.2 创建导入导出Controller

**新建 `DataExportImportController.java`**：

```java
package com.soukon.controller;

import com.soukon.core.http.ApiResponse;
import com.soukon.service.DataExportImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/export-import")
public class DataExportImportController {

    @Autowired
    private DataExportImportService exportImportService;

    /**
     * 导出全量数据
     */
    @GetMapping("/export/all")
    public ResponseEntity<ByteArrayResource> exportAllData() {
        try {
            byte[] data = exportImportService.exportAllData();
            String filename = "auto_work_full_export_" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".zip";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new ByteArrayResource(data));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 导入全量数据
     */
    @PostMapping("/import/all")
    public ApiResponse<String> importAllData(@RequestParam("file") MultipartFile file) {
        try {
            exportImportService.importAllData(file);
            return ApiResponse.success("数据导入成功");
        } catch (Exception e) {
            return ApiResponse.error("数据导入失败: " + e.getMessage());
        }
    }

    /**
     * 导出指定模板
     */
    @GetMapping("/export/template/{templateId}")
    public ResponseEntity<ByteArrayResource> exportTemplate(@PathVariable Long templateId) {
        try {
            byte[] data = exportImportService.exportTemplate(templateId);
            String filename = "template_" + templateId + "_export_" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".zip";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new ByteArrayResource(data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 导入模板
     */
    @PostMapping("/import/template")
    public ApiResponse<String> importTemplate(@RequestParam("file") MultipartFile file) {
        try {
            exportImportService.importTemplate(file);
            return ApiResponse.success("模板导入成功");
        } catch (Exception e) {
            return ApiResponse.error("模板导入失败: " + e.getMessage());
        }
    }
}
```

### 第五阶段：前端构建集成

#### 5.1 前端构建脚本

**修改 `auto_work_web/package.json`**：

```json
{
  "scripts": {
    "build-offline": "npm run build && npm run copy-to-backend",
    "copy-to-backend": "xcopy build\\* ..\\soukon-auto-work\\src\\main\\resources\\static\\ /E /I /Y"
  }
}
```

#### 5.2 后端静态资源配置

**修改 `Application.java`**：

```java
package com.soukon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;

@SpringBootApplication
public class Application implements WebMvcConfigurer {

    public static void main(String[] args) {
        // 设置离线模式
        System.setProperty("spring.profiles.active", "offline");
        
        SpringApplication app = SpringApplication.run(Application.class, args);
        
        // 离线模式下自动打开浏览器
        if (isOfflineMode()) {
            openBrowser();
        }
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 所有路径都指向index.html，支持React Router
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/**/{[path:[^\\.]*}").setViewName("forward:/index.html");
    }

    private static boolean isOfflineMode() {
        return "offline".equals(System.getProperty("spring.profiles.active"));
    }

    private static void openBrowser() {
        try {
            Thread.sleep(2000); // 等待服务启动
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(URI.create("http://localhost:9915"));
            }
        } catch (IOException | InterruptedException e) {
            System.err.println("无法自动打开浏览器: " + e.getMessage());
        }
    }
}
```

### 第六阶段：打包配置

#### 6.1 Maven打包配置

**修改 `soukon-auto-work/pom.xml`**，添加打包插件：

```xml
<build>
    <plugins>
        <!-- Spring Boot打包插件 -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <executable>true</executable>
                <mainClass>com.soukon.Application</mainClass>
            </configuration>
        </plugin>

        <!-- Launch4j插件 - 生成Windows exe -->
        <plugin>
            <groupId>com.akathist.maven.plugins.launch4j</groupId>
            <artifactId>launch4j-maven-plugin</artifactId>
            <version>2.1.2</version>
            <executions>
                <execution>
                    <id>l4j-clui</id>
                    <phase>package</phase>
                    <goals>
                        <goal>launch4j</goal>
                    </goals>
                    <configuration>
                        <headerType>console</headerType>
                        <jar>${project.build.directory}/${project.artifactId}-${project.version}.jar</jar>
                        <outfile>${project.build.directory}/AutoWork-${project.version}.exe</outfile>
                        <downloadUrl>https://adoptopenjdk.net</downloadUrl>
                        <classPath>
                            <mainClass>com.soukon.Application</mainClass>
                            <preCp>anything</preCp>
                        </classPath>
                        <jre>
                            <bundledJre64Bit>false</bundledJre64Bit>
                            <bundledJreAsFallback>false</bundledJreAsFallback>
                            <minVersion>17</minVersion>
                            <jdkPreference>preferJre</jdkPreference>
                            <runtimeBits>64/32</runtimeBits>
                        </jre>
                        <versionInfo>
                            <fileVersion>1.0.0.0</fileVersion>
                            <txtFileVersion>${project.version}</txtFileVersion>
                            <fileDescription>Auto Work 离线版</fileDescription>
                            <copyright>2024</copyright>
                            <productVersion>1.0.0.0</productVersion>
                            <txtProductVersion>${project.version}</txtProductVersion>
                            <productName>Auto Work</productName>
                            <companyName>Soukon</companyName>
                            <internalName>AutoWork</internalName>
                            <originalFilename>AutoWork.exe</originalFilename>
                        </versionInfo>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

#### 6.2 构建脚本

**新建 `build-offline.bat`**：

```batch
@echo off
echo 开始构建 Auto Work 离线版...

echo 1. 构建前端...
cd auto_work_web
call npm install
call npm run build-offline
if %errorlevel% neq 0 (
    echo 前端构建失败!
    pause
    exit /b %errorlevel%
)

echo 2. 构建后端...
cd ..\soukon-auto-work
call mvn clean package -Dmaven.test.skip=true
if %errorlevel% neq 0 (
    echo 后端构建失败!
    pause
    exit /b %errorlevel%
)

echo 3. 构建完成!
echo 可执行文件位置: target\AutoWork-1.0.exe
echo 数据库将在首次运行时自动创建在 data\auto_work.db
pause
```

### 第七阶段：前端UI适配

#### 7.1 移除登录组件

删除或修改 `auto_work_web/src/components/login/` 相关组件。

#### 7.2 添加导入导出功能组件

**新建 `auto_work_web/src/components/ImportExport.js`**：

```jsx
import React, { useState } from 'react';
import { Upload, Button, message, Space, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const ImportExport = () => {
  const [loading, setLoading] = useState(false);

  const handleFullExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/export-import/export/all', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auto_work_full_export_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('全量数据导出成功');
    } catch (error) {
      message.error('导出失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFullImport = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/export-import/import/all', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        message.success('全量数据导入成功');
        // 刷新页面以显示新数据
        window.location.reload();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
    
    return false; // 阻止默认上传行为
  };

  const handleTemplateExport = async (templateId) => {
    if (!templateId) {
      message.warning('请先选择模板');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/export-import/export/template/${templateId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${templateId}_export_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('模板导出成功');
    } catch (error) {
      message.error('模板导出失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateImport = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/export-import/import/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        message.success('模板导入成功');
        // 可以触发模板列表刷新
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('模板导入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
    
    return false;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>数据导入导出</h3>
      
      <Divider orientation="left">全量数据操作</Divider>
      <Space>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleFullExport}
          loading={loading}
        >
          导出全量数据
        </Button>
        
        <Upload
          beforeUpload={handleFullImport}
          showUploadList={false}
          accept=".zip"
        >
          <Button 
            icon={<UploadOutlined />}
            loading={loading}
          >
            导入全量数据
          </Button>
        </Upload>
      </Space>
      
      <Divider orientation="left">模板操作</Divider>
      <Space>
        <Upload
          beforeUpload={handleTemplateImport}
          showUploadList={false}
          accept=".zip"
        >
          <Button 
            icon={<UploadOutlined />}
            loading={loading}
          >
            导入模板
          </Button>
        </Upload>
      </Space>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
        <h4>使用说明：</h4>
        <ul>
          <li>全量数据导出包含所有模板、数据单元格和文件信息</li>
          <li>导入全量数据会覆盖现有所有数据，请谨慎操作</li>
          <li>模板导入会创建新的模板，不会覆盖现有模板</li>
          <li>支持的文件格式：.zip</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportExport;
```

#### 7.3 修改路由配置

**修改 `auto_work_web/src/AppRouter.jsx`**，移除登录路由，添加导入导出页面。

## 部署和分发

### 构建步骤

1. **安装依赖**：
   ```bash
   # 前端依赖
   cd auto_work_web
   npm install
   
   # 后端依赖自动通过Maven解决
   ```

2. **执行构建**：
   ```bash
   # Windows
   build-offline.bat
   
   # 或手动执行
   cd auto_work_web && npm run build-offline
   cd ../soukon-auto-work && mvn clean package
   ```

3. **输出文件**：
   - `soukon-auto-work/target/AutoWork-1.0.exe` - Windows可执行文件
   - `soukon-auto-work/target/soukon-auto-work-1.0.jar` - 跨平台JAR文件

### 用户使用说明

1. **首次运行**：
   - 双击 `AutoWork-1.0.exe`
   - 系统会自动创建 `data/` 目录和SQLite数据库
   - 浏览器会自动打开应用界面

2. **数据管理**：
   - 通过"数据导入导出"页面管理数据
   - 数据库文件位于 `data/auto_work.db`
   - 日志文件位于 `logs/auto-work.log`

3. **备份恢复**：
   - 定期导出全量数据进行备份
   - 迁移时导入数据包即可恢复

## 性能优化建议

1. **SQLite优化**：
   - 启用WAL模式提高并发性能
   - 定期执行VACUUM清理空间

2. **内存缓存**：
   - 使用Caffeine缓存频繁访问的数据
   - 合理设置缓存大小和过期时间

3. **启动优化**：
   - 使用GraalVM Native Image进一步减少启动时间
   - 预编译前端资源

## 总结

通过以上改造，您的Auto Work系统将从在线微服务架构转换为单机离线版本，具备以下特性：

- ✅ 单一可执行文件，无需安装
- ✅ 本地SQLite数据库，数据安全可控
- ✅ 完整的导入导出功能
- ✅ 自动打开浏览器，用户体验友好
- ✅ 保留所有核心功能，移除复杂依赖

这种架构特别适合企业内部使用，用户可以在任何Windows机器上运行，数据完全本地化，满足数据安全和离线使用的需求。 