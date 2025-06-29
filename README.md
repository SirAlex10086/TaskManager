# 任务管理系统 MVP版本

一个基于React + Node.js + SQLite的任务管理系统，支持任务的创建、编辑、删除和状态管理。

## 🚀 功能特性

- ✅ 任务CRUD操作（创建、读取、更新、删除）
- ✅ 6种任务状态流转：待办 → 进行中 → 待验收 → 已验收
- ✅ 任务优先级管理（低、中、高）
- ✅ 负责人分配
- ✅ 自动时间跟踪（开始时间、完成时间）
- ✅ 响应式Web界面
- ✅ RESTful API接口

## 🛠️ 技术栈

### 前端
- React 19.1.0
- Ant Design 5.26.2
- Axios（HTTP客户端）
- 端口：4090

### 后端
- Node.js + Express
- Sequelize ORM
- SQLite数据库
- 端口：9090

## 📁 项目结构

```
TaskManager/
├── frontend/          # React前端项目
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Node.js后端项目
│   ├── index.js       # 服务器入口
│   ├── models/        # 数据模型
│   ├── routes/        # API路由
│   └── package.json
├── data/              # SQLite数据库文件
├── README.md
└── start.bat          # 一键启动脚本
```

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动应用

#### 方式一：一键启动（推荐）
```bash
# Windows
start.bat

# 或者双击 start.bat 文件
```

#### 方式二：分别启动
```bash
# 启动后端服务（端口9090）
cd backend
npm run dev

# 新开终端，启动前端服务（端口4090）
cd frontend
npm start
```

### 访问应用
- 前端界面：http://localhost:4090
- API文档：http://localhost:9090/api-docs

## 📊 API接口

### 任务管理
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建新任务
- `GET /api/tasks/:id` - 获取任务详情
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 统计信息
- `GET /api/tasks/stats/overview` - 获取任务统计概览
- `GET /api/tasks/stats/priority` - 获取优先级统计
- `GET /api/tasks/stats/status` - 获取状态统计

## 🗄️ 数据库

使用SQLite数据库，数据文件位于 `backend/data/tasks.db`

### 任务表结构
```sql
CREATE TABLE Tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(10) DEFAULT 'medium',
  assignee VARCHAR(50),
  project VARCHAR(50),
  startTime DATETIME,
  endTime DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

## 🎯 任务状态流转

```
待办(todo) → 进行中(in_progress) → 待验收(pending_review) → 已验收(reviewed) → 已完成(completed) → 已关闭(closed)
```

## 🔧 开发说明

### 目录说明
- `frontend/src/components/` - React组件
- `frontend/src/services/` - API服务
- `backend/models/` - 数据模型
- `backend/routes/` - API路由
- `backend/scripts/` - 数据库脚本

### 环境变量
后端支持以下环境变量（可选）：
```
PORT=9090
DB_PATH=./data/tasks.db
```

## 📝 更新日志

### v1.0.0 (2024-12-29)
- ✅ 完成MVP版本开发
- ✅ 实现任务CRUD功能
- ✅ 添加任务状态管理
- ✅ 集成Ant Design UI组件
- ✅ 完善API文档
- ✅ 添加一键启动脚本

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License