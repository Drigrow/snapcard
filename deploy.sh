#!/usr/bin/env bash

# ==============================================================================
# SnapCard · 随手查图文知识卡片 - Linux 一键鲁棒部署脚本
# 支持: Ubuntu / Debian / CentOS / RHEL / Rocky Linux / Arch
# 包含: Node.js 环境检测、依赖自动安装、前端编译、PM2 守护进程配置、开机自启
# ==============================================================================

set -eo pipefail

# --- 样式与颜色定义 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info() {
    echo -e "${CYAN}${BOLD}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}${BOLD}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}${BOLD}[ERROR]${NC} $1"
    exit 1
}

# --- 标题 Banner ---
echo -e "${BLUE}${BOLD}"
echo "================================================================"
echo "    🎴 SnapCard · 随手查图文知识卡片 一键生产部署程序          "
echo "    Powered by Gemini 3.7 Flash & Tavily Search (Node.js/PM2)   "
echo "================================================================"
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- 1. 检测系统与 root/sudo 权限 ---
info "正在检查运行环境与系统架构..."
ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" != "Linux" ]; then
    warn "当前系统不是 Linux ($OS)，脚本将尝试以通用模式继续执行。"
fi

# --- 2. 检测并安装 Node.js 与 npm ---
REQUIRED_NODE_MAJOR=20

check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VER=$(node -v | sed 's/v//')
        NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
        if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]; then
            info "检测到 Node.js 版本: v$NODE_VER (>= v$REQUIRED_NODE_MAJOR.x.x ✅)"
            return 0
        else
            warn "当前 Node.js 版本 v$NODE_VER 偏低，建议升级至 >= v$REQUIRED_NODE_MAJOR"
            return 1
        fi
    else
        warn "未检测到 Node.js，准备自动安装..."
        return 1
    fi
}

if ! check_node; then
    info "正在尝试通过 NodeSource 自动安装 Node.js LTS (v22.x)..."
    if [ -f /etc/debian_version ]; then
        sudo apt-get update -y
        sudo apt-get install -y curl ca-certificates gnupg build-essential
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y curl gcc-c++ make
        curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm nodejs npm
    else
        error "无法自动识别包管理器，请手动安装 Node.js >= 20.x 后重新运行本脚本。"
    fi

    if ! check_node; then
        error "Node.js 安装失败，请检查网络或权限。"
    fi
fi

# --- 3. 检查并准备 .env 文件 ---
info "正在检查环境变量配置 (.env)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        info "未发现 .env，正在从 .env.example 自动生成..."
        cp .env.example .env
        success "已生成 .env 文件，稍后可在网页端「设置」中输入 API Key，或直接编辑 .env"
    else
        cat << 'EOF' > .env
PORT=3001
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-3.7-flash
OPENROUTER_IMAGE_MODEL=google/gemini-3.1-flash-lite-image
TAVILY_API_KEY=
DATA_DIR=./data
UPLOAD_DIR=./uploads
JWT_SECRET=snapcard-production-auth-key-2026
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
EOF
        success "已创建基础 .env 配置文件"
    fi
fi

# 确保数据存储目录存在并设置权限
mkdir -p data uploads/photos uploads/generated
chmod -R 755 data uploads

# --- 4. 安装项目依赖 ---
info "正在安装项目 npm 依赖 (如网络较慢可配置 npm 镜像)..."
npm install --no-audit --fund=false

# --- 5. 编译前端生产静态资源 ---
info "正在构建前端生产包 (Vite Build)..."
npm run build
success "前端构建成功！静态资源位于 dist/ 目录"

# --- 6. 检测并安装 PM2 进程守护工具 ---
info "检查 PM2 守护进程管理器..."
if ! command -v pm2 >/dev/null 2>&1; then
    info "正在全局安装 PM2..."
    npm install -g pm2 || sudo npm install -g pm2
fi

# --- 7. 启动/重启 PM2 守护服务 ---
info "正在启动 SnapCard 守护进程..."

# 如果已有旧进程先重启，否则新建启动
if pm2 list | grep -q "snapcard"; then
    info "发现已有 snapcard 进程，正在热重启..."
    pm2 restart ecosystem.config.cjs || pm2 restart snapcard
else
    info "正在创建新的 PM2 进程..."
    pm2 start ecosystem.config.cjs
fi

# 保存 PM2 进程列表以便开机自启
pm2 save || true

# --- 8. 健康检查 ---
info "正在验证服务运行状态..."
sleep 3

PORT_IN_USE=$(grep -E "^PORT=" .env | cut -d= -f2 || echo "3001")
PORT_IN_USE=${PORT_IN_USE:-3001}

if curl -s "http://127.0.0.1:${PORT_IN_USE}/health" | grep -q "ok"; then
    success "SnapCard 服务启动成功，健康检查通过！"
else
    warn "健康检查未立即返回 ok，请运行 'pm2 logs snapcard' 查看日志。"
fi

# --- 9. 部署完成输出 ---
SERVER_IP=$(curl -s -m 2 ifconfig.me || hostname -I | awk '{print $1}' || echo "你的服务器IP")

echo -e "\n${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 SnapCard 部署与长期运行配置完成！${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
echo -e "${BOLD}▶ 访问地址:${NC}      http://${SERVER_IP}:${PORT_IN_USE} (或本地 http://localhost:${PORT_IN_USE})"
echo -e "${BOLD}▶ 默认管理员:${NC}    账号: admin  密码: admin123"
echo -e "${BOLD}▶ 守护进程名:${NC}    snapcard (PM2 Managed)"
echo ""
echo -e "${CYAN}${BOLD}常用运维命令:${NC}"
echo -e "  查看实时日志:   ${YELLOW}pm2 logs snapcard${NC}"
echo -e "  查看运行状态:   ${YELLOW}pm2 status${NC}"
echo -e "  重启服务:       ${YELLOW}pm2 restart snapcard${NC}"
echo -e "  停止服务:       ${YELLOW}pm2 stop snapcard${NC}"
echo -e "  开机自启配置:   ${YELLOW}pm2 startup${NC} (按提示执行命令)"
echo -e "${GREEN}${BOLD}================================================================${NC}\n"
