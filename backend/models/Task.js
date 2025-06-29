const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '任务标题不能为空'
        },
        len: {
          args: [1, 100],
          msg: '任务标题长度必须在1-100个字符之间'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务详细描述'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
      comment: '任务优先级：low-低，medium-中，high-高'
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'pending_review', 'approved', 'rejected_revision', 'cancelled'),
      defaultValue: 'todo',
      allowNull: false,
      comment: '任务状态：todo-待办，in_progress-进行中，pending_review-待验收，approved-已验收，rejected_revision-验收不通过待修改，cancelled-已取消'
    },
    assignee: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '任务负责人'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '截止日期'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始时间，状态改为进行中时自动更新'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '完成时间，状态改为已验收时自动更新'
    },
    tags: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '任务标签，用逗号分隔'
    },
    estimated_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '预估工时（小时）'
    },
    actual_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '实际工时（小时）'
    },
    project_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '所属项目ID'
    },
    project_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所属项目名称'
    }
  }, {
    tableName: 'tasks',
    timestamps: true, // 自动管理created_at和updated_at
    underscored: true, // 使用下划线命名
    hooks: {
      // 创建前的钩子
      beforeCreate: (task, options) => {
        console.log(`📝 创建新任务: ${task.title}`);
      },
      
      // 更新前的钩子 - 处理状态变更时的时间字段自动更新
      beforeUpdate: (task, options) => {
        const previousStatus = task._previousDataValues.status;
        const currentStatus = task.status;
        
        console.log(`🔄 任务状态变更: ${task.title} (${previousStatus} → ${currentStatus})`);
        
        // 状态改为进行中时，自动设置开始时间
        if (currentStatus === 'in_progress' && previousStatus !== 'in_progress' && !task.started_at) {
          task.started_at = new Date();
          console.log(`⏰ 自动设置开始时间: ${task.started_at}`);
        }
        
        // 状态改为已验收时，自动设置完成时间
        if (currentStatus === 'approved' && previousStatus !== 'approved') {
          task.completed_at = new Date();
          console.log(`✅ 自动设置完成时间: ${task.completed_at}`);
        }
        
        // 如果从已验收状态改为其他状态，清除完成时间
        if (previousStatus === 'approved' && currentStatus !== 'approved') {
          task.completed_at = null;
          console.log(`🔄 清除完成时间`);
        }
        
        // 如果从进行中状态改为待办，清除开始时间
        if (previousStatus === 'in_progress' && currentStatus === 'todo') {
          task.started_at = null;
          console.log(`🔄 清除开始时间`);
        }
      },
      
      // 更新后的钩子
      afterUpdate: (task, options) => {
        console.log(`✅ 任务更新完成: ${task.title}`);
      }
    },
    
    // 实例方法
    instanceMethods: {
      // 获取状态的中文显示
      getStatusText() {
        const statusMap = {
          'todo': '待办',
          'in_progress': '进行中',
          'pending_review': '待验收',
          'approved': '已验收',
          'rejected_revision': '验收不通过-待修改',
          'cancelled': '已取消'
        };
        return statusMap[this.status] || this.status;
      },
      
      // 获取优先级的中文显示
      getPriorityText() {
        const priorityMap = {
          'low': '低',
          'medium': '中',
          'high': '高'
        };
        return priorityMap[this.priority] || this.priority;
      },
      
      // 计算任务耗时（如果已完成）
      getDuration() {
        if (this.started_at && this.completed_at) {
          const duration = new Date(this.completed_at) - new Date(this.started_at);
          return Math.round(duration / (1000 * 60 * 60 * 24 * 100)) / 100; // 返回天数，保留2位小数
        }
        return null;
      }
    }
  });
  
  // 类方法
  Task.getStatusOptions = function() {
    return [
      { value: 'todo', label: '待办', color: 'default' },
      { value: 'in_progress', label: '进行中', color: 'processing' },
      { value: 'pending_review', label: '待验收', color: 'warning' },
      { value: 'approved', label: '已验收', color: 'success' },
      { value: 'rejected_revision', label: '验收不通过-待修改', color: 'error' },
      { value: 'cancelled', label: '已取消', color: 'default' }
    ];
  };
  
  Task.getPriorityOptions = function() {
    return [
      { value: 'low', label: '低', color: 'green' },
      { value: 'medium', label: '中', color: 'orange' },
      { value: 'high', label: '高', color: 'red' }
    ];
  };
  
  return Task;
};