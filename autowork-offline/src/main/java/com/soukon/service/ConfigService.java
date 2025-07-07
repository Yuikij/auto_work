package com.soukon.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.soukon.domain.AppConfig;
import com.soukon.mapper.AppConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ConfigService {
    
    @Autowired
    private AppConfigMapper configMapper;
    
    private final Cache<String, String> configCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .build();
    
    /**
     * 获取配置值
     */
    public String getConfig(String key, String defaultValue) {
        try {
            return configCache.get(key, k -> {
                AppConfig config = configMapper.findByConfigKey(k);
                return config != null ? config.getConfigValue() : defaultValue;
            });
        } catch (Exception e) {
            log.error("获取配置失败: key={}", key, e);
            return defaultValue;
        }
    }
    
    /**
     * 获取配置值
     */
    public String getConfig(String key) {
        return getConfig(key, null);
    }
    
    /**
     * 设置配置值
     */
    public void setConfig(String key, String value, String description) {
        try {
            AppConfig existingConfig = configMapper.findByConfigKey(key);
            
            if (existingConfig != null) {
                existingConfig.setConfigValue(value);
                existingConfig.setDescription(description);
                configMapper.updateById(existingConfig);
            } else {
                AppConfig newConfig = new AppConfig();
                newConfig.setConfigKey(key);
                newConfig.setConfigValue(value);
                newConfig.setDescription(description);
                configMapper.insert(newConfig);
            }
            
            // 更新缓存
            configCache.put(key, value);
            
            log.info("配置更新成功: key={}, value={}", key, value);
        } catch (Exception e) {
            log.error("设置配置失败: key={}, value={}", key, value, e);
            throw new RuntimeException("设置配置失败", e);
        }
    }
    
    /**
     * 删除配置
     */
    public void removeConfig(String key) {
        try {
            AppConfig config = configMapper.findByConfigKey(key);
            if (config != null) {
                config.setDeleted(true);
                configMapper.updateById(config);
                configCache.invalidate(key);
                log.info("配置删除成功: key={}", key);
            }
        } catch (Exception e) {
            log.error("删除配置失败: key={}", key, e);
            throw new RuntimeException("删除配置失败", e);
        }
    }
    
    /**
     * 清除缓存
     */
    public void clearCache() {
        configCache.invalidateAll();
        log.info("配置缓存已清除");
    }
    
    /**
     * 获取Boolean类型配置
     */
    public Boolean getBooleanConfig(String key, Boolean defaultValue) {
        String value = getConfig(key);
        if (value == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }
    
    /**
     * 获取Integer类型配置
     */
    public Integer getIntegerConfig(String key, Integer defaultValue) {
        String value = getConfig(key);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("配置值不是有效的整数: key={}, value={}", key, value);
            return defaultValue;
        }
    }
    
    /**
     * 获取Long类型配置
     */
    public Long getLongConfig(String key, Long defaultValue) {
        String value = getConfig(key);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            log.warn("配置值不是有效的长整数: key={}, value={}", key, value);
            return defaultValue;
        }
    }
}