# Auto Work Tauri 改造计划

## 项目概述

本文档详细规划了将 Auto Work 从 Java Spring Boot + React 架构改造为 Tauri + React + SQLite 的完整计划。

## 改造原则

1. **功能对等性** - 所有原有功能必须在新架构中完全实现
2. **界面一致性** - 保持原有界面设计和用户体验
3. **数据兼容性** - 支持与原系统的数据互通
4. **渐进式改造** - 分阶段实施，确保每个阶段都是可用的

## 已完成功能 (Phase 1) ✅

### 基础架构
- Tauri 应用框架搭建
- SQLite 数据库集成
- React + TypeScript 前端框架

### 核心功能
- 模板管理（增删改查）
- 文件管理（上传、删除、列表）
- 数据单元格管理
- 基础的模板执行功能
- 数据导入导出

### UI 组件
- TemplateList（模板列表）
- FileList（文件列表）
- DataCellList（数据单元格列表）
- KVAdd（参数管理）
- Template（模板执行主界面）

## 待改造功能清单

### Phase 2 - API 调用迁移（高优先级）

#### 2.1 固定模板 ID 问题
**现状**: 代码中硬编码了模板 ID（如 1811663639102410753）
**目标**: 动态获取和管理模板 ID
**实施方案**:
```typescript
// 1. 创建模板上下文管理
interface TemplateContext {
  fileTemplateId?: number;
  dataTemplateId?: number;
  paramTemplateId?: number;
}

// 2. 在 App 组件中管理上下文
// 3. 传递给需要的子组件
```

#### 2.2 API 端点映射
需要将以下 API 调用迁移到 Tauri commands：

| 原 API 端点 | Tauri Command | 状态 |
|------------|---------------|------|
| `/template/list` | `list_templates` | ✅ |
| `/template/add` | `add_template` | ✅ |
| `/template/edit` | `edit_template` | ✅ |
| `/template/del` | `delete_template` | ✅ |
| `/template/execute` | `execute_template` | ✅ |
| `/data/get` | `get_data_cells` | ✅ |
| `/data/add` | `add_data_cell` | ✅ |
| `/data/edit` | `update_data_cell` | ✅ |
| `/data/del` | `delete_data_cell` | ✅ |
| `/files/get` | `list_files_by_template` | ✅ |
| `/template/files/add` | `add_file` | ✅ |
| `/backup/info` | `get_app_info` | ❌ |
| `/backup/export/all` | `export_all_data` | ✅ |
| `/backup/import/all` | `import_all_data` | ✅ |
| `/backup/create-backup` | `create_backup` | ❌ |

### Phase 3 - 文件处理增强（高优先级）

#### 3.1 Excel 文件解析
**需求**: 支持读取 Excel 文件数据
**技术方案**: 
- 集成 `calamine` crate
- 支持 .xlsx 和 .xls 格式
- 实现单元格定位和范围读取

#### 3.2 HTML 解析增强
**需求**: 更复杂的 HTML 数据提取
**技术方案**:
- 增强 CSS 选择器支持
- 支持正则表达式匹配
- 支持 XPath 查询

#### 3.3 文件类型扩展
- CSV 文件支持
- JSON 文件支持
- XML 文件支持
- PDF 文本提取（可选）

### Phase 4 - 脚本执行引擎（中优先级）

#### 4.1 JavaScript 运行时集成
**技术选型**: 
- 方案1: `deno_core` - 轻量级，与 Rust 集成好
- 方案2: `quick-js` - 更小巧，但功能有限

**功能需求**:
- 执行用户自定义脚本
- 访问数据单元格值
- 支持参数传递
- 安全沙箱环境

#### 4.2 脚本编辑器
- 集成 Monaco Editor
- 语法高亮
- 自动补全
- 错误提示

### Phase 5 - 数据处理功能（中优先级）

#### 5.1 数据聚合
- SUM, AVG, COUNT, MIN, MAX
- GROUP BY 功能
- 数据透视表

#### 5.2 数据转换
- 数据类型转换
- 格式化功能
- 数据清洗
- 条件过滤

#### 5.3 数据验证
- 数据完整性检查
- 格式验证
- 范围验证
- 自定义规则

### Phase 6 - UI/UX 增强（低优先级）

#### 6.1 拖拽功能
- 文件拖拽上传
- 数据单元格拖拽排序
- 模板拖拽排序

#### 6.2 实时预览
- 文件内容预览
- 数据提取结果预览
- 公式计算预览

#### 6.3 批量操作
- 批量删除
- 批量编辑
- 批量导出

#### 6.4 主题支持
- 深色模式
- 自定义主题
- 响应式布局优化

### Phase 7 - 高级功能（低优先级）

#### 7.1 模板市场
- 模板分享
- 模板导入/导出
- 版本管理

#### 7.2 数据可视化
- 图表生成
- 数据报表
- 导出 PDF

#### 7.3 自动化工作流
- 定时任务
- 文件监控
- 自动执行

## 技术债务清理

### 需要重构的部分
1. **组件解耦**
   - 将业务逻辑从组件中抽离
   - 创建独立的 hooks 和 services

2. **类型安全**
   - 完善 TypeScript 类型定义
   - 消除 any 类型使用

3. **错误处理**
   - 统一错误处理机制
   - 用户友好的错误提示

4. **性能优化**
   - 大数据量分页
   - 虚拟滚动
   - 缓存机制

## 实施时间表

### 第一周：Phase 2 - API 迁移
- Day 1-2: 解决固定 ID 问题
- Day 3-4: 完成剩余 API 迁移
- Day 5: 测试和修复

### 第二周：Phase 3 - 文件处理
- Day 1-2: Excel 解析实现
- Day 3-4: HTML 解析增强
- Day 5: 其他文件类型支持

### 第三周：Phase 4 - 脚本引擎
- Day 1-3: JavaScript 运行时集成
- Day 4-5: 脚本编辑器实现

### 第四周：Phase 5 & 6
- Day 1-2: 数据处理功能
- Day 3-5: UI/UX 增强

## 测试计划

### 单元测试
- Rust 后端命令测试
- React 组件测试
- 工具函数测试

### 集成测试
- 端到端工作流测试
- 文件处理测试
- 数据导入导出测试

### 性能测试
- 大文件处理
- 批量数据操作
- 内存使用监控

## 风险评估

### 技术风险
1. **文件解析兼容性** - 某些特殊格式可能无法完全支持
2. **脚本执行安全性** - 需要严格的沙箱隔离
3. **性能瓶颈** - SQLite 在大数据量下的性能限制

### 缓解措施
1. 提供详细的文件格式支持文档
2. 实现严格的脚本权限控制
3. 考虑分片处理和索引优化

## 成功标准

1. **功能完整性** - 100% 原有功能实现
2. **性能指标** - 响应时间 < 200ms
3. **稳定性** - 崩溃率 < 0.1%
4. **用户满意度** - 保持原有用户体验

## 下一步行动

1. 开始 Phase 2 的实施
2. 创建详细的技术设计文档
3. 建立持续集成/部署流程