# Auto Work 离线版本设计文档

## 1. 概述

将当前的 Spring Boot + React 微服务架构项目改造为离线版本，打包成可执行文件，支持本地数据存储和无需登录。

## 2. 技术架构改造

### 2.1 原架构分析
- **后端**: Spring Boot + Spring Cloud + Nacos + Redis + MySQL
- **前端**: React + Ant Design
- **特点**: 微服务架构，需要外部依赖

### 2.2 离线架构设计
- **应用形式**: Electron + Spring Boot 内嵌
- **数据库**: 内嵌 H2 数据库
- **缓存**: 内存缓存替代 Redis
- **认证**: 移除认证模块
- **配置**: 本地配置文件

### 2.3 技术栈选择

#### 方案一：Electron + Spring Boot (推荐)
```
┌─────────────────────────────────────┐
│           Electron 主进程            │
├─────────────────────────────────────┤
│  React 前端 (渲染进程)                │
├─────────────────────────────────────┤
│  Spring Boot 后端 (子进程)           │
├─────────────────────────────────────┤
│  H2 数据库 (嵌入式)                  │
└─────────────────────────────────────┘
```

#### 方案二：Spring Boot + JavaFX
```
┌─────────────────────────────────────┐
│        Spring Boot 应用              │
├─────────────────────────────────────┤
│        JavaFX 界面                   │
├─────────────────────────────────────┤
│        H2 数据库                     │
└─────────────────────────────────────┘
```

## 3. 核心功能改造

### 3.1 认证模块移除
- 移除 `soukon_common_auth` 依赖
- 移除登录相关控制器和页面
- 移除用户权限检查

### 3.2 数据存储改造
- **数据库**: MySQL → H2 嵌入式数据库
- **缓存**: Redis → Caffeine 内存缓存
- **配置**: Nacos → 本地配置文件

### 3.3 文件存储
- 使用应用程序数据目录
- Windows: `%APPDATA%/AutoWork`
- Linux: `~/.autowork`
- macOS: `~/Library/Application Support/AutoWork`

### 3.4 数据导入导出功能
- **全量数据导出**: 导出所有模板、文件、配置到 ZIP 包
- **全量数据导入**: 从 ZIP 包导入数据
- **模板导出**: 单个或批量模板导出
- **模板导入**: 支持模板文件导入

## 4. 目录结构设计

```
AutoWork/
├── app/                    # 应用主目录
│   ├── backend/           # Spring Boot 后端
│   ├── frontend/          # React 前端构建文件
│   └── data/              # 数据目录
│       ├── database/      # H2 数据库文件
│       ├── files/         # 用户上传文件
│       ├── exports/       # 导出文件
│       └── config/        # 配置文件
├── AutoWork.exe           # 主执行文件 (Windows)
├── AutoWork.app/          # 应用包 (macOS)
└── autowork              # 可执行文件 (Linux)
```

## 5. 数据模型调整

### 5.1 数据库表结构保持不变
- `data_cell` - 数据单元表
- `files` - 文件管理表
- `template` - 模板表
- 移除用户相关表

### 5.2 新增配置表
```sql
CREATE TABLE app_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description VARCHAR(255),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 6. 接口调整

### 6.1 移除认证相关接口
- `/login`, `/logout`, `/register` 等

### 6.2 新增数据管理接口
- `POST /api/data/export` - 全量数据导出
- `POST /api/data/import` - 全量数据导入
- `POST /api/template/export` - 模板导出
- `POST /api/template/import` - 模板导入
- `GET /api/system/info` - 系统信息

### 6.3 文件路径调整
- 所有文件路径改为相对于应用数据目录
- 支持便携模式（数据存储在应用目录）

## 7. 打包方案

### 7.1 Electron 打包 (推荐)
- 使用 `electron-builder` 打包
- 支持 Windows (.exe), macOS (.dmg), Linux (.AppImage)
- 自动更新支持

### 7.2 Spring Boot 原生打包
- 使用 `spring-boot-maven-plugin`
- 结合 `jpackage` 创建原生安装包
- 性能更好，体积更小

## 8. 部署和分发

### 8.1 安装包特性
- 绿色版本：解压即用
- 安装版本：标准安装程序
- 便携版本：USB 可携带

### 8.2 数据迁移
- 首次启动自动创建数据目录
- 支持从在线版本导入数据
- 提供数据备份和恢复功能

## 9. 性能优化

### 9.1 启动优化
- 使用 Spring Boot 的 `@Lazy` 注解
- 优化依赖注入
- 数据库连接池配置

### 9.2 内存优化
- 合理配置 JVM 参数
- 使用内存缓存替代 Redis
- 优化大文件处理

## 10. 安全考虑

### 10.1 数据安全
- 本地数据加密存储
- 敏感配置文件加密
- 导出文件可选加密

### 10.2 应用安全
- 代码签名
- 防止反编译
- 安全的文件操作

## 11. 开发计划

### Phase 1: 核心功能改造 (1-2周)
1. 移除微服务依赖
2. 集成 H2 数据库
3. 移除认证模块
4. 基本功能测试

### Phase 2: 数据导入导出 (1周)
1. 实现数据导出功能
2. 实现数据导入功能
3. 模板导入导出
4. 数据验证和错误处理

### Phase 3: Electron 集成 (1-2周)
1. 创建 Electron 项目
2. 集成前后端
3. 打包配置
4. 跨平台测试

### Phase 4: 优化和测试 (1周)
1. 性能优化
2. 用户体验优化
3. 全面测试
4. 文档完善

## 12. 风险评估

### 12.1 技术风险
- H2 数据库性能限制
- Electron 应用体积较大
- 跨平台兼容性问题

### 12.2 缓解措施
- 充分的性能测试
- 多平台测试
- 提供轻量级替代方案