package com.soukon;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.File;
import java.net.URI;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@MapperScan("com.soukon.mapper")
@EnableCaching
@Slf4j
public class OfflineApplication {
    
    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("java.awt.headless", "false");
        System.setProperty("spring.jmx.enabled", "false");
        System.setProperty("file.encoding", "UTF-8");
        
        // 确保数据目录存在
        ensureDataDirectories();
        
        // 配置Spring应用
        SpringApplication app = new SpringApplication(OfflineApplication.class);
        app.setAdditionalProfiles("offline");
        
        // 禁用横幅
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        
        log.info("启动 Auto Work 离线版...");
        app.run(args);
    }
    
    private static void ensureDataDirectories() {
        // 创建必要的目录
        String[] directories = {"data", "logs", "uploads", "exports", "temp"};
        for (String dir : directories) {
            File directory = new File(dir);
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (created) {
                    log.info("创建目录: {}", directory.getAbsolutePath());
                }
            }
        }
    }

    @Component
    @Profile("offline")
    static class BrowserOpener implements ApplicationRunner {
        
        private final Environment environment;
        
        public BrowserOpener(Environment environment) {
            this.environment = environment;
        }
        
        @Override
        public void run(ApplicationArguments args) throws Exception {
            String port = environment.getProperty("server.port", "9915");
            String url = "http://localhost:" + port;
            
            log.info("应用启动完成，访问地址: {}", url);
            
            // 延迟2秒后打开浏览器，确保应用完全启动
            new Thread(() -> {
                try {
                    Thread.sleep(2000);
                    if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                        Desktop.getDesktop().browse(new URI(url));
                        log.info("已自动打开浏览器");
                    } else {
                        log.info("系统不支持自动打开浏览器，请手动访问: {}", url);
                    }
                } catch (Exception e) {
                    log.warn("无法自动打开浏览器: {}", e.getMessage());
                    log.info("请手动访问: {}", url);
                }
            }).start();
        }
    }
}