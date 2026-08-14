# TodoList

一个使用 Vue 3 和 Vite 构建的纯前端待办事项应用。待办事项和主题偏好保存于浏览器本地，无需后端或数据库。

## 项目特性

- **完整的待办管理**：支持新增、完成、编辑、删除任务，以及全部、未完成、已完成三种筛选视图；可一键清除已完成事项。
- **本地数据持久化**：待办事项自动写入浏览器 `localStorage`，刷新页面或重开浏览器后仍可恢复。
- **本地数据校验与容错**：读取任务时会过滤无效记录、补全缺失字段并修复重复 ID；浏览器存储写入失败时应用仍可继续操作，并显示保存失败提示。
- **智能主题切换**：默认跟随系统浅色/深色设置；也可通过页面顶部按钮固定为浅色或深色，选择会被记住。
- **响应式界面**：针对桌面和移动端布局优化，窄屏下主题控件与任务区域可正常显示和操作。
- **纯前端、零后端依赖**：无需数据库或 API 服务，下载依赖后即可本地运行，也可作为静态站点部署到 Nginx。
- **部署友好**：内置 Vite 构建脚本与 Nginx 配置示例，可直接部署到 Linux 服务器的 `8001` 端口。

## 技术栈

- Vue 3
- Vite
- 原生 CSS
- 浏览器 `localStorage`

## 本地部署

### 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

### 安装并启动开发服务器

```bash
git clone https://github.com/mintoneko/TodoList.git
cd TodoList
npm install
npm run dev
```

开发服务器默认监听 `127.0.0.1:3001`，打开以下地址：

```text
http://127.0.0.1:3001/
```

### 构建与本地预览

```bash
npm run build
npm run preview
```

构建结果会生成在 `dist/` 目录。预览服务器默认地址为 `http://127.0.0.1:3001/`。

## 服务器部署（Nginx）

仓库包含适用于 Nginx 的配置文件：[deploy/nginx-vue3-todo-list.conf](deploy/nginx-vue3-todo-list.conf)。默认将站点部署到 `/var/www/vue3-todo-list`，并监听 `8001` 端口。

### 1. 构建项目

在本地项目目录执行：

```bash
npm install
npm run build
```

### 2. 安装 Nginx

以下示例适用于 Debian / Ubuntu 服务器：

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### 3. 上传构建产物

将 `<server>` 替换为服务器的 SSH 地址：

```bash
ssh <server> "sudo install -d -m 755 /var/www/vue3-todo-list"
scp -r dist/* <server>:/var/www/vue3-todo-list/
ssh <server> "sudo chmod 755 /var/www/vue3-todo-list /var/www/vue3-todo-list/assets && sudo find /var/www/vue3-todo-list -type f -exec chmod 644 {} +"
```

最后一条命令很重要：它让 Nginx 可以读取构建后的 JavaScript 与 CSS 文件。

### 4. 启用 Nginx 站点

先将配置文件上传到服务器，再启用站点：

```bash
scp deploy/nginx-vue3-todo-list.conf <server>:/tmp/vue3-todo-list.conf
ssh <server> "sudo cp /tmp/vue3-todo-list.conf /etc/nginx/sites-available/vue3-todo-list && sudo rm -f /etc/nginx/sites-enabled/default && sudo ln -sfn /etc/nginx/sites-available/vue3-todo-list /etc/nginx/sites-enabled/vue3-todo-list && sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx"
```

若服务器启用了 UFW，还需要放行端口：

```bash
sudo ufw allow 8001/tcp
```

部署完成后访问：

```text
http://<服务器 IP>:8001/
```

### 更新部署

每次更新代码后重复构建和上传步骤即可。Vite 会生成带内容哈希的新资源文件，浏览器会自动请求新版本。

## 数据说明

数据仅保存在当前浏览器、当前访问地址下：

- 待办数据键：`vue3-todo-list-items`
- 主题偏好键：`vue3-todo-list-theme-mode`

应用启动时会校验待办数据：

- 无效记录和空标题会被忽略。
- 缺失的 `id`、`completed`、`createdAt` 字段会自动补全，重复 `id` 会被修复。
- 标题会去除首尾空格，并限制为 120 个字符。

如果浏览器禁止 `localStorage`、存储空间不足或写入失败，待办事项仍会保留在当前页面中，但刷新页面前无法保证数据恢复；页面会显示保存失败提示。

正常的浏览器更新不会清除这些数据；清除站点数据、使用隐私模式、换浏览器或换设备后，数据不会自动同步。
