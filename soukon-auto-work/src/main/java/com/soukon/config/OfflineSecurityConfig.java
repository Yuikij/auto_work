package com.soukon.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@Profile("offline")
@Slf4j
public class OfflineSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("配置离线版本安全策略 - 允许所有请求");
        
        return http
                // 禁用CSRF保护（离线版本不需要）
                .csrf(AbstractHttpConfigurer::disable)
                
                // 配置CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // 允许所有请求
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/",
                        "/index.html",
                        "/static/**",
                        "/assets/**",
                        "/favicon.ico",
                        "/manifest.json",
                        "/**/*.js",
                        "/**/*.css",
                        "/**/*.png",
                        "/**/*.jpg",
                        "/**/*.svg",
                        "/**/*.woff",
                        "/**/*.woff2",
                        "/**/*.ttf"
                    ).permitAll()
                    .requestMatchers(
                        "/actuator/**",
                        "/health",
                        "/info"
                    ).permitAll()
                    .requestMatchers(
                        "/api/**",
                        "/template/**",
                        "/data/**",
                        "/file/**",
                        "/backup/**",
                        "/export/**",
                        "/import/**"
                    ).permitAll()
                    .anyRequest().permitAll()
                )
                
                // 禁用表单登录
                .formLogin(AbstractHttpConfigurer::disable)
                
                // 禁用HTTP Basic认证
                .httpBasic(AbstractHttpConfigurer::disable)
                
                // 禁用会话管理（无状态）
                .sessionManagement(session -> session
                    .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS)
                )
                
                // 禁用注销功能
                .logout(AbstractHttpConfigurer::disable)
                
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 允许所有来源
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        
        // 允许所有HTTP方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 允许所有请求头
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 允许凭证
        configuration.setAllowCredentials(true);
        
        // 预检请求的缓存时间
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}