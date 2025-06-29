const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Swagger配置
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 导入数据库模型
const { sequelize, Task } = require('./models');
const { Op } = require('sequelize');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 9090;

// Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '任务管理系统 API',
      version: '1.0.0',
      description: '任务管理系统的完整API接口文档，提供任务管理、项目管理和统计功能'
    },
    servers: [{
      url: `http://localhost:${PORT}`,
      description: '开发环境'
    }],
    components: {
      schemas: {
        Task: {
          type: 'object',
          required: ['title'],
          properties: {
            id: {
              type: 'integer',
              description: '任务ID'
            },
            title: {
              type: 'string',
              description: '任务标题',
              maxLength: 100
            },
            description: {
              type: 'string',
              description: '任务描述'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: '优先级'
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'pending_review', 'approved', 'rejected_revision', 'cancelled'],
              description: '任务状态'
            },
            assignee: {
              type: 'string',
              description: '负责人'
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: '截止日期'
            },
            tags: {
              type: 'string',
              description: '标签'
            },
            estimated_hours: {
              type: 'number',
              description: '预计工时'
            },
            actual_hours: {
              type: 'number',
              description: '实际工时'
            },
            project_id: {
              type: 'string',
              description: '项目ID'
            },
            project_name: {
              type: 'string',
              description: '项目名称'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '项目ID'
            },
            name: {
              type: 'string',
              description: '项目名称'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              description: '响应数据'
            }
          }
        }
      }
    }
  },
  apis: ['./index.js', './routes/*.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置查询参数解析器以支持数组格式
const qs = require('qs');
app.set('query parser', function(str) {
  return qs.parse(str, { arrayLimit: 100 });
});

// Swagger UI中间件
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '任务管理系统 API 文档'
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 数据库初始化
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库结构（生产环境建议使用迁移）
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库表结构同步完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: 获取服务器信息
 *     description: 返回任务管理系统API服务器的基本信息
 *     tags: [系统信息]
 *     responses:
 *       200:
 *         description: 服务器信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 服务器描述
 *                 version:
 *                   type: string
 *                   description: API版本
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 当前时间戳
 *                 database:
 *                   type: string
 *                   description: 数据库类型
 *                 endpoints:
 *                   type: object
 *                   description: 可用的API端点
 */
// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '任务管理系统 API 服务器',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    endpoints: {
      health: '/api/health',
      tasks: '/api/tasks',
      stats: '/api/stats',
      projects: '/api/projects',
      docs: '/api-docs'
    }
  });
});

// API路由
app.use('/api/tasks', tasksRouter);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 系统健康检查
 *     description: 检查系统运行状态和数据库连接
 *     tags: [系统信息]
 *     responses:
 *       200:
 *         description: 系统正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                   description: 系统状态
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 检查时间
 *                 uptime:
 *                   type: number
 *                   description: 系统运行时间（秒）
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                       description: 数据库连接状态
 *                     taskCount:
 *                       type: integer
 *                       description: 任务总数
 *       500:
 *         description: 系统异常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   description: 错误信息
 */
// API健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    const taskCount = await Task.count();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        taskCount: taskCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: 获取任务统计信息
 *     description: 获取任务的状态统计、优先级统计和总体统计信息
 *     tags: [统计信息]
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 任务总数
 *                     completed:
 *                       type: integer
 *                       description: 已完成任务数
 *                     inProgress:
 *                       type: integer
 *                       description: 进行中任务数
 *                     completionRate:
 *                       type: integer
 *                       description: 完成率（百分比）
 *                     statusStats:
 *                       type: object
 *                       description: 按状态统计
 *                     priorityStats:
 *                       type: object
 *                       description: 按优先级统计
 *       500:
 *         description: 获取统计信息失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// 获取任务统计信息
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    const statusOptions = Task.getStatusOptions();
    
    // 按状态统计
    for (const option of statusOptions) {
      const count = await Task.count({ where: { status: option.value } });
      stats[option.value] = {
        count: count,
        label: option.label,
        color: option.color
      };
    }
    
    // 按优先级统计
    const priorityStats = {};
    const priorityOptions = Task.getPriorityOptions();
    for (const option of priorityOptions) {
      const count = await Task.count({ where: { priority: option.value } });
      priorityStats[option.value] = {
        count: count,
        label: option.label,
        color: option.color
      };
    }
    
    // 总体统计
    const totalTasks = await Task.count();
    const completedTasks = await Task.count({ where: { status: 'approved' } });
    const inProgressTasks = await Task.count({ where: { status: 'in_progress' } });
    
    res.json({
      success: true,
      data: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        statusStats: stats,
        priorityStats: priorityStats
      }
    });
    
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 获取项目列表
 *     description: 获取系统中所有不重复的项目列表
 *     tags: [项目管理]
 *     responses:
 *       200:
 *         description: 项目列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       500:
 *         description: 获取项目列表失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// 获取项目列表API
app.get('/api/projects', async (req, res) => {
  try {
    // 从数据库中获取所有不重复的项目名称
    const projects = await Task.findAll({
      attributes: [
        'project_name',
        [sequelize.fn('MAX', sequelize.col('project_id')), 'project_id']
      ],
      where: {
        project_name: {
          [Op.ne]: null
        }
      },
      group: ['project_name'],
      raw: true
    });

    // 格式化数据，为没有project_id的项目生成一个基于名称的ID
    const formattedProjects = projects.map(project => ({
      id: project.project_id || `auto_${project.project_name.replace(/\s+/g, '_').toLowerCase()}`,
      name: project.project_name
    }));

    res.json({
      success: true,
      data: formattedProjects
    });
    
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 启动服务器
async function startServer() {
  try {
    // 先初始化数据库
    await initializeDatabase();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功！`);
      console.log(`📍 本地访问地址: http://localhost:${PORT}`);
      console.log(`🕐 启动时间: ${new Date().toLocaleString()}`);
      console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 数据库: SQLite`);
      console.log(`📁 数据库文件: ./data/tasks.db`);
      console.log('\n🔗 可用的API端点:');
      console.log(`  GET  /              - 服务器信息`);
      console.log(`  GET  /api/health    - 健康检查`);
      console.log(`  GET  /api/stats     - 任务统计`);
      console.log(`  GET  /api/tasks     - 任务列表（即将实现）`);
      console.log('\n✅ 系统就绪，等待请求...');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中出错:', error);
    process.exit(1);
  }
});

// 启动应用
startServer();

module.exports = app;