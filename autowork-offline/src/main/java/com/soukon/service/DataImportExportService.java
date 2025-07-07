package com.soukon.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.soukon.domain.*;
import com.soukon.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DataImportExportService {
    
    @Autowired
    private TemplateMapper templateMapper;
    
    @Autowired
    private DataCellMapper dataCellMapper;
    
    @Autowired
    private FilesMapper filesMapper;
    
    @Autowired
    private AppConfigMapper configMapper;
    
    @Autowired
    private ConfigService configService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 全量数据导出
     */
    public String exportAllData() throws IOException {
        String exportDir = configService.getConfig("app.data-dir", "./data") + "/exports";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String exportFileName = "autowork_backup_" + timestamp + ".zip";
        
        Path exportPath = Paths.get(exportDir, exportFileName);
        Files.createDirectories(exportPath.getParent());
        
        log.info("开始导出全量数据到: {}", exportPath);
        
        try (ZipArchiveOutputStream zos = new ZipArchiveOutputStream(Files.newOutputStream(exportPath))) {
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
            
            // 创建导出清单
            createExportManifest(zos);
            
            log.info("全量数据导出完成: {}", exportPath);
        }
        
        return exportPath.toString();
    }
    
    /**
     * 全量数据导入
     */
    public void importAllData(MultipartFile file) throws IOException {
        Path tempDir = Files.createTempDirectory("autowork_import_");
        
        try {
            log.info("开始导入全量数据，临时目录: {}", tempDir);
            
            // 解压文件
            extractZipFile(file.getInputStream(), tempDir);
            
            // 验证导入清单
            validateImportManifest(tempDir);
            
            // 导入各类数据
            importTemplates(tempDir.resolve("templates.json"));
            importDataCells(tempDir.resolve("data_cells.json"));
            importFiles(tempDir.resolve("files.json"));
            importConfigs(tempDir.resolve("configs.json"));
            importUserFiles(tempDir.resolve("user_files"));
            
            log.info("全量数据导入完成");
            
        } finally {
            // 清理临时目录
            try {
                FileUtils.deleteDirectory(tempDir.toFile());
            } catch (IOException e) {
                log.warn("清理临时目录失败: {}", tempDir, e);
            }
        }
    }
    
    /**
     * 导出单个模板
     */
    public String exportTemplate(Long templateId) throws IOException {
        Template template = templateMapper.selectById(templateId);
        if (template == null) {
            throw new RuntimeException("模板不存在: " + templateId);
        }
        
        String exportDir = configService.getConfig("app.data-dir", "./data") + "/exports";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String exportFileName = "template_" + template.getName() + "_" + timestamp + ".zip";
        
        Path exportPath = Paths.get(exportDir, exportFileName);
        Files.createDirectories(exportPath.getParent());
        
        try (ZipArchiveOutputStream zos = new ZipArchiveOutputStream(Files.newOutputStream(exportPath))) {
            // 导出模板
            addToZip(zos, "template.json", objectMapper.writeValueAsString(template));
            
            // 导出相关的数据单元
            List<DataCell> dataCells = dataCellMapper.findByTemplateId(templateId);
            addToZip(zos, "data_cells.json", objectMapper.writeValueAsString(dataCells));
            
            // 导出相关的文件
            List<Files> files = filesMapper.findByTemplateId(templateId);
            addToZip(zos, "files.json", objectMapper.writeValueAsString(files));
            
            log.info("模板导出完成: {}", exportPath);
        }
        
        return exportPath.toString();
    }
    
    /**
     * 导入模板
     */
    public void importTemplate(MultipartFile file) throws IOException {
        Path tempDir = Files.createTempDirectory("autowork_template_import_");
        
        try {
            // 解压文件
            extractZipFile(file.getInputStream(), tempDir);
            
            // 导入模板
            Path templateFile = tempDir.resolve("template.json");
            if (Files.exists(templateFile)) {
                String templateJson = new String(Files.readAllBytes(templateFile));
                Template template = objectMapper.readValue(templateJson, Template.class);
                template.setId(null); // 重置ID
                templateMapper.insert(template);
                
                // 导入相关数据
                importDataCells(tempDir.resolve("data_cells.json"));
                importFiles(tempDir.resolve("files.json"));
            }
            
            log.info("模板导入完成");
            
        } finally {
            FileUtils.deleteDirectory(tempDir.toFile());
        }
    }
    
    private void exportTemplates(ZipArchiveOutputStream zos) throws IOException {
        List<Template> templates = templateMapper.selectList(null);
        String json = objectMapper.writeValueAsString(templates);
        addToZip(zos, "templates.json", json);
        log.debug("导出模板数量: {}", templates.size());
    }
    
    private void exportDataCells(ZipArchiveOutputStream zos) throws IOException {
        List<DataCell> dataCells = dataCellMapper.selectList(null);
        String json = objectMapper.writeValueAsString(dataCells);
        addToZip(zos, "data_cells.json", json);
        log.debug("导出数据单元数量: {}", dataCells.size());
    }
    
    private void exportFiles(ZipArchiveOutputStream zos) throws IOException {
        List<Files> files = filesMapper.selectList(null);
        String json = objectMapper.writeValueAsString(files);
        addToZip(zos, "files.json", json);
        log.debug("导出文件记录数量: {}", files.size());
    }
    
    private void exportConfigs(ZipArchiveOutputStream zos) throws IOException {
        List<AppConfig> configs = configMapper.selectList(null);
        String json = objectMapper.writeValueAsString(configs);
        addToZip(zos, "configs.json", json);
        log.debug("导出配置数量: {}", configs.size());
    }
    
    private void exportUserFiles(ZipArchiveOutputStream zos) throws IOException {
        String dataDir = configService.getConfig("app.data-dir", "./data");
        Path filesDir = Paths.get(dataDir, "files");
        
        if (Files.exists(filesDir)) {
            addDirectoryToZip(zos, filesDir, "user_files/");
            log.debug("导出用户文件目录: {}", filesDir);
        }
    }
    
    private void createExportManifest(ZipArchiveOutputStream zos) throws IOException {
        Map<String, Object> manifest = new HashMap<>();
        manifest.put("exportTime", LocalDateTime.now());
        manifest.put("version", configService.getConfig("app.version", "1.0.0"));
        manifest.put("type", "full_backup");
        
        String json = objectMapper.writeValueAsString(manifest);
        addToZip(zos, "manifest.json", json);
    }
    
    private void importTemplates(Path templateFile) throws IOException {
        if (!Files.exists(templateFile)) return;
        
        String json = new String(Files.readAllBytes(templateFile));
        List<Template> templates = objectMapper.readValue(json, new TypeReference<List<Template>>() {});
        
        for (Template template : templates) {
            template.setId(null); // 重置ID，让数据库自动生成
            templateMapper.insert(template);
        }
        
        log.debug("导入模板数量: {}", templates.size());
    }
    
    private void importDataCells(Path dataCellFile) throws IOException {
        if (!Files.exists(dataCellFile)) return;
        
        String json = new String(Files.readAllBytes(dataCellFile));
        List<DataCell> dataCells = objectMapper.readValue(json, new TypeReference<List<DataCell>>() {});
        
        for (DataCell dataCell : dataCells) {
            dataCell.setId(null); // 重置ID
            dataCellMapper.insert(dataCell);
        }
        
        log.debug("导入数据单元数量: {}", dataCells.size());
    }
    
    private void importFiles(Path filesFile) throws IOException {
        if (!Files.exists(filesFile)) return;
        
        String json = new String(Files.readAllBytes(filesFile));
        List<Files> files = objectMapper.readValue(json, new TypeReference<List<Files>>() {});
        
        for (Files file : files) {
            file.setId(null); // 重置ID
            filesMapper.insert(file);
        }
        
        log.debug("导入文件记录数量: {}", files.size());
    }
    
    private void importConfigs(Path configFile) throws IOException {
        if (!Files.exists(configFile)) return;
        
        String json = new String(Files.readAllBytes(configFile));
        List<AppConfig> configs = objectMapper.readValue(json, new TypeReference<List<AppConfig>>() {});
        
        for (AppConfig config : configs) {
            AppConfig existing = configMapper.findByConfigKey(config.getConfigKey());
            if (existing == null) {
                config.setId(null); // 重置ID
                configMapper.insert(config);
            }
        }
        
        log.debug("导入配置数量: {}", configs.size());
    }
    
    private void importUserFiles(Path userFilesDir) throws IOException {
        if (!Files.exists(userFilesDir)) return;
        
        String dataDir = configService.getConfig("app.data-dir", "./data");
        Path targetDir = Paths.get(dataDir, "files");
        
        if (Files.exists(userFilesDir)) {
            FileUtils.copyDirectory(userFilesDir.toFile(), targetDir.toFile());
            log.debug("导入用户文件到: {}", targetDir);
        }
    }
    
    private void validateImportManifest(Path tempDir) throws IOException {
        Path manifestFile = tempDir.resolve("manifest.json");
        if (!Files.exists(manifestFile)) {
            log.warn("导入包中没有清单文件，继续导入");
            return;
        }
        
        String json = new String(Files.readAllBytes(manifestFile));
        Map<String, Object> manifest = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        
        log.info("导入清单信息: {}", manifest);
    }
    
    private void extractZipFile(InputStream inputStream, Path targetDir) throws IOException {
        try (ZipArchiveInputStream zis = new ZipArchiveInputStream(inputStream)) {
            ZipArchiveEntry entry;
            while ((entry = zis.getNextZipEntry()) != null) {
                Path targetFile = targetDir.resolve(entry.getName());
                
                if (entry.isDirectory()) {
                    Files.createDirectories(targetFile);
                } else {
                    Files.createDirectories(targetFile.getParent());
                    try (OutputStream os = Files.newOutputStream(targetFile)) {
                        IOUtils.copy(zis, os);
                    }
                }
            }
        }
    }
    
    private void addToZip(ZipArchiveOutputStream zos, String fileName, String content) throws IOException {
        ZipArchiveEntry entry = new ZipArchiveEntry(fileName);
        entry.setSize(content.getBytes().length);
        zos.putArchiveEntry(entry);
        zos.write(content.getBytes());
        zos.closeArchiveEntry();
    }
    
    private void addDirectoryToZip(ZipArchiveOutputStream zos, Path sourceDir, String baseDir) throws IOException {
        Files.walk(sourceDir)
                .forEach(path -> {
                    try {
                        String entryName = baseDir + sourceDir.relativize(path).toString().replace("\\", "/");
                        
                        if (Files.isDirectory(path)) {
                            if (!entryName.endsWith("/")) {
                                entryName += "/";
                            }
                            ZipArchiveEntry entry = new ZipArchiveEntry(entryName);
                            zos.putArchiveEntry(entry);
                            zos.closeArchiveEntry();
                        } else {
                            ZipArchiveEntry entry = new ZipArchiveEntry(entryName);
                            entry.setSize(Files.size(path));
                            zos.putArchiveEntry(entry);
                            Files.copy(path, zos);
                            zos.closeArchiveEntry();
                        }
                    } catch (IOException e) {
                        log.error("添加文件到ZIP失败: {}", path, e);
                    }
                });
    }
}