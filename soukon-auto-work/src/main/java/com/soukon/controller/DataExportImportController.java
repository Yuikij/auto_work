package com.soukon.controller;

import com.soukon.service.DataExportImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/backup")
@Slf4j
public class DataExportImportController {

    @Autowired
    private DataExportImportService dataExportImportService;

    /**
     * 导出全量数据
     */
    @PostMapping("/export/all")
    public ResponseEntity<byte[]> exportAllData() {
        try {
            log.info("收到全量数据导出请求");
            
            byte[] backupData = dataExportImportService.exportAllData();
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "autowork_backup_" + timestamp + ".awb";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(backupData.length);
            
            log.info("全量数据导出成功，文件大小: {} bytes", backupData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(backupData);
                    
        } catch (Exception e) {
            log.error("导出全量数据失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("导出失败: " + e.getMessage()).getBytes());
        }
    }

    /**
     * 导入全量数据
     */
    @PostMapping("/import/all")
    public ResponseEntity<Map<String, Object>> importAllData(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("收到全量数据导入请求，文件名: {}, 大小: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "上传文件为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!file.getOriginalFilename().endsWith(".awb")) {
                response.put("success", false);
                response.put("message", "文件格式不正确，请上传 .awb 格式的备份文件");
                return ResponseEntity.badRequest().body(response);
            }
            
            dataExportImportService.importAllData(file);
            
            response.put("success", true);
            response.put("message", "数据导入成功");
            response.put("filename", file.getOriginalFilename());
            response.put("size", file.getSize());
            
            log.info("全量数据导入成功");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("导入全量数据失败", e);
            response.put("success", false);
            response.put("message", "导入失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 导出指定表数据
     */
    @PostMapping("/export/table/{tableName}")
    public ResponseEntity<byte[]> exportTableData(@PathVariable String tableName) {
        try {
            log.info("收到表数据导出请求: {}", tableName);
            
            byte[] tableData = dataExportImportService.exportTableData(tableName);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = tableName + "_backup_" + timestamp + ".awb";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(tableData.length);
            
            log.info("表 {} 数据导出成功，文件大小: {} bytes", tableName, tableData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(tableData);
                    
        } catch (Exception e) {
            log.error("导出表 {} 数据失败", tableName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("导出失败: " + e.getMessage()).getBytes());
        }
    }

    /**
     * 导入指定表数据
     */
    @PostMapping("/import/table/{tableName}")
    public ResponseEntity<Map<String, Object>> importTableData(
            @PathVariable String tableName,
            @RequestParam("file") MultipartFile file) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("收到表数据导入请求: {}, 文件名: {}", tableName, file.getOriginalFilename());
            
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "上传文件为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            dataExportImportService.importTableData(tableName, file);
            
            response.put("success", true);
            response.put("message", "表 " + tableName + " 数据导入成功");
            response.put("tableName", tableName);
            response.put("filename", file.getOriginalFilename());
            
            log.info("表 {} 数据导入成功", tableName);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("导入表 {} 数据失败", tableName, e);
            response.put("success", false);
            response.put("message", "导入失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 创建自动备份
     */
    @PostMapping("/create-backup")
    public ResponseEntity<Map<String, Object>> createAutoBackup() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("收到创建自动备份请求");
            
            String backupFilePath = dataExportImportService.createAutoBackup();
            
            response.put("success", true);
            response.put("message", "自动备份创建成功");
            response.put("backupFilePath", backupFilePath);
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            log.info("自动备份创建成功: {}", backupFilePath);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("创建自动备份失败", e);
            response.put("success", false);
            response.put("message", "创建备份失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 获取应用信息
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getApplicationInfo() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            info.put("appName", "Auto Work 离线版");
            info.put("version", "1.0.0-offline");
            info.put("description", "自动化数据处理工作流系统（离线版）");
            info.put("mode", "offline");
            info.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.ok(info);
            
        } catch (Exception e) {
            log.error("获取应用信息失败", e);
            info.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(info);
        }
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            health.put("status", "UP");
            health.put("mode", "offline");
            health.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            log.error("健康检查失败", e);
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(health);
        }
    }
}