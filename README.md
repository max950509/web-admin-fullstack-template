# Web Admin Fullstack Template

一个现代、开箱即用的全栈后台管理系统模板，内置了完整的用户、角色、权限管理体系，并集成了强大的可观测性与自动部署能力。它是您启动企业级中后台项目的理想选择。

[![Live Demo](https://img.shields.io/badge/Demo-Online-brightgreen)](http://120.27.143.170:8080/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 核心特性

*   **现代技术栈**: 前端采用 **React 18 + Vite + Ant Design**, 后端采用 **NestJS + Prisma**，强强联合，开发体验优秀。
*   **完备的权限系统**: 内置基于 **RBAC** 的用户、角色、权限管理，支持菜单、页面、操作三级权限控制。
*   **组织架构**: 支持多级部门和岗位管理，满足复杂组织需求。
*   **强大的异步任务**: 基于 **BullMQ 和 Redis** 的异步任务队列，轻松处理耗时操作（如数据导出）。
*   **一流的可观测性**: 集成 **OpenTelemetry、Prometheus、Grafana 和 Tempo**，提供全链路追踪、指标监控和日志聚合。
*   **容器化与一键部署**: 使用 **Docker Compose** 编排，一条命令即可启动包括数据库、缓存、前后端在内的完整服务。
*   **优秀的前端体验**: 基于 Ant Design Pro Components 封装，支持多标签页缓存（KeepAlive）、动态路由和配置化 CRUD 页面。

## 🚀 快速开始

本项目推荐使用 Docker 进行一键部署。

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-repo/web-admin-fullstack-template.git
    cd web-admin-fullstack-template
    ```

2.  **启动服务**
    ```bash
    docker compose -f deploy/docker-compose.yml up -d --build
    ```
    此命令会自动构建镜像，并启动所有核心服务。首次启动会自动执行数据库迁移和数据填充（seed）。

3.  **访问系统**
    *   **前端应用**: `http://localhost:8080`
    *   **后端 API**: `http://localhost:3030`
    *   **Swagger 文档**: `http://localhost:3030/api-docs`
    *   **在线演示**: `http://120.27.143.170:8080/`

4.  **默认账号**
    *   用户名: `admin`
    *   密码: `admin`

> **注意**: 默认配置下，每次重启 Docker 都会执行 `seed` 任务，重置数据库。如需持久化数据，请在 `deploy/docker-compose.yml` 中移除 `seed` 服务。

## 📚 深入文档

我们为您准备了详尽的文档，以帮助您更好地理解和使用此模板。

*   **想了解项目整体架构？**
    *   请阅读 **[基础架构设计](./docs/基础架构.md)**
*   **想深入后端的技术实现？**
    *   **[登录与认证机制](./docs/登录设计.md)**
    *   **[权限与鉴权设计](./docs/权限设计.md)**
    *   **[异步导出任务](./docs/导出任务.md)**
*   **想了解前端的巧妙之处？**
    *   **[前端架构与 Schema 驱动](./docs/前端架构.md)**
    *   **[多标签页与状态保持](./docs/多标签与KeepAlive.md)**
*   **想玩转可观测性与部署？**
    *   **[可观测性体系（Metrics, Traces, Logs）](./docs/可观测性.md)**
    *   **[系统日志（ELK）详解](./docs/系统日志.md)**

## 🛠️ 本地开发

如果您不希望使用 Docker，也可以在本地环境中运行。请确保您已安装 `Node.js (v22+)`, `pnpm`, `PostgreSQL (v16+)`, `Redis (v7+)`。

详细步骤请参考 **[本地开发指南](./docs/本地开发指南.md)** (我将为您创建一个新文件来存放这部分内容)。

## 🤝 贡献

我们欢迎任何形式的贡献！无论是提交 Issue 还是 Pull Request。

## 📄 License

本项基于 [MIT License](./LICENSE) 开源。




