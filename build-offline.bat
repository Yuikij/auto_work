@echo off
chcp 65001
echo ==========================================
echo    Auto Work 离线版本构建脚本
echo ==========================================
echo.

REM 检查当前目录
if not exist "auto_work_web" (
    echo 错误：未找到前端项目目录 auto_work_web
    echo 请在项目根目录下运行此脚本
    pause
    exit /b 1
)

if not exist "soukon-auto-work" (
    echo 错误：未找到后端项目目录 soukon-auto-work
    echo 请在项目根目录下运行此脚本
    pause
    exit /b 1
)

echo 步骤 1/4: 清理之前的构建产物
echo ==========================================
if exist "soukon-auto-work\target" rmdir /s /q "soukon-auto-work\target"
if exist "auto_work_web\build" rmdir /s /q "auto_work_web\build"
if exist "soukon-auto-work\src\main\resources\static" rmdir /s /q "soukon-auto-work\src\main\resources\static"
mkdir "soukon-auto-work\src\main\resources\static"
echo 清理完成
echo.

echo 步骤 2/4: 构建前端项目
echo ==========================================
cd auto_work_web

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo 前端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
)

echo 正在构建前端项目...
call npm run build
if errorlevel 1 (
    echo 前端构建失败！
    cd ..
    pause
    exit /b 1
)

echo 正在复制前端静态资源到后端...
xcopy /E /I /Y "build\*" "..\soukon-auto-work\src\main\resources\static\"
if errorlevel 1 (
    echo 复制静态资源失败！
    cd ..
    pause
    exit /b 1
)

cd ..
echo 前端构建完成
echo.

echo 步骤 3/4: 构建后端项目
echo ==========================================
cd soukon-auto-work

echo 正在构建后端项目...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo 后端构建失败！
    cd ..
    pause
    exit /b 1
)

cd ..
echo 后端构建完成
echo.

echo 步骤 4/4: 检查构建结果
echo ==========================================
if exist "soukon-auto-work\target\auto-work-offline.jar" (
    echo ✓ JAR 文件已生成: soukon-auto-work\target\auto-work-offline.jar
) else (
    echo ✗ JAR 文件生成失败
)

if exist "soukon-auto-work\target\AutoWork-Offline-1.0-offline.exe" (
    echo ✓ EXE 文件已生成: soukon-auto-work\target\AutoWork-Offline-1.0-offline.exe
) else (
    echo ✗ EXE 文件生成失败，可能需要配置 Launch4j
)

echo.
echo ==========================================
echo         构建完成！
echo ==========================================
echo.
echo 生成的文件位置：
echo 1. JAR 文件: soukon-auto-work\target\auto-work-offline.jar
echo 2. EXE 文件: soukon-auto-work\target\AutoWork-Offline-1.0-offline.exe (如果Launch4j配置正确)
echo.
echo 运行方式：
echo 1. 使用 JAR: java -jar soukon-auto-work\target\auto-work-offline.jar
echo 2. 使用 EXE: 直接双击 AutoWork-Offline-1.0-offline.exe
echo.
echo 数据存储位置：
echo - 数据库: data\auto_work.db
echo - 日志: logs\auto-work.log
echo - 上传文件: uploads\
echo - 导出文件: exports\
echo.
pause