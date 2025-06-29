@echo off
chcp 65001 > nul
echo ========================================
echo    任务管理系统 - 一键启动脚本
echo ========================================
echo.

echo [1/3] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境检查通过

echo.
echo [2/3] 安装项目依赖...
echo 正在安装根目录依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 根目录依赖安装失败
    pause
    exit /b 1
)

echo 正在安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo 正在安装前端依赖...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

cd ..
echo ✅ 所有依赖安装完成

echo.
echo [3/3] 启动应用服务...
echo 🚀 正在启动后端服务 (端口: 9090)...
echo 🚀 正在启动前端服务 (端口: 4090)...
echo.
echo ========================================
echo  应用启动成功！
echo  前端地址: http://localhost:4090
echo  API文档: http://localhost:9090/api-docs
echo ========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

start "后端服务" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
start "前端服务" cmd /k "cd frontend && npm start"

echo 服务已在后台启动，可以关闭此窗口
pause