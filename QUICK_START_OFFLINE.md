# Auto Work 离线版改造 - 快速开始指南

## 🎯 改造目标
将现有的在线版Auto Work系统改造为：
- 💾 **本地数据存储** - 使用SQLite替换MySQL
- 🔓 **无需登录** - 移除认证系统
- 📦 **单文件部署** - 打包成.exe可执行文件
- 📤📥 **数据导入导出** - 支持全量数据和模板的备份恢复

## 🚀 快速改造清单

### ✅ 第一步：清理依赖 (15分钟)
```xml
<!-- 在 soukon-auto-work/pom.xml 中移除 -->
- Nacos配置中心依赖
- Redis缓存依赖  
- 认证模块依赖

<!-- 添加 -->
+ SQLite数据库驱动
+ Caffeine内存缓存
+ Launch4j打包插件
```

### ✅ 第二步：数据库切换 (20分钟)
- 新建 `application-offline.yml` 配置SQLite
- 创建数据库初始化组件
- 修改实体类以适配SQLite

### ✅ 第三步：移除认证 (10分钟)
- 创建 `OfflineSecurityConfig.java` 放行所有请求
- 删除Controller中的认证逻辑
- 前端移除登录组件和路由

### ✅ 第四步：导入导出功能 (30分钟)
- 新建 `DataExportImportService.java`
- 新建 `DataExportImportController.java`
- 前端添加导入导出UI组件

### ✅ 第五步：前端集成 (15分钟)
- 前端构建后复制到后端静态资源目录
- 配置Spring Boot服务静态资源
- 添加自动打开浏览器功能

### ✅ 第六步：打包配置 (10分钟)
- 配置Launch4j插件生成.exe文件
- 创建构建脚本 `build-offline.bat`

## 🔧 核心技术变更

| 组件 | 原技术栈 | 离线技术栈 |
|------|----------|------------|
| 数据库 | MySQL + Nacos配置 | SQLite嵌入式 |
| 缓存 | Redis | Caffeine内存缓存 |
| 认证 | JWT + Spring Security | 无认证（全放行） |
| 部署 | 前后端分离 | 嵌入式单体应用 |
| 分发 | 多组件部署 | 单一.exe文件 |

## 📋 关键文件清单

### 新增文件
```
soukon-auto-work/src/main/java/com/soukon/
├── config/
│   ├── OfflineSecurityConfig.java        # 离线安全配置
│   ├── CustomSQLiteDialect.java          # SQLite方言
│   └── DatabaseInitializer.java          # 数据库初始化
├── service/
│   └── DataExportImportService.java      # 导入导出服务
└── controller/
    └── DataExportImportController.java   # 导入导出API

soukon-auto-work/src/main/resources/
└── application-offline.yml               # 离线配置文件

auto_work_web/src/components/
└── ImportExport.js                       # 导入导出UI组件

根目录/
├── build-offline.bat                     # 构建脚本
└── OFFLINE_VERSION_MIGRATION.md          # 详细改造文档
```

### 修改文件
```
soukon-auto-work/
├── pom.xml                               # 修改依赖和打包配置
└── src/main/java/com/soukon/Application.java  # 添加离线模式启动逻辑

auto_work_web/
├── package.json                          # 添加离线构建脚本
└── src/AppRouter.jsx                     # 移除登录路由，添加导入导出
```

## 🎯 一键构建命令

```bash
# Windows环境
build-offline.bat

# 手动执行
cd auto_work_web && npm run build-offline
cd ../soukon-auto-work && mvn clean package
```

## 📦 最终输出

构建完成后将生成：
- `soukon-auto-work/target/AutoWork-1.0.exe` - Windows可执行文件
- `soukon-auto-work/target/soukon-auto-work-1.0.jar` - 跨平台JAR文件

## 🔍 用户体验

**启动应用**：
1. 双击 `AutoWork-1.0.exe`
2. 系统自动创建 `data/auto_work.db` 数据库
3. 浏览器自动打开 `http://localhost:9915`
4. 直接使用，无需登录

**数据管理**：
- 通过UI界面一键导出全量数据为ZIP包
- 支持导入数据包恢复系统状态
- 支持单个模板的导入导出

## ⚠️ 注意事项

1. **数据兼容性**：现有MySQL数据需要通过导出功能迁移
2. **性能差异**：SQLite适合单用户场景，大数据量时性能略低于MySQL
3. **功能保留**：所有核心Excel处理功能完全保留
4. **文件位置**：
   - 数据库：`data/auto_work.db`
   - 日志：`logs/auto-work.log`
   - 上传文件：`uploads/`

## 📞 技术支持

如遇到改造过程中的问题，请参考详细文档 `OFFLINE_VERSION_MIGRATION.md` 或检查：
- Java版本：需要JDK 17+
- SQLite驱动是否正确加载
- 静态资源路径配置
- Launch4j插件配置

改造完成后，您将拥有一个完全独立、免安装、本地化的Auto Work离线版本！🎉 