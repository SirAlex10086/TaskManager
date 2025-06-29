const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 创建Sequelize实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/tasks.db'),
  logging: console.log, // 开发环境显示SQL日志
  define: {
    timestamps: true, // 自动添加createdAt和updatedAt
    underscored: true, // 使用下划线命名
    freezeTableName: true // 禁用表名复数化
  }
});

// 导入模型
const Task = require('./Task')(sequelize);

// 定义关联关系（如果需要的话）
// Task.hasMany(Comment);
// Comment.belongsTo(Task);

// 导出模型和sequelize实例
module.exports = {
  sequelize,
  Task
};

// 数据库连接测试
sequelize.authenticate()
  .then(() => {
    console.log('✅ 数据库连接成功');
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err);
  });