## 项目简介
`Web Admin Fullstack Template` 是一个现代化的全栈后台管理系统模板，开箱即用的账号/权限/组织结构管理与导出能力，适合作为中后台项目的起点。

## 适用场景
- 企业内部系统的后台基建
- 中后台项目的快速起步
- 教学/练手的全栈范例

## 主要特性
- 前后端分离：React 18 + NestJS
- 权限体系：角色、权限、账号
- 组织结构：部门、岗位
- 导入/导出任务：支持 CSV/XLSX
- 多Tabs管理：支持标签页的缓存、关闭、刷新、移动
- CRUD封装：基于antd pro-components 快速搭建表格类增上改查
- Docker 化部署：一条命令起完整服务

## 核心功能
- 登录与权限控制（RBAC）
- 账号管理、角色管理、权限管理
- 部门/岗位组织结构
- 操作日志与导出任务
- Swagger API 文档

## 技术栈
- 前端：React 18、Vite（rolldown-vite）、Antd
- 后端：NestJS 11、Prisma、PostgreSQL、Redis
- 运维：Docker Compose、Nginx

## 目录结构
- `frontend/react18` 前端应用
- `backend/nestjs` 后端服务
- `deploy` Docker Compose 与 Nginx 配置
- `deploy/elk` 可选 ELK 日志栈
- `docs` 说明文档

## 快速开始（Docker）
默认会自动执行 `migrate` + `seed`，并启动前后端。

```bash
DOCKER_BUILDKIT=1 docker compose -f deploy/docker-compose.yml up -d --build
```

访问地址：
- 前端：`http://localhost:8080`
- 后端：`http://localhost:3031`
- Swagger：`http://localhost:3031/api-docs`

默认账号（来自 seed）：
- `admin / password123`

注意：`seed` 会清空并重建数据。若不希望每次启动都重置数据，可移除 `deploy/docker-compose.yml` 中的 `seed` 服务或改为手动执行。

## 本地开发（不使用 Docker）
前置依赖：
- Node.js 22
- pnpm
- PostgreSQL 16
- Redis 7

安装依赖：
```bash
pnpm install
```

后端配置：
- 编辑 `backend/nestjs/.env`，确保 `DATABASE_URL`、`REDIS_HOST`、`REDIS_PORT` 正确
- 生成 Prisma Client：
```bash
pnpm -C backend/nestjs exec prisma generate
```
- 迁移数据库：
```bash
pnpm -C backend/nestjs exec prisma migrate dev
```
- 可选：初始化数据
```bash
pnpm -C backend/nestjs exec ts-node src/seed.ts
```
- 启动后端：
```bash
pnpm -C backend/nestjs start:dev
```

前端启动：
```bash
pnpm -C frontend/react18 dev
```

## 环境变量说明
后端（`backend/nestjs/.env`）：
- `DATABASE_URL` 数据库连接串
- `REDIS_HOST`、`REDIS_PORT`

前端（构建时注入）：
- `VITE_APP_BASE` 部署路径
- `VITE_APP_API_BASE` 接口地址（默认 `/api`）

## 可选：ELK 日志栈
```bash
docker compose -f deploy/elk/docker-compose.yml up -d
```
说明文档：`docs/系统日志.md`

## 可选：服务监控 + 全链路追踪（Metrics + Tracing）
```bash
docker compose -f deploy/observability/docker-compose.yml up -d
```

访问地址：
- Grafana：`http://localhost:3000`（默认 `admin / admin`）

说明文档：`docs/可观测性.md`

## API 约定
- API 全局前缀：`/api`
- Swagger 路径：`/api-docs`

## 开发约定
- 前端接口统一走 `VITE_APP_API_BASE`
- 生产环境建议使用 Nginx 反向代理 `/api`

## 贡献
欢迎提 PR 或 Issue。请确保：
- 提交前通过构建与基础功能自测
- 变更包含必要的说明与文档更新
 - 如涉及数据库变更，请附带 migration

## License
MIT






