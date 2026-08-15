<div align="center">

<h1>
  <img src="./public/favicon.svg" alt="TodoList logo" width="42" height="42" valign="middle">
  TodoList
</h1>

一个轻量、无后端、隐私优先的待办清单应用。
用 Vue 3 构建，开箱即用，数据保存在当前浏览器中。

<p>
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#部署到-nginx">部署指南</a>
  ·
  <a href="#数据与隐私">数据与隐私</a>
</p>

[![Vue 3](https://img.shields.io/badge/Vue.js-3-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## 项目简介

TodoList 是一个专注于日常任务管理的单页应用。它不依赖后端服务、数据库或账号系统，打开页面即可使用；任务和外观偏好通过浏览器 `localStorage` 保存在本地。

项目适合以下场景：

- 想快速搭建一个可直接使用的个人待办清单。
- 需要一个静态站点，可部署到 Nginx、对象存储或其他静态托管服务。
- 希望任务数据留在自己的浏览器中，不经过第三方 API。
- 需要一个结构清晰、方便继续扩展的 Vue 3 示例项目。

## 功能概览

| 模块 | 能力 |
| --- | --- |
| 任务管理 | 新增、完成、编辑、删除待办事项；支持双击任务快速编辑。 |
| 任务筛选 | 在全部、未完成、已完成三种视图之间切换。 |
| 进度反馈 | 展示已完成数量、总任务数量和剩余任务数量。 |
| 批量清理 | 一键清除所有已完成任务。 |
| 本地持久化 | 使用 `localStorage` 自动保存任务和主题偏好。 |
| 数据容错 | 清理无效记录、补齐缺失字段、修复重复 ID，并限制标题长度。 |
| 主题切换 | 支持系统、浅色、深色三种外观模式，并记住用户选择。 |
| 响应式布局 | 针对桌面端和移动端进行布局适配。 |
| 可访问性 | 使用语义化表单控件、ARIA 状态和可读的控件标签。 |

### 交互细节

- 新增任务时会自动去除首尾空格，空标题不会提交。
- 任务标题最多 120 个字符。
- 编辑状态下按 `Enter` 保存，按 `Esc` 取消。
- 编辑后保存为空标题时，该任务会被删除。
- 浏览器存储写入失败时，页面会显示状态提示，当前页面仍可继续操作。
- 系统主题模式会跟随操作系统的深色模式变化，并同步更新页面颜色和 favicon。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| [Vue 3](https://vuejs.org/) | 组件化 UI 和响应式状态管理。 |
| [Vite](https://vite.dev/) | 本地开发服务器和生产构建工具。 |
| JavaScript | 业务逻辑与交互实现。 |
| CSS | 页面布局、主题和响应式样式。 |
| `localStorage` | 浏览器本地数据持久化。 |

## 快速开始

### 环境要求

- Node.js 18 或更高版本。
- npm 9 或更高版本。

### 安装依赖

```bash
git clone https://github.com/mintoneko/TodoList.git
cd TodoList
npm ci
```

如果本地没有锁定依赖安装需求，也可以使用 `npm install`。

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认监听 `127.0.0.1:3001`，打开：

```text
http://127.0.0.1:3001/
```

如需让同一局域网内的其他设备访问，可临时将监听地址改为所有网卡：

```bash
npm run dev -- --host 0.0.0.0
```

> 仅在可信网络中开放开发服务器。生产环境请使用构建产物，并通过 Nginx 或其他 Web 服务器提供服务。

## npm 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器，默认端口为 `3001`。 |
| `npm run build` | 构建生产文件到 `dist/` 目录。 |
| `npm run preview` | 使用 Vite 预览生产构建结果，默认端口为 `3001`。 |

## 构建生产版本

```bash
npm run build
```

构建完成后，`dist/` 目录包含可部署的静态文件。部署前可以先本地预览：

```bash
npm run preview
```

构建产物只包含静态 HTML、JavaScript、CSS、SVG 和其他资源，不需要 Node.js 进程常驻运行。

## 部署到 Nginx

仓库提供了示例配置：[deploy/nginx-vue3-todo-list.conf](deploy/nginx-vue3-todo-list.conf)。该配置会：

- 从 `/var/www/vue3-todo-list` 提供静态文件。
- 监听服务器的 `3001` 端口。
- 对 Vue 单页应用启用 history fallback，将未知路径回退到 `index.html`。
- 为入口 HTML 设置不缓存策略，为带哈希的静态资源设置长期缓存策略。

### 1. 构建并上传文件

在项目根目录执行：

```bash
npm ci
npm run build

ssh <server> "sudo install -d -m 755 /var/www/vue3-todo-list"
scp -r dist/* <server>:/var/www/vue3-todo-list/
ssh <server> "sudo find /var/www/vue3-todo-list -type d -exec chmod 755 {} + && sudo find /var/www/vue3-todo-list -type f -exec chmod 644 {} +"
```

将 `<server>` 替换为你的 SSH 主机、用户名和端口配置。

### 2. 安装并启用站点配置

```bash
scp deploy/nginx-vue3-todo-list.conf <server>:/tmp/vue3-todo-list.conf
ssh <server> "sudo install -m 644 /tmp/vue3-todo-list.conf /etc/nginx/sites-available/vue3-todo-list && sudo ln -sfn /etc/nginx/sites-available/vue3-todo-list /etc/nginx/sites-enabled/vue3-todo-list && sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx"
```

如果服务器启用了 UFW，并且需要直接从公网访问 `3001`：

```bash
sudo ufw allow 3001/tcp
```

部署完成后可以访问：

```text
http://<server-ip>:3001/
```

### 3. 使用自定义域名和 HTTPS

`3001` 是应用的源站服务端口。生产环境通常不直接把端口号暴露给用户，而是使用 Nginx、Cloudflare 或其他反向代理监听 `80/443`，再将请求转发到 `3001`。

如果通过 HTTPS 对外提供服务，请确保：

- `443` 站点配置了包含目标域名的有效证书。
- 防火墙放行 `80` 和 `443`。
- 反向代理能够访问本机或内网的 `3001` 端口。
- 修改 Nginx 配置后先执行 `sudo nginx -t`，确认无误后再 reload。

## 数据与隐私

TodoList 没有后端 API，也不会自动上传任务内容。数据只保存在当前浏览器、当前访问地址对应的本地存储中。

### 存储键

| 键名 | 内容 |
| --- | --- |
| `vue3-todo-list-items` | 待办事项列表。 |
| `vue3-todo-list-theme-mode` | 主题模式：`system`、`light` 或 `dark`。 |

### 数据处理规则

- 读取数据时会忽略非对象、空标题和格式不正确的记录。
- 缺失的 `id`、`completed` 或 `createdAt` 字段会自动补齐。
- 重复的任务 ID 会被重新生成。
- 标题会去除首尾空格，并截断到 120 个字符。
- 清除浏览器站点数据、切换浏览器、使用隐私模式或更换设备后，任务不会自动同步。
- 如果浏览器禁止或限制 `localStorage`，页面会显示保存失败提示。

## 项目结构

```text
TodoList/
├── public/
│   ├── favicon.svg
│   └── favicon-dark.svg
├── src/
│   ├── components/
│   │   ├── TodoFooter.vue
│   │   ├── TodoHeader.vue
│   │   ├── TodoInput.vue
│   │   ├── TodoItem.vue
│   │   ├── TodoList.vue
│   │   └── TodoToolbar.vue
│   ├── composables/
│   │   ├── useTheme.js
│   │   └── useTodos.js
│   ├── App.vue
│   ├── main.js
│   └── styles.css
├── deploy/
│   └── nginx-vue3-todo-list.conf
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

### 代码分层

- `src/components/`：负责页面展示和用户交互。
- `src/composables/useTodos.js`：负责任务状态、筛选、校验和持久化。
- `src/composables/useTheme.js`：负责主题模式、系统主题监听和 favicon 切换。
- `src/styles.css`：负责全局布局、组件样式、主题变量和响应式规则。
- `deploy/`：提供静态部署到 Nginx 的配置示例。

## 常见问题

### 端口 3001 已被占用

开发服务器和预览服务器默认使用 `3001`。如果端口已被其他进程占用，可以先停止该进程，或临时指定其他端口：

```bash
npm run dev -- --port 3002
```

### 部署后页面空白或资源加载失败

按以下顺序检查：

1. 确认 `dist/index.html` 和 `dist/assets/` 已上传。
2. 确认 Nginx 的 `root` 指向 `/var/www/vue3-todo-list`。
3. 执行 `sudo nginx -t` 检查配置语法。
4. 检查静态文件权限，目录通常使用 `755`，文件使用 `644`。
5. 查看浏览器开发者工具中的 Network 面板，确认资源路径和状态码。

### 刷新后任务消失

任务只保存在当前浏览器的 `localStorage` 中。请确认访问地址没有变化，例如不要在 `localhost`、`127.0.0.1` 和正式域名之间切换后期待数据自动共享。

## 参与开发

欢迎提交 Issue 或 Pull Request。建议使用以下流程：

```bash
git checkout -b feature/your-change
npm ci
npm run dev
npm run build
```

提交前请确认：

- 功能在桌面端和窄屏布局下都能正常使用。
- 任务新增、编辑、完成、删除和筛选流程没有回归。
- 本地存储异常时页面仍能保持可操作。
- `npm run build` 可以成功完成。

## 许可证

本项目采用 [MIT License](./LICENSE) 开源许可证。你可以自由使用、修改、分发本项目，但请保留原始版权和许可证声明。
