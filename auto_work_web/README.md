# Auto Work Web - 前端应用

基于React + Ant Design的自动化数据处理工作流前端界面

## 项目概述

这是Auto Work系统的前端部分，提供了用户友好的界面来管理Excel数据处理模板、执行数据计算任务，并查看处理结果。

## 技术栈

- **React**: 18.3.1
- **Ant Design**: 5.19.0 (UI组件库)
- **React Router**: 6.24.1 (路由管理)
- **Axios**: 1.7.2 (HTTP客户端)
- **Math.js**: 13.0.1 (数学计算)

## 主要功能

### 1. 用户认证
- 登录/登出功能
- JWT Token自动管理
- 路由权限控制

### 2. 模板管理
- **文件模板管理**: 创建、编辑、删除文件模板
- **数据模板管理**: 配置数据处理逻辑
- **参数模板管理**: 管理计算参数

### 3. 数据单元格配置
- 可视化的数据单元格配置界面
- 支持5种数据类型配置
- 实时预览功能

### 4. 文件处理
- 多文件上传组件
- 文件格式验证
- 上传进度显示

### 5. 结果展示
- 表格形式展示计算结果
- 支持数组数据的详细查看
- 结果导出功能

## 项目结构

```
src/
├── components/          # React组件
│   ├── home/           # 主页组件
│   ├── login/          # 登录组件
│   ├── DataCell.js     # 数据单元格组件
│   ├── EditList.js     # 编辑列表组件
│   ├── FileList.js     # 文件列表组件
│   ├── FileTree.js     # 文件树组件
│   ├── KVAdd.js        # 键值对添加组件
│   ├── Template.js     # 模板主组件
│   └── TemplateList.js # 模板列表组件
├── enums/              # 枚举定义
│   └── DataEnums.js    # 数据类型枚举
├── utils/              # 工具函数
│   ├── arrays.js       # 数组操作工具
│   └── request.js      # HTTP请求配置
├── App.js              # 主应用组件
├── AppRouter.jsx       # 路由配置
└── index.js            # 应用入口
```

## 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
```

构建文件将生成在 `build/` 目录中

## 核心组件说明

### Template.js
主要的模板管理组件，包含：
- 数据单元格列表展示
- 文件上传功能
- 模板执行功能
- 参数配置界面

### DataCell.js
数据单元格配置组件，支持：
- 不同类型数据单元格的配置
- 脚本编辑功能
- 数据源选择

### FileList.js
文件模板管理组件：
- 文件模板CRUD操作
- 文件结构配置

### TemplateList.js
模板列表组件：
- 模板选择器
- 模板类型筛选

## 数据类型枚举

```javascript
export const dataTypeMap = {
    1: '文件',        // 从Excel文件读取
    2: '计算',        // 通过脚本计算
    3: '其他数据单元', // 引用其他数据单元
    4: '参数',        // 用户输入参数
    5: '具体值',      // 固定数值
}
```

## HTTP请求配置

项目使用Axios进行HTTP请求，已配置：
- 自动JWT Token注入
- 请求/响应拦截器
- 错误处理机制
- 代理配置到后端服务 (http://localhost:9915)

## 路由配置

- `/login` - 登录页面
- `/` - 主工作台（需要认证）

## 开发指南

### 添加新组件
1. 在 `src/components/` 目录下创建新组件
2. 遵循Ant Design设计规范
3. 使用统一的数据枚举

### API调用规范
```javascript
import axiosInstance from '../utils/request';

// 使用封装的axios实例
axiosInstance.post('/api/endpoint', data)
  .then(response => {
    if (axiosInstance.isSuccess(response)) {
      // 处理成功响应
    }
  })
  .catch(error => {
    // 处理错误
  });
```

### 状态管理
项目使用React Hooks进行状态管理：
- `useState` - 组件局部状态
- `useEffect` - 生命周期管理
- `localStorage` - 持久化存储

## 部署说明

### 开发环境
确保后端服务运行在 http://localhost:9915

### 生产环境
1. 修改 `package.json` 中的代理配置
2. 或者在Nginx中配置反向代理
3. 构建生产版本并部署到Web服务器

## 常见问题

### Q: 接口请求失败
A: 
1. 检查后端服务是否启动
2. 验证代理配置是否正确
3. 查看浏览器Network标签页

### Q: 文件上传失败
A:
1. 检查文件大小限制
2. 验证文件格式是否支持
3. 查看后端日志

### Q: 页面空白
A:
1. 检查浏览器控制台错误
2. 验证路由配置
3. 确认组件渲染逻辑

## 贡献指南

1. 遵循项目代码风格
2. 添加适当的注释
3. 确保组件可复用性
4. 提交前进行测试

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 性能优化

项目已集成的优化：
- 代码分割
- 懒加载
- Ant Design按需加载
- 生产构建优化

## 更新日志

### v0.1.0
- 初始版本发布
- 基础模板管理功能
- 文件上传处理
- 数据单元格配置
- 用户认证系统
