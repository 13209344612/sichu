# AI 私人厨师（私厨）

一个基于多模态大模型的 **AI 智能食谱推荐应用**。用户上传冰箱 / 食材照片（或输入食材清单），AI 会自动识别食材、联网搜索菜谱，并按「营养价值 + 制作难度」双维度打分排序，输出结构化的烹饪建议报告，支持流式输出与多轮会话记忆。

## ✨ 核心功能

- 📷 **图片识别食材**：上传食材照片，多模态模型自动辨识并评估新鲜度、可用量
- 🔍 **联网搜索菜谱**：通过 Tavily 实时检索可行菜谱
- 🏆 **智能打分排序**：从营养价值与制作难度双维度量化打分，简单又营养的排在前面
- 💬 **流式对话**：SSE 流式输出，边生成边显示
- 🧠 **会话记忆**：基于 LangGraph SQLite checkpoint，按 `thread_id` 持久化多轮上下文

## 🛠 技术栈

**后端**

| 类别 | 技术 |
|------|------|
| Web 框架 | FastAPI + Uvicorn |
| AI 编排 | LangChain `create_agent` + LangGraph |
| 大模型 | 通义千问 `qwen3-omni-flash`（多模态，DashScope OpenAI 兼容接口） |
| 联网搜索 | Tavily（`tavily_search` 工具） |
| 会话记忆 | LangGraph `SqliteSaver`（SQLite） |
| 图片存储 | 阿里云 OSS（后端签发预签名 URL，前端直传） |
| 依赖管理 | uv（`pyproject.toml` + `uv.lock`），Python >= 3.14 |

**前端**

- Next.js + React + TypeScript + TailwindCSS
- 构建产物已导出到 `app/static/`，由 FastAPI 统一托管（无需单独部署即可访问）

## 📁 项目结构

```
sichudemo/
├── app/                      # 后端主项目
│   ├── main.py               # 应用入口（CORS、路由、静态资源托管）
│   ├── agents/
│   │   └── personal_cheif.py # Agent：模型/工具/记忆初始化、流式对话、历史增删查
│   ├── api/v1/
│   │   ├── chat.py           # 对话接口 /chat/stream、/chat/messages
│   │   └── oss.py            # OSS 预签名接口 /oss/presign
│   ├── models/schemas.py     # 请求数据模型
│   ├── common/logger.py      # 日志配置
│   └── static/               # 前端构建产物（由后端托管）
├── 私厨-前端源码/             # 前端 Next.js 源码
├── db/                       # SQLite 会话数据库（运行后生成）
├── .env.example              # 环境变量模板
├── pyproject.toml            # 依赖定义
└── uv.lock
```

> 注：仓库中的 `marry-ai/`、`mail-friend/` 为无关的独立子项目，主项目为 `app/` 与 `私厨-前端源码/`。

## 🚀 快速开始

### 1. 环境要求

- Python >= 3.14
- [uv](https://docs.astral.sh/uv/)（推荐）或 pip
- Node.js（仅在需要重新构建前端时）

### 2. 安装依赖

```bash
# 使用 uv（推荐，会自动创建 .venv 并按 uv.lock 精确安装）
uv sync

# 或使用 pip
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -e .
```

### 3. 配置环境变量

复制模板并填入你自己的密钥：

```bash
# Windows PowerShell:
copy .env.example .env
# macOS/Linux:
# cp .env.example .env
```

然后编辑 `.env`，填写以下服务密钥（均需自行申请）：

| 变量 | 用途 | 获取地址 |
|------|------|---------|
| `DASHSCOPE_API_KEY` | 通义千问多模态模型 | https://bailian.console.aliyun.com/ |
| `TAVILY_API_KEY` | 联网搜索菜谱 | https://app.tavily.com/ |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS 鉴权 | 阿里云 AccessKey 管理 |
| `OSS_BUCKET` / `OSS_ENDPOINT` | OSS 存储桶与地域 | 阿里云 OSS 控制台 |

> ⚠️ `.env` 含敏感密钥，已被 `.gitignore` 忽略，**切勿提交到 Git**。

### 4. 准备数据库目录

会话记忆使用 SQLite，需确保项目根目录存在 `db/` 文件夹：

```bash
mkdir db
```

### 5. 启动后端

```bash
# 使用 uv:
uv run python -m app.main
# 或激活虚拟环境后:
python -m app.main
```

启动后访问：

- 前端页面：http://127.0.0.1:8001
- API 文档（Swagger）：http://127.0.0.1:8001/docs

## 🎨 前端开发（可选）

`app/static/` 已包含构建好的前端，直接访问后端即可使用。若需修改前端：

```bash
cd 私厨-前端源码
npm install
cp .env.local.example .env.local   # 按需配置 NEXT_PUBLIC_OSS_BUCKET
npm run dev                        # 开发模式，默认 http://localhost:3000
```

> 前端默认请求后端地址 `http://localhost:8001`（见 `lib/api.ts`），如后端端口不同需自行修改。
> 修改后可用 `npm run build` 重新构建，并将产物同步到 `app/static/`。

## 🔌 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/chat/stream` | 流式对话（食材识别 + 菜谱推荐） |
| GET | `/api/v1/chat/messages?thread_id=xxx` | 获取会话历史 |
| DELETE | `/api/v1/chat/messages?thread_id=xxx` | 清空会话历史 |
| GET | `/api/v1/oss/presign?filename=xxx` | 获取 OSS 图片上传预签名 URL |

## 📝 常见问题

- **启动报 `CredentialsEmptyError`**：`.env` 中缺少 `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`。
- **启动报 `unable to open database file`**：`db/` 目录不存在，执行 `mkdir db` 后重试。
- **AI 回复「无法访问搜索工具」**：`TAVILY_API_KEY` 无效（401）或网络无法访问 `api.tavily.com`，请到 Tavily 控制台重新生成密钥。
- **端口被占用**：修改 `app/main.py` 中 `uvicorn.run(...)` 的 `port` 参数。
