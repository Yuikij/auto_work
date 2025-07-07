# Auto Work 部署指南

## 快速开始

### 先决条件
确保您的系统已安装以下软件：
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.6+

### 1. 数据库初始化

连接到MySQL并执行以下SQL：
```sql
-- 创建数据库
CREATE DATABASE auto_work DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
USE auto_work;

-- 创建用户表
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `enabled` int DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 插入测试用户 (密码为 'admin' 的BCrypt加密)
INSERT INTO `user` (`id`, `username`, `password`, `enabled`) 
VALUES (1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDu', 1);

-- 创建模板表
CREATE TABLE `template` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `type` int DEFAULT NULL COMMENT '1-文件模板,2-数据模板,3-参数模板',
  `file_template_id` bigint DEFAULT NULL,
  `data_template_id` bigint DEFAULT NULL,
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 创建文件表
CREATE TABLE `files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `template_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `type` int DEFAULT NULL,
  `zip_type` int DEFAULT NULL,
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 创建数据单元格表
CREATE TABLE `data_cell` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `source_id` bigint DEFAULT NULL,
  `row_index` int DEFAULT NULL,
  `column_index` int DEFAULT NULL,
  `sheet` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `select_index` int DEFAULT NULL,
  `script` json DEFAULT NULL,
  `start_index` int DEFAULT NULL,
  `end_index` int DEFAULT NULL,
  `res` tinyint(1) DEFAULT 0,
  `template_id` bigint DEFAULT NULL,
  `specific_value` json DEFAULT NULL,
  `param_name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `type` int DEFAULT NULL COMMENT '1-文件,2-计算,3-数据单元,4-参数,5-具体值',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

### 2. 配置环境

#### 方式一：使用本地配置（推荐用于开发）
修改 `soukon-auto-work/src/main/resources/application.yml`：

```yaml
server:
  port: 9915

spring:
  application:
    name: auto-work
  profiles:
    active: local
  datasource:
    url: jdbc:mysql://localhost:3306/auto_work?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: root
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initial-size: 5
      min-idle: 5
      max-active: 20
      max-wait: 60000
  
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password  # 如果有密码
      database: 0
      timeout: 6000ms
      lettuce:
        pool:
          max-active: 20
          max-wait: -1ms
          max-idle: 8
          min-idle: 0

  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

logging:
  level:
    com.soukon.mapper: debug
    root: info
```

#### 方式二：使用Nacos配置中心
如果要使用Nacos，保持原有的application.yml配置，并启动Nacos服务。

### 3. 启动后端服务

```bash
cd soukon-auto-work

# 编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/soukon-auto-work-1.0.jar
```

启动成功后，可以访问：http://localhost:9915

### 4. 启动前端应用

```bash
cd auto_work_web

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端应用将在 http://localhost:3000 启动

### 5. 验证部署

1. 访问前端应用：http://localhost:3000
2. 使用默认账户登录：
   - 用户名：admin
   - 密码：admin
3. 进入系统后可以看到模板管理界面

## 生产环境部署

### 1. 后端生产部署

1. **构建生产包**
```bash
cd soukon-auto-work
mvn clean package -Dmaven.test.skip=true
```

2. **配置生产环境**
创建 `application-prod.yml`：
```yaml
server:
  port: 9915

spring:
  datasource:
    url: jdbc:mysql://your-prod-db:3306/auto_work?useUnicode=true&characterEncoding=utf8&useSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      password: ${REDIS_PASSWORD}

logging:
  level:
    root: warn
    com.soukon: info
  file:
    name: logs/auto-work.log
```

3. **启动生产服务**
```bash
java -jar -Dspring.profiles.active=prod target/soukon-auto-work-1.0.jar
```

### 2. 前端生产部署

1. **构建生产版本**
```bash
cd auto_work_web
npm run build
```

2. **使用Nginx部署**
Nginx配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/auto_work_web/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:9915;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Docker部署（可选）

### 1. 后端Dockerfile
```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app
COPY target/soukon-auto-work-1.0.jar app.jar

EXPOSE 9915

CMD ["java", "-jar", "app.jar"]
```

### 2. 前端Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 3. Docker Compose
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: auto_work
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./soukon-auto-work
    ports:
      - "9915:9915"
    depends_on:
      - mysql
      - redis
    environment:
      DB_USERNAME: root
      DB_PASSWORD: root
      REDIS_HOST: redis
      REDIS_PORT: 6379

  frontend:
    build: ./auto_work_web
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

## 故障排除

### 常见问题

1. **后端启动失败**
   - 检查Java版本是否为17+
   - 确认数据库连接配置正确
   - 检查Redis服务是否启动

2. **前端访问报错**
   - 确认后端服务已启动
   - 检查代理配置是否正确
   - 查看浏览器控制台错误信息

3. **文件上传失败**
   - 检查文件大小限制
   - 确认临时目录权限
   - 查看后端日志错误信息

4. **计算结果异常**
   - 验证Excel文件格式
   - 检查数据单元格配置
   - 查看脚本执行日志

### 日志查看

- 后端日志：查看控制台输出或 `logs/auto-work.log`
- 前端日志：浏览器开发者工具 -> Console
- 数据库日志：MySQL错误日志
- Redis日志：Redis服务日志

### 性能监控

建议在生产环境中添加以下监控：
- 应用性能监控（APM）
- 数据库监控
- Redis监控
- 系统资源监控

## 配置说明

### 重要配置项

1. **文件上传配置**
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
```

2. **数据库连接池配置**
```yaml
spring:
  datasource:
    druid:
      initial-size: 10
      min-idle: 10
      max-active: 50
      max-wait: 60000
      validation-query: SELECT 1
```

3. **Redis缓存配置**
```yaml
spring:
  data:
    redis:
      timeout: 6000ms
      lettuce:
        pool:
          max-active: 50
          max-wait: -1ms
```

### 安全配置

1. **生产环境建议**
   - 使用HTTPS
   - 配置防火墙
   - 定期更新依赖
   - 使用强密码
   - 启用数据库SSL连接

2. **JWT配置**
   - 修改密钥
   - 设置合适的过期时间
   - 启用刷新令牌机制 