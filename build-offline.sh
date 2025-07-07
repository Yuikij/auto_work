#!/bin/bash

# AutoWork 离线版本构建脚本
# 使用方法: ./build-offline.sh

set -e

echo "==========================================  "
echo "  AutoWork 离线版本构建脚本"
echo "=========================================="

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}检查构建依赖...${NC}"
    
    # 检查 Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}错误: 未找到 Java，请安装 JDK 8 或更高版本${NC}"
        exit 1
    fi
    
    # 检查 Maven
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}错误: 未找到 Maven，请安装 Maven${NC}"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js，请安装 Node.js${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到 npm，请安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}依赖检查完成${NC}"
}

# 清理构建目录
clean_build() {
    echo -e "${BLUE}清理构建目录...${NC}"
    
    # 清理前端构建目录
    if [ -d "auto_work_web/build" ]; then
        rm -rf auto_work_web/build
        echo "已清理前端构建目录"
    fi
    
    # 清理后端构建目录
    if [ -d "autowork-offline/target" ]; then
        rm -rf autowork-offline/target
        echo "已清理后端构建目录"
    fi
    
    # 清理发布目录
    if [ -d "release" ]; then
        rm -rf release
        echo "已清理发布目录"
    fi
    
    echo -e "${GREEN}清理完成${NC}"
}

# 构建前端
build_frontend() {
    echo -e "${BLUE}构建前端...${NC}"
    
    cd auto_work_web
    
    # 安装依赖
    echo "安装前端依赖..."
    npm install
    
    # 构建前端
    echo "构建前端项目..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo -e "${RED}前端构建失败${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}前端构建完成${NC}"
}

# 构建后端
build_backend() {
    echo -e "${BLUE}构建后端...${NC}"
    
    cd autowork-offline
    
    # Maven 构建
    echo "执行 Maven 构建..."
    mvn clean package -DskipTests
    
    if [ ! -f "target/autowork-offline-1.0.0.jar" ]; then
        echo -e "${RED}后端构建失败${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}后端构建完成${NC}"
}

# 创建发布包
create_release() {
    echo -e "${BLUE}创建发布包...${NC}"
    
    # 创建发布目录
    mkdir -p release/autowork-offline
    
    # 复制后端 JAR 文件
    cp autowork-offline/target/autowork-offline-1.0.0.jar release/autowork-offline/
    
    # 复制启动脚本
    cat > release/autowork-offline/start.sh << 'EOF'
#!/bin/bash
echo "启动 AutoWork 离线版..."
java -jar -Xmx512m autowork-offline-1.0.0.jar
EOF

    cat > release/autowork-offline/start.bat << 'EOF'
@echo off
echo 启动 AutoWork 离线版...
java -jar -Xmx512m autowork-offline-1.0.0.jar
pause
EOF

    # 设置执行权限
    chmod +x release/autowork-offline/start.sh
    
    # 复制文档
    cp OFFLINE_VERSION_DESIGN.md release/autowork-offline/
    cp QUICK_START_OFFLINE.md release/autowork-offline/
    cp OFFLINE_VERSION_MIGRATION.md release/autowork-offline/
    
    # 创建 README
    cat > release/autowork-offline/README.md << 'EOF'
# AutoWork 离线版

## 快速开始

### Windows
双击 `start.bat` 启动应用

### Linux/macOS
执行 `./start.sh` 启动应用

### 手动启动
```bash
java -jar autowork-offline-1.0.0.jar
```

启动后访问: http://localhost:18080

## 系统要求

- Java 8 或更高版本
- 内存: 最少 512MB，推荐 1GB
- 磁盘空间: 最少 200MB

## 文档

- [快速开始指南](QUICK_START_OFFLINE.md)
- [系统设计文档](OFFLINE_VERSION_DESIGN.md)  
- [数据迁移指南](OFFLINE_VERSION_MIGRATION.md)

## 支持

如有问题，请查看文档或联系技术支持。
EOF

    echo -e "${GREEN}发布包创建完成${NC}"
}

# 创建压缩包
create_archive() {
    echo -e "${BLUE}创建压缩包...${NC}"
    
    cd release
    
    # 创建 ZIP 压缩包
    zip -r autowork-offline-$(date +%Y%m%d).zip autowork-offline/
    
    # 创建 tar.gz 压缩包
    tar -czf autowork-offline-$(date +%Y%m%d).tar.gz autowork-offline/
    
    cd ..
    
    echo -e "${GREEN}压缩包创建完成${NC}"
    echo -e "${YELLOW}发布文件位置: release/${NC}"
    ls -la release/*.zip release/*.tar.gz 2>/dev/null || true
}

# 运行测试
run_tests() {
    echo -e "${BLUE}运行测试...${NC}"
    
    # 启动应用进行健康检查
    echo "启动应用进行健康检查..."
    java -jar autowork-offline/target/autowork-offline-1.0.0.jar &
    APP_PID=$!
    
    # 等待应用启动
    echo "等待应用启动..."
    sleep 15
    
    # 健康检查
    if curl -f http://localhost:18080/api/offline/health > /dev/null 2>&1; then
        echo -e "${GREEN}健康检查通过${NC}"
    else
        echo -e "${RED}健康检查失败${NC}"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
    
    # 关闭应用
    kill $APP_PID 2>/dev/null || true
    sleep 3
    
    echo -e "${GREEN}测试完成${NC}"
}

# 主函数
main() {
    echo -e "${YELLOW}开始构建 AutoWork 离线版本...${NC}"
    echo "构建时间: $(date)"
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 清理构建目录
    clean_build
    
    # 构建前端
    build_frontend
    
    # 构建后端
    build_backend
    
    # 运行测试
    run_tests
    
    # 创建发布包
    create_release
    
    # 创建压缩包
    create_archive
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "  AutoWork 离线版本构建完成！"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${YELLOW}发布包位置: release/${NC}"
    echo -e "${YELLOW}安装包: release/autowork-offline-$(date +%Y%m%d).zip${NC}"
    echo -e "${YELLOW}源码包: release/autowork-offline-$(date +%Y%m%d).tar.gz${NC}"
    echo ""
    echo -e "${BLUE}快速启动:${NC}"
    echo "cd release/autowork-offline"
    echo "./start.sh  # Linux/macOS"
    echo "start.bat   # Windows"
    echo ""
    echo -e "${BLUE}访问地址: http://localhost:18080${NC}"
}

# 执行主函数
main "$@"