import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Typography,
  Space,
  Button,
  message
} from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 菜单项
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板'
    },
    {
      key: 'tasks',
      icon: <UnorderedListOutlined />,
      label: '任务列表'
    }
  ];

  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    setCurrentView(key);
  };

  // 处理新建任务
  const handleCreateTask = () => {
    setSelectedTask(null);
    setTaskFormVisible(true);
  };

  // 处理编辑任务
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskFormVisible(true);
    setTaskDetailVisible(false);
  };

  // 处理查看任务详情
  const handleViewTask = (taskId) => {
    setSelectedTaskId(taskId);
    setTaskDetailVisible(true);
  };

  // 处理任务表单成功
  const handleTaskFormSuccess = () => {
    setTaskFormVisible(false);
    setSelectedTask(null);
    setRefreshTrigger(prev => prev + 1);
    message.success('操作成功');
  };

  // 处理任务删除
  const handleTaskDelete = () => {
    setTaskDetailVisible(false);
    setSelectedTaskId(null);
    setRefreshTrigger(prev => prev + 1);
    message.success('删除成功');
  };

  // 渲染内容区域
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onTaskClick={handleViewTask} />;
      case 'tasks':
        return (
          <TaskList
            onEdit={handleEditTask}
            onView={handleViewTask}
            refreshTrigger={refreshTrigger}
          />
        );
      default:
        return <Dashboard onTaskClick={handleViewTask} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        theme="light"
        width={200}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[currentView]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout>
        {/* 顶部导航 */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            {currentView === 'dashboard' ? '仪表板' : '任务列表'}
          </Title>
          
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTask}
            >
              新建任务
            </Button>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content style={{ 
          margin: 0,
          background: '#f5f5f5',
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>

      {/* 任务表单弹窗 */}
      <TaskForm
        visible={taskFormVisible}
        task={selectedTask}
        onSuccess={handleTaskFormSuccess}
        onCancel={() => {
          setTaskFormVisible(false);
          setSelectedTask(null);
        }}
      />

      {/* 任务详情弹窗 */}
      <TaskDetail
        visible={taskDetailVisible}
        taskId={selectedTaskId}
        onEdit={handleEditTask}
        onDelete={handleTaskDelete}
        onCancel={() => {
          setTaskDetailVisible(false);
          setSelectedTaskId(null);
        }}
      />
    </Layout>
  );
}

export default App;