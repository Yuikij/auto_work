package com.soukon.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 导出全量数据
     */
    public byte[] exportAllData() throws IOException {
        log.info("开始导出全量数据...");
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            
            // 获取所有表的数据
            List<String> tables = getAllTables();
            
            for (String tableName : tables) {
                try {
                    List<Map<String, Object>> tableData = jdbcTemplate.queryForList("SELECT * FROM " + tableName);
                    String jsonData = objectMapper.writeValueAsString(tableData);
                    addToZip(zos, tableName + ".json", jsonData);
                    log.debug("导出表 {} 完成，记录数: {}", tableName, tableData.size());
                } catch (Exception e) {
                    log.warn("导出表 {} 时出错: {}", tableName, e.getMessage());
                }
            }
            
            // 添加元数据
            ExportMetadata metadata = new ExportMetadata();
            metadata.setExportTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            metadata.setVersion("1.0.0");
            metadata.setTableCount(tables.size());
            metadata.setDescription("Auto Work 离线版全量数据备份");
            
            addToZip(zos, "metadata.json", objectMapper.writeValueAsString(metadata));
            
            log.info("全量数据导出完成，包含 {} 个表", tables.size());
        }
        
        return baos.toByteArray();
    }

    /**
     * 导入全量数据
     */
    @Transactional
    public void importAllData(MultipartFile file) throws IOException {
        log.info("开始导入全量数据，文件大小: {} bytes", file.getSize());
        
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            Map<String, String> fileContents = new HashMap<>();
            
            // 读取所有文件内容
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    String content = readZipEntryContent(zis);
                    fileContents.put(entry.getName(), content);
                }
            }
            
            // 验证数据完整性
            validateImportData(fileContents);
            
            // 备份当前数据（可选）
            createBackupBeforeImport();
            
            // 清空现有数据
            clearExistingData();
            
            // 导入数据
            importTablesData(fileContents);
            
            log.info("全量数据导入完成");
        }
    }

    /**
     * 导出指定表数据
     */
    public byte[] exportTableData(String tableName) throws IOException {
        log.info("开始导出表数据: {}", tableName);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            
            List<Map<String, Object>> tableData = jdbcTemplate.queryForList("SELECT * FROM " + tableName);
            String jsonData = objectMapper.writeValueAsString(tableData);
            addToZip(zos, tableName + ".json", jsonData);
            
            // 添加表元数据
            TableExportMetadata metadata = new TableExportMetadata();
            metadata.setTableName(tableName);
            metadata.setRecordCount(tableData.size());
            metadata.setExportTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            addToZip(zos, "table_metadata.json", objectMapper.writeValueAsString(metadata));
            
            log.info("表 {} 导出完成，记录数: {}", tableName, tableData.size());
        }
        
        return baos.toByteArray();
    }

    /**
     * 导入指定表数据
     */
    @Transactional
    public void importTableData(String tableName, MultipartFile file) throws IOException {
        log.info("开始导入表数据: {}", tableName);
        
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            String tableDataJson = null;
            
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().equals(tableName + ".json")) {
                    tableDataJson = readZipEntryContent(zis);
                    break;
                }
            }
            
            if (tableDataJson == null) {
                throw new IllegalArgumentException("导入文件中未找到表 " + tableName + " 的数据");
            }
            
            // 清空目标表
            jdbcTemplate.execute("DELETE FROM " + tableName);
            
            // 导入数据
            List<Map<String, Object>> tableData = objectMapper.readValue(tableDataJson, List.class);
            insertTableData(tableName, tableData);
            
            log.info("表 {} 导入完成，记录数: {}", tableName, tableData.size());
        }
    }

    /**
     * 创建自动备份
     */
    public String createAutoBackup() throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupFileName = "auto_backup_" + timestamp + ".awb";
        String backupFilePath = "exports/" + backupFileName;
        
        byte[] backupData = exportAllData();
        
        // 确保导出目录存在
        new File("exports").mkdirs();
        
        try (FileOutputStream fos = new FileOutputStream(backupFilePath)) {
            fos.write(backupData);
        }
        
        log.info("自动备份创建完成: {}", backupFilePath);
        return backupFilePath;
    }

    // 辅助方法
    private List<String> getAllTables() {
        try {
            return jdbcTemplate.queryForList(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                String.class
            );
        } catch (Exception e) {
            log.error("获取表列表失败", e);
            return Collections.emptyList();
        }
    }

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
            throw new IllegalArgumentException("导入文件缺少元数据文件");
        }
        
        try {
            ExportMetadata metadata = objectMapper.readValue(fileContents.get("metadata.json"), ExportMetadata.class);
            log.info("导入数据版本: {}, 导出时间: {}", metadata.getVersion(), metadata.getExportTime());
        } catch (Exception e) {
            throw new IllegalArgumentException("元数据格式错误: " + e.getMessage());
        }
    }

    private void createBackupBeforeImport() {
        try {
            String backupPath = createAutoBackup();
            log.info("导入前自动备份已创建: {}", backupPath);
        } catch (Exception e) {
            log.warn("创建导入前备份失败: {}", e.getMessage());
        }
    }

    private void clearExistingData() {
        List<String> tables = getAllTables();
        for (String tableName : tables) {
            try {
                // 跳过系统配置表
                if ("system_config".equals(tableName)) {
                    continue;
                }
                jdbcTemplate.execute("DELETE FROM " + tableName);
                log.debug("清空表: {}", tableName);
            } catch (Exception e) {
                log.warn("清空表 {} 失败: {}", tableName, e.getMessage());
            }
        }
    }

    private void importTablesData(Map<String, String> fileContents) {
        for (Map.Entry<String, String> entry : fileContents.entrySet()) {
            String fileName = entry.getKey();
            if (fileName.endsWith(".json") && !fileName.equals("metadata.json") && !fileName.equals("table_metadata.json")) {
                String tableName = fileName.substring(0, fileName.length() - 5);
                try {
                    List<Map<String, Object>> tableData = objectMapper.readValue(entry.getValue(), List.class);
                    insertTableData(tableName, tableData);
                    log.debug("导入表 {} 完成，记录数: {}", tableName, tableData.size());
                } catch (Exception e) {
                    log.error("导入表 {} 失败: {}", tableName, e.getMessage());
                }
            }
        }
    }

    private void insertTableData(String tableName, List<Map<String, Object>> tableData) {
        if (tableData.isEmpty()) {
            return;
        }
        
        // 获取表结构
        try {
            Map<String, Object> firstRow = tableData.get(0);
            List<String> columns = new ArrayList<>(firstRow.keySet());
            
            String insertSql = "INSERT INTO " + tableName + " (" + 
                String.join(", ", columns) + ") VALUES (" + 
                String.join(", ", Collections.nCopies(columns.size(), "?")) + ")";
            
            List<Object[]> batchArgs = new ArrayList<>();
            for (Map<String, Object> row : tableData) {
                Object[] values = new Object[columns.size()];
                for (int i = 0; i < columns.size(); i++) {
                    values[i] = row.get(columns.get(i));
                }
                batchArgs.add(values);
            }
            
            jdbcTemplate.batchUpdate(insertSql, batchArgs);
            
        } catch (Exception e) {
            log.error("插入表 {} 数据失败: {}", tableName, e.getMessage());
            throw new RuntimeException("插入表数据失败", e);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportMetadata {
        private String exportTime;
        private String version;
        private int tableCount;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableExportMetadata {
        private String tableName;
        private int recordCount;
        private String exportTime;
    }
}