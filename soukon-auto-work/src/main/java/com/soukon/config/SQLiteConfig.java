package com.soukon.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.io.File;
import java.nio.file.Paths;

@Configuration
@Profile("offline")
@Slf4j
public class SQLiteConfig {
    
    @Bean
    @Primary
    public DataSource dataSource() {
        // 获取数据库文件路径
        String dbPath = Paths.get("data", "auto_work.db").toString();
        
        // 确保数据目录存在
        File dataDir = new File("data");
        if (!dataDir.exists()) {
            boolean created = dataDir.mkdirs();
            if (created) {
                log.info("创建数据目录: {}", dataDir.getAbsolutePath());
            }
        }
        
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl("jdbc:sqlite:" + dbPath);
        dataSource.setDriverClassName("org.sqlite.JDBC");
        
        // SQLite 特定配置
        dataSource.setMaximumPoolSize(1); // SQLite 不支持多连接
        dataSource.setConnectionTestQuery("SELECT 1");
        dataSource.setValidationTimeout(3000);
        dataSource.setIdleTimeout(600000);
        dataSource.setMaxLifetime(1800000);
        
        // SQLite 连接属性
        dataSource.addDataSourceProperty("foreign_keys", "true");
        dataSource.addDataSourceProperty("journal_mode", "WAL");
        dataSource.addDataSourceProperty("synchronous", "NORMAL");
        
        log.info("SQLite数据库配置完成，数据库路径: {}", dbPath);
        return dataSource;
    }
    
    @Bean
    @Profile("offline")
    public CommandLineRunner databaseInitializer(DataSource dataSource) {
        return new DatabaseInitializer(dataSource);
    }
    
    /**
     * 数据库初始化器
     */
    static class DatabaseInitializer implements CommandLineRunner {
        
        private final DataSource dataSource;
        
        public DatabaseInitializer(DataSource dataSource) {
            this.dataSource = dataSource;
        }
        
        @Override
        public void run(String... args) throws Exception {
            log.info("开始初始化SQLite数据库...");
            
            JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
            
            // 检查数据库连接
            try {
                jdbcTemplate.execute("SELECT 1");
                log.info("SQLite数据库连接正常");
            } catch (Exception e) {
                log.error("SQLite数据库连接失败", e);
                throw e;
            }
            
            // 执行数据库初始化脚本（如果需要）
            initializeBasicData(jdbcTemplate);
            
            log.info("SQLite数据库初始化完成");
        }
        
        private void initializeBasicData(JdbcTemplate jdbcTemplate) {
            try {
                // 检查是否需要初始化基础数据
                // 这里可以添加一些基础配置数据的插入逻辑
                
                // 示例：创建默认配置表（如果不存在）
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS system_config (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        config_key VARCHAR(100) NOT NULL UNIQUE,
                        config_value TEXT,
                        description VARCHAR(255),
                        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                        update_time DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """);
                
                // 插入默认配置
                String checkConfigSql = "SELECT COUNT(*) FROM system_config WHERE config_key = ?";
                
                if (jdbcTemplate.queryForObject(checkConfigSql, Integer.class, "app.version") == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)",
                        "app.version", "1.0.0-offline", "应用版本号"
                    );
                }
                
                if (jdbcTemplate.queryForObject(checkConfigSql, Integer.class, "app.initialized") == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)",
                        "app.initialized", "true", "应用是否已初始化"
                    );
                }
                
                log.info("基础数据初始化完成");
                
            } catch (Exception e) {
                log.warn("基础数据初始化过程中出现警告: {}", e.getMessage());
                // 不抛出异常，允许应用继续启动
            }
        }
    }
}