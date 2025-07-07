# Auto Work - 自动化数据处理工作流系统

> 基于模板驱动的Excel数据自动化处理与计算平台

## 项目简介

Auto Work 是一个自动化数据处理工作流系统，主要解决多Excel文件的数据聚合、筛选和计算需求。系统通过模板化配置，实现对Excel数据的自动化处理，包括单元格级别的数据提取、自定义参数计算、以及复杂的数学运算。

**核心价值**：让用户定义好数据处理规则，然后根据模板和数据源，一键生成统计结果。

## 项目架构

### 整体架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │   后端 (Spring)  │    │   数据库 (MySQL) │
│                 │    │                 │    │                 │
│ • 模板管理界面   │◄──►│ • RESTful API   │◄──►│ • 模板数据       │
│ • 文件上传组件   │    │ • 文件处理服务   │    │ • 计算配置       │
│ • 数据展示界面   │    │ • 计算引擎       │    │ • 用户数据       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈

#### 后端技术栈
- **框架**: Spring Boot 3.2.4
- **微服务**: Spring Cloud + Nacos
- **数据库**: MySQL + MyBatis Plus
- **缓存**: Redis
- **认证**: JWT + Spring Security
- **文件处理**: EasyExcel + Apache POI
- **脚本引擎**: Groovy
- **构建工具**: Maven

#### 前端技术栈
- **框架**: React 18.3.1
- **UI组件**: Ant Design 5.19.0
- **路由**: React Router Dom 6.24.1
- **HTTP客户端**: Axios 1.7.2
- **数学计算**: Math.js 13.0.1
- **构建工具**: Create React App

## 核心功能特性

### 1. 模板管理系统
- **文件模板**: 定义Excel文件的结构和命名规则
- **数据模板**: 配置数据处理逻辑和计算规则
- **参数模板**: 管理可配置的计算参数

### 2. 数据单元格处理
支持5种数据单元格类型：
- **文件类型 (FILE)**: 直接从Excel文件读取指定单元格
- **计算类型 (SCRIPT)**: 通过脚本进行数据计算
- **数据单元类型 (DATA)**: 引用其他数据单元的结果
- **参数类型 (PARAM)**: 使用用户定义的参数值
- **具体值类型 (VAL)**: 使用预设的固定数值

### 3. 计算引擎
- **基础运算**: 支持加减乘除等基本数学运算
- **聚合函数**: 连加、连乘等聚合计算
- **脚本执行**: 基于Groovy的自定义脚本计算
- **批量处理**: 支持对数据集进行批量计算

### 4. 文件处理能力
- **Excel支持**: 兼容 .xls 和 .xlsx 格式
- **HTML表格**: 支持HTML表格数据解析
- **多文件上传**: 批量处理多个数据文件
- **格式检测**: 自动识别文件格式并选择合适的解析器

### 5. 用户界面功能
- **可视化配置**: 拖拽式模板配置界面
- **实时预览**: 配置过程中实时预览计算结果
- **结果展示**: 多样化的数据展示方式
- **参数调整**: 动态调整计算参数

## 项目结构

```
auto_work/
├── soukon-auto-work/              # 后端主模块
│   ├── src/main/java/com/soukon/
│   │   ├── controller/            # REST API控制器
│   │   ├── service/              # 业务逻辑服务
│   │   ├── domain/               # 实体模型
│   │   ├── mapper/               # 数据访问层
│   │   ├── enums/                # 枚举定义
│   │   └── utils/                # 工具类
│   └── src/main/resources/
│       ├── application.yml       # 应用配置
│       └── mapper/               # MyBatis映射文件
├── auto_work_web/                # 前端应用
│   ├── src/
│   │   ├── components/           # React组件
│   │   ├── utils/                # 工具函数
│   │   └── enums/                # 前端枚举
│   └── public/                   # 静态资源
└── common_webapp_template/       # 公共模块
    ├── soukon_common_auth/       # 认证模块
    ├── soukon_common_database/   # 数据库模块
    ├── soukon_common_redis/      # Redis模块
    └── soukon_common_core/       # 核心模块
```

## 核心数据模型

### DataCell (数据单元格)
```java
public class DataCell {
    private Long id;              // 唯一标识
    private String name;          // 单元格名称
    private Long sourceId;        // 数据源ID
    private Integer rowIndex;     // Excel行索引
    private Integer columnIndex;  // Excel列索引
    private String sheet;         // 工作表名称
    private Script script;        // 计算脚本
    private boolean res;          // 是否为最终结果
    private Long templateId;      // 所属模板ID
    private int type;            // 数据类型 (1-文件,2-计算,3-数据单元,4-参数,5-具体值)
    // ... 其他字段
}
```

### Script (计算脚本)
```java
public class Script {
    private int scriptType;              // 脚本类型 (1-分组,2-函数,3-运算)
    private List<String> operationScript; // 操作脚本
    private List<DataCell> dataCells;    // 关联的数据单元格
}
```

### Template (模板)
```java
public class Template {
    private Long id;              // 模板ID
    private String name;          // 模板名称
    private int type;            // 模板类型 (1-文件,2-数据)
    private Long fileTemplateId;  // 文件模板ID
    private Long dataTemplateId;  // 数据模板ID
}
```

## 安装部署

### 环境要求
- **Java**: JDK 17+
- **Node.js**: 16.0+
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Nacos**: 2.0+ (用于配置管理)

### 后端部署

1. **克隆项目**
```bash
git clone <repository-url>
cd auto_work
```

2. **配置数据库**
```sql
-- 创建数据库
CREATE DATABASE auto_work DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

-- 创建用户表
CREATE TABLE `user` (
  `id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `password` varchar(2550) COLLATE utf8mb4_bin DEFAULT NULL,
  `enabled` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 其他业务表会通过MyBatis Plus自动创建
```

3. **配置Nacos**
   - 启动Nacos服务器
   - 配置命名空间和配置文件
   - 修改 `application.yml` 中的Nacos连接信息

4. **配置Redis**
   - 启动Redis服务
   - 在Nacos中配置Redis连接信息

5. **启动后端应用**
```bash
cd soukon-auto-work
mvn clean package
java -jar target/soukon-auto-work-1.0.jar
```

### 前端部署

1. **安装依赖**
```bash
cd auto_work_web
npm install
```

2. **配置代理**
   确保 `package.json` 中的代理设置正确：
```json
{
  "proxy": "http://localhost:9915"
}
```

3. **启动前端应用**
```bash
npm start
```

## 使用指南

### 1. 创建文件模板
1. 登录系统后，进入文件模板管理
2. 点击"新增模板"，输入模板名称
3. 配置文件结构，定义预期的Excel文件名称和格式

### 2. 配置数据模板
1. 创建数据模板，关联对应的文件模板
2. 添加数据单元格，配置每个单元格的：
   - 数据来源（文件位置或计算逻辑）
   - 计算规则（如需要）
   - 输出配置

### 3. 执行数据处理
1. 选择已配置的模板
2. 上传对应的Excel文件
3. 设置计算参数（如有）
4. 点击执行，查看计算结果

### 4. 结果查看与导出
- 系统会显示所有配置为"最终结果"的数据单元格
- 支持查看详细的计算过程
- 可以导出处理结果

## API文档

### 模板管理API
```http
POST /template/add          # 创建模板
POST /template/list         # 查询模板列表
POST /template/edit         # 编辑模板
POST /template/del          # 删除模板
```

### 数据处理API
```http
POST /template/execute      # 执行模板计算
POST /data/get             # 获取数据单元格
POST /data/add             # 添加数据单元格
POST /data/edit            # 编辑数据单元格
POST /data/del             # 删除数据单元格
```

### 文件管理API
```http
POST /files/get            # 获取文件列表
POST /files/edit           # 编辑文件配置
POST /template/files/add   # 添加文件模板
```

## 开发指南

### 后端开发
1. **新增业务模块**：在对应的 package 下创建 controller、service、mapper
2. **数据库操作**：使用 MyBatis Plus 进行CRUD操作
3. **配置管理**：通过 Nacos 管理配置文件
4. **认证授权**：集成了 JWT + Spring Security

### 前端开发
1. **组件开发**：基于 Ant Design 组件库
2. **状态管理**：使用 React Hooks
3. **API调用**：通过 axios 实例，自动处理 JWT token
4. **路由管理**：使用 React Router Dom

## 部署注意事项

### 生产环境配置
1. **数据库连接池**：调整数据库连接池参数
2. **文件上传限制**：配置合适的文件大小限制
3. **缓存策略**：合理配置Redis缓存策略
4. **日志管理**：配置生产环境日志级别

### 性能优化
1. **大文件处理**：对于大型Excel文件，考虑分批处理
2. **计算优化**：复杂计算可以考虑异步处理
3. **前端优化**：启用代码分割和懒加载

## 常见问题

### Q: 文件上传失败
A: 检查文件格式是否支持，文件大小是否超限，服务器存储空间是否充足

### Q: 计算结果不正确
A: 验证数据单元格配置是否正确，检查脚本语法，确认数据源完整性

### Q: 系统启动失败
A: 检查Nacos连接、数据库连接、Redis连接是否正常

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论组

---

**注意**: 本项目目前处于开发阶段，模板创建操作相对复杂，正在进行优化改进。

