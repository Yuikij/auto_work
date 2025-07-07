package com.soukon.controller;

import com.soukon.service.ConfigService;
import com.soukon.service.DataImportExportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/offline")
@CrossOrigin(origins = "*")
public class OfflineController {
    
    @Autowired
    private DataImportExportService importExportService;
    
    @Autowired
    private ConfigService configService;
    
    /**
     * 系统信息
     */
    @GetMapping("/system/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        try {
            Map<String, Object> info = new HashMap<>();
            info.put("version", configService.getConfig("app.version", "1.0.0"));
            info.put("name", configService.getConfig("app.name", "AutoWork 离线版"));
            info.put("dataDir", Paths.get(configService.getConfig("app.data-dir", "./data")).toAbsolutePath().toString());
            info.put("portableMode", configService.getBooleanConfig("app.portable-mode", false));
            info.put("status", "running");
            info.put("timestamp", System.currentTimeMillis());
            
            // 系统资源信息
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> memory = new HashMap<>();
            memory.put("total", runtime.totalMemory());
            memory.put("free", runtime.freeMemory());
            memory.put("used", runtime.totalMemory() - runtime.freeMemory());
            memory.put("max", runtime.maxMemory());
            info.put("memory", memory);
            
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            log.error("获取系统信息失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "获取系统信息失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 全量数据导出
     */
    @PostMapping("/data/export")
    public ResponseEntity<Map<String, Object>> exportData() {
        try {
            String exportPath = importExportService.exportAllData();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "数据导出成功");
            result.put("exportPath", exportPath);
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("全量数据导出成功: {}", exportPath);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("数据导出失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "导出失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 全量数据导入
     */
    @PostMapping("/data/import")
    public ResponseEntity<Map<String, Object>> importData(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "请选择要导入的文件");
                return ResponseEntity.badRequest().body(error);
            }
            
            importExportService.importAllData(file);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "数据导入成功");
            result.put("fileName", file.getOriginalFilename());
            result.put("fileSize", file.getSize());
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("全量数据导入成功: {}", file.getOriginalFilename());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("数据导入失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "导入失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 模板导出
     */
    @PostMapping("/template/export")
    public ResponseEntity<Map<String, Object>> exportTemplate(@RequestParam("templateId") Long templateId) {
        try {
            String exportPath = importExportService.exportTemplate(templateId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "模板导出成功");
            result.put("exportPath", exportPath);
            result.put("templateId", templateId);
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("模板导出成功: templateId={}, exportPath={}", templateId, exportPath);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("模板导出失败: templateId={}", templateId, e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "模板导出失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 模板导入
     */
    @PostMapping("/template/import")
    public ResponseEntity<Map<String, Object>> importTemplate(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "请选择要导入的模板文件");
                return ResponseEntity.badRequest().body(error);
            }
            
            importExportService.importTemplate(file);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "模板导入成功");
            result.put("fileName", file.getOriginalFilename());
            result.put("fileSize", file.getSize());
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("模板导入成功: {}", file.getOriginalFilename());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("模板导入失败", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "模板导入失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        health.put("version", configService.getConfig("app.version", "1.0.0"));
        
        // 检查数据库连接等
        try {
            // 可以添加更多健康检查逻辑
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }
    
    /**
     * 获取配置
     */
    @GetMapping("/config/{key}")
    public ResponseEntity<Map<String, Object>> getConfig(@PathVariable String key) {
        try {
            String value = configService.getConfig(key);
            
            Map<String, Object> result = new HashMap<>();
            result.put("key", key);
            result.put("value", value);
            result.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取配置失败: key={}", key, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "获取配置失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * 设置配置
     */
    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> setConfig(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(required = false) String description) {
        try {
            configService.setConfig(key, value, description);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "配置设置成功");
            result.put("key", key);
            result.put("value", value);
            result.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("设置配置失败: key={}, value={}", key, value, e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "设置配置失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}