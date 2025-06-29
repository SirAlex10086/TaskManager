const express = require('express');
const router = express.Router();
const { Task } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/tasks/projects:
 *   get:
 *     summary: 获取项目列表
 *     description: 获取数据库中所有不重复的项目信息
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 获取项目列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 */
// GET /api/tasks/projects - 获取项目列表
router.get('/projects', async (req, res) => {
  try {
    const projects = await Task.findAll({
      attributes: [
        ['project_id', 'id'],
        ['project_name', 'name']
      ],
      where: {
        project_id: { [Op.not]: null },
        project_name: { [Op.not]: null }
      },
      group: ['project_id', 'project_name'],
      order: [['project_name', 'ASC']]
    });

    res.json({
      success: true,
      data: projects.map(p => ({
        id: p.dataValues.id,
        name: p.dataValues.name
      }))
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

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: 获取任务列表
 *     description: 获取任务列表，支持分页、筛选、搜索和排序
 *     tags: [任务管理]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, pending_review, approved, rejected_revision, cancelled]
 *         description: 按状态筛选
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: 按优先级筛选
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *         description: 按负责人筛选（模糊匹配）
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（标题、描述、标签）
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 任务列表获取成功
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 总记录数
 *                     page:
 *                       type: integer
 *                       description: 当前页码
 *                     limit:
 *                       type: integer
 *                       description: 每页数量
 *                     totalPages:
 *                       type: integer
 *                       description: 总页数
 *                     hasNext:
 *                       type: boolean
 *                       description: 是否有下一页
 *                     hasPrev:
 *                       type: boolean
 *                       description: 是否有上一页
 *                 filters:
 *                   type: object
 *                   description: 当前筛选条件
 *       500:
 *         description: 获取任务列表失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// GET /api/tasks - 获取任务列表
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      project_id,
      assignee,
      search,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // 调试日志：打印接收到的查询参数
    console.log('🔍 接收到的查询参数:', {
      status: status,
      statusType: typeof status,
      statusIsArray: Array.isArray(status),
      priority: priority,
      priorityType: typeof priority,
      project_id: project_id,
      assignee: assignee,
      search: search,
      page: page,
      limit: limit
    });

    // 构建查询条件
    const where = {};
    
    // 支持多选筛选
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      where.status = { [Op.in]: statusArray };
      console.log('✅ 添加状态筛选:', statusArray);
    }
    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      where.priority = { [Op.in]: priorityArray };
      console.log('✅ 添加优先级筛选:', priorityArray);
    }
    if (project_id) {
      const projectArray = Array.isArray(project_id) ? project_id : [project_id];
      where.project_id = { [Op.in]: projectArray };
      console.log('✅ 添加项目筛选:', projectArray);
    }
    if (assignee) {
      where.assignee = { [Op.like]: `%${assignee}%` };
      console.log('✅ 添加负责人筛选:', assignee);
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } }
      ];
    }

    // 打印最终的where条件
    console.log('🎯 最终查询条件:', JSON.stringify(where, null, 2));

    // 分页参数
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // 查询任务
    const result = await Task.findAndCountAll({
      where,
      limit: limitNum,
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        exclude: [] // 包含所有字段
      }
    });

    // 格式化响应数据
    const tasks = result.rows.map(task => {
      const taskData = task.toJSON();
      return {
        ...taskData,
        statusText: task.getStatusText ? task.getStatusText() : taskData.status,
        priorityText: task.getPriorityText ? task.getPriorityText() : taskData.priority,
        duration: task.getDuration ? task.getDuration() : null
      };
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total: result.count,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(result.count / limitNum),
        hasNext: parseInt(page) < Math.ceil(result.count / limitNum),
        hasPrev: parseInt(page) > 1
      },
      filters: {
        status,
        priority,
        assignee,
        search
      }
    });

  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: 获取单个任务详情
 *     description: 根据任务ID获取任务的详细信息
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 获取任务详情失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// GET /api/tasks/:id - 获取单个任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const taskData = task.toJSON();
    res.json({
      success: true,
      data: {
        ...taskData,
        statusText: task.getStatusText ? task.getStatusText() : taskData.status,
        priorityText: task.getPriorityText ? task.getPriorityText() : taskData.priority,
        duration: task.getDuration ? task.getDuration() : null
      }
    });

  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: 创建新任务
 *     description: 创建一个新的任务
 *     tags: [任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: 任务标题
 *                 example: "完成API文档编写"
 *               description:
 *                 type: string
 *                 description: 任务描述
 *                 example: "为所有API接口编写详细的Swagger文档"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: 任务优先级
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, pending_review, approved, rejected_revision, cancelled]
 *                 default: todo
 *                 description: 任务状态
 *               assignee:
 *                 type: string
 *                 description: 负责人
 *                 example: "张三"
 *               project_name:
 *                 type: string
 *                 description: 项目名称
 *                 example: "任务管理系统"
 *               project_id:
 *                 type: string
 *                 description: 项目ID
 *                 example: "TMS-001"
 *               tags:
 *                 type: string
 *                 description: 标签（逗号分隔）
 *                 example: "文档,API,开发"
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: 截止日期
 *                 example: "2024-12-31"
 *     responses:
 *       201:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "任务创建成功"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 创建任务失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// POST /api/tasks - 创建新任务
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      status = 'todo',
      assignee,
      due_date,
      tags,
      estimated_hours,
      project_id,
      project_name
    } = req.body;

    // 数据验证
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        message: '任务标题长度不能超过100个字符'
      });
    }

    // 验证枚举值
    const validPriorities = ['low', 'medium', 'high'];
    const validStatuses = ['todo', 'in_progress', 'pending_review', 'approved', 'rejected_revision', 'cancelled'];
    
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: '无效的优先级值'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    // 创建任务
    const taskData = {
      title: title.trim(),
      description: description ? description.trim() : null,
      priority,
      status,
      assignee: assignee ? assignee.trim() : null,
      due_date: due_date ? new Date(due_date) : null,
      tags: tags ? tags.trim() : null,
      estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
      project_id: project_id ? project_id.trim() : null,
      project_name: project_name ? project_name.trim() : null
    };

    const task = await Task.create(taskData);
    
    console.log(`✅ 创建新任务: ${task.title} (ID: ${task.id})`);

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: {
        ...task.toJSON(),
        statusText: task.getStatusText ? task.getStatusText() : task.status,
        priorityText: task.getPriorityText ? task.getPriorityText() : task.priority
      }
    });

  } catch (error) {
    console.error('创建任务失败:', error);
    
    // 处理Sequelize验证错误
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: 更新任务
 *     description: 根据任务ID更新任务信息
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 任务标题
 *               description:
 *                 type: string
 *                 description: 任务描述
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: 任务优先级
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, pending_review, approved, rejected_revision, cancelled]
 *                 description: 任务状态
 *               assignee:
 *                 type: string
 *                 description: 负责人
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: 截止日期
 *               tags:
 *                 type: string
 *                 description: 标签（逗号分隔）
 *               estimated_hours:
 *                 type: number
 *                 description: 预估工时
 *               actual_hours:
 *                 type: number
 *                 description: 实际工时
 *               project_id:
 *                 type: string
 *                 description: 项目ID
 *               project_name:
 *                 type: string
 *                 description: 项目名称
 *     responses:
 *       200:
 *         description: 任务更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "任务更新成功"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 更新任务失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// PUT /api/tasks/:id - 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      assignee,
      due_date,
      tags,
      estimated_hours,
      actual_hours,
      project_id,
      project_name
    } = req.body;

    // 查找任务
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 记录原始状态用于日志
    const originalStatus = task.status;

    // 数据验证
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '任务标题不能为空'
        });
      }
      if (title.length > 100) {
        return res.status(400).json({
          success: false,
          message: '任务标题长度不能超过100个字符'
        });
      }
    }

    // 验证枚举值
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: '无效的优先级值'
        });
      }
    }

    if (status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'pending_review', 'approved', 'rejected_revision', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }
    }

    // 构建更新数据
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (assignee !== undefined) updateData.assignee = assignee ? assignee.trim() : null;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (tags !== undefined) updateData.tags = tags ? tags.trim() : null;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours ? parseFloat(estimated_hours) : null;
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours ? parseFloat(actual_hours) : null;
    if (project_id !== undefined) updateData.project_id = project_id ? project_id.trim() : null;
    if (project_name !== undefined) updateData.project_name = project_name ? project_name.trim() : null;

    // 更新任务
    await task.update(updateData);
    
    // 重新加载任务以获取最新数据
    await task.reload();

    console.log(`🔄 更新任务: ${task.title} (ID: ${task.id}, 状态: ${originalStatus} → ${task.status})`);

    res.json({
      success: true,
      message: '任务更新成功',
      data: {
        ...task.toJSON(),
        statusText: task.getStatusText ? task.getStatusText() : task.status,
        priorityText: task.getPriorityText ? task.getPriorityText() : task.priority,
        duration: task.getDuration ? task.getDuration() : null
      }
    });

  } catch (error) {
    console.error('更新任务失败:', error);
    
    // 处理Sequelize验证错误
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: '更新任务失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: 删除任务
 *     description: 根据任务ID删除任务
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "任务删除成功"
 *       404:
 *         description: 任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 删除任务失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// DELETE /api/tasks/:id - 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const taskTitle = task.title;
    await task.destroy();
    
    console.log(`🗑️ 删除任务: ${taskTitle} (ID: ${id})`);

    res.json({
      success: true,
      message: '任务删除成功'
    });

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    });
  }
});

// PATCH /api/tasks/:id/status - 快速更新任务状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态值不能为空'
      });
    }

    const validStatuses = ['todo', 'in_progress', 'pending_review', 'approved', 'rejected_revision', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    const originalStatus = task.status;
    await task.update({ status });
    await task.reload();

    console.log(`🔄 快速更新任务状态: ${task.title} (${originalStatus} → ${status})`);

    res.json({
      success: true,
      message: '任务状态更新成功',
      data: {
        id: task.id,
        status: task.status,
        statusText: task.getStatusText ? task.getStatusText() : task.status,
        started_at: task.started_at,
        completed_at: task.completed_at
      }
    });

  } catch (error) {
    console.error('更新任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务状态失败',
      error: error.message
    });
  }
});

// GET /api/tasks/options/status - 获取状态选项
router.get('/options/status', (req, res) => {
  try {
    const statusOptions = Task.getStatusOptions();
    res.json({
      success: true,
      data: statusOptions
    });
  } catch (error) {
    console.error('获取状态选项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取状态选项失败',
      error: error.message
    });
  }
});

// GET /api/tasks/options/priority - 获取优先级选项
router.get('/options/priority', (req, res) => {
  try {
    const priorityOptions = Task.getPriorityOptions();
    res.json({
      success: true,
      data: priorityOptions
    });
  } catch (error) {
    console.error('获取优先级选项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取优先级选项失败',
      error: error.message
    });
  }
});

module.exports = router;