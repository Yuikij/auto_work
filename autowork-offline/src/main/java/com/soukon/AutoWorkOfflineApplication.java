package com.soukon;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
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
        
        // 启动完成后的处理
        onApplicationStarted();
    }
    
    /**
     * 初始化数据目录
     */
    private static void initDataDirectory() {
        try {
            log.info("初始化数据目录...");
            
            Path dataDir = Paths.get("data");
            Files.createDirectories(dataDir.resolve("database"));
            Files.createDirectories(dataDir.resolve("files"));
            Files.createDirectories(dataDir.resolve("exports"));
            Files.createDirectories(dataDir.resolve("config"));
            Files.createDirectories(dataDir.resolve("temp"));
            Files.createDirectories(Paths.get("logs"));
            
            log.info("数据目录初始化完成: {}", dataDir.toAbsolutePath());
        } catch (IOException e) {
            log.error("初始化数据目录失败", e);
            throw new RuntimeException("Failed to initialize data directory", e);
        }
    }
    
    /**
     * 应用启动完成后的处理
     */
    private static void onApplicationStarted() {
        // 在单独线程中执行，避免阻塞主线程
        new Thread(() -> {
            try {
                // 等待服务完全启动
                Thread.sleep(3000);
                
                log.info("AutoWork 离线版启动完成");
                log.info("访问地址: http://localhost:18080");
                log.info("H2控制台: http://localhost:18080/h2-console");
                
                // 尝试自动打开浏览器
                openBrowser();
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("启动后处理被中断", e);
            }
        }, "startup-post-process").start();
    }
    
    /**
     * 自动打开浏览器
     */
    private static void openBrowser() {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI("http://localhost:18080"));
                log.info("浏览器已自动打开");
            } else {
                log.info("系统不支持自动打开浏览器，请手动访问: http://localhost:18080");
            }
        } catch (Exception e) {
            log.info("自动打开浏览器失败，请手动访问: http://localhost:18080", e);
        }
    }
}