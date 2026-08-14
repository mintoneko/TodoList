# TodoList

一个使用 Vue 3 和 Vite 构建的纯前端待办事项应用。待办事项和主题偏好保存于浏览器本地，无需后端或数据库。

## 项目特性

- **完整的待办管理**：支持新增、完成、编辑、删除任务，以及全部、未完成、已完成三种筛选视图；可一键清除已完成事项。
- **本地数据持久化**：待办事项自动写入浏览器 `localStorage`，刷新页面或重开浏览器后仍可恢复。
- **智能主题切换**：默认跟随系统浅色/深色设置；也可通过页面顶部按钮固定为浅色或深色，选择会被记住。
- **响应式界面**：针对桌面和移动端布局优化，窄屏下主题控件与任务区域可正常显示和操作。
- **纯前端、零后端依赖**：无需数据库或 API 服务，下载依赖后即可本地运行，也可作为静态站点部署到 Nginx。
- **部署友好**：内置 Vite 构建脚本与 Nginx 配置示例，可直接部署到 Linux 服务器并启用 HTTPS。

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

开发服务器默认监听 `127.0.0.1:5173`，打开以下地址：

```text
http://127.0.0.1:5173/
```

### 构建与本地预览

```bash
npm run build
npm run preview
```

构建结果会生成在 `dist/` 目录。预览服务器默认地址为 `http://127.0.0.1:4173/`。

## 服务器部署（Nginx + HTTPS）

仓库包含适用于 Nginx 的配置文件：[deploy/nginx-vue3-todo-list.conf](deploy/nginx-vue3-todo-list.conf)。配置使用 `app.example.com` 作为示例域名，部署前请替换为自己的域名；HTTP 会自动跳转到 HTTPS。

### 1. 构建项目

在本地项目目录执行：

```bash
npm install
npm run build
```

### 2. 安装 Nginx 与 acme.sh

以下示例适用于 Debian / Ubuntu 服务器：

```bash
sudo apt-get update
sudo apt-get install -y nginx curl
curl https://get.acme.sh | sudo sh
```

安装脚本会创建每日续签任务；本示例使用 Let’s Encrypt 作为 ACME CA。

### 3. 上传构建产物

将 `<server>` 替换为服务器的 SSH 地址：

```bash
ssh <server> "sudo install -d -m 755 /var/www/vue3-todo-list"
scp -r dist/* <server>:/var/www/vue3-todo-list/
ssh <server> "sudo chmod 755 /var/www/vue3-todo-list /var/www/vue3-todo-list/assets && sudo find /var/www/vue3-todo-list -type f -exec chmod 644 {} +"
```

### 4. 首次申请并安装证书

将下方命令中的 `app.example.com` 替换为你的实际域名。首次申请时先启用临时 HTTP 配置，让 acme.sh 通过网站根目录完成 HTTP-01 校验：

```bash
scp deploy/nginx-vue3-todo-list-http.conf <server>:/tmp/vue3-todo-list-http.conf
ssh <server> "sudo cp /tmp/vue3-todo-list-http.conf /etc/nginx/sites-available/vue3-todo-list && sudo rm -f /etc/nginx/sites-enabled/default && sudo ln -sfn /etc/nginx/sites-available/vue3-todo-list /etc/nginx/sites-enabled/vue3-todo-list && sudo nginx -t && sudo systemctl enable --now nginx"
ssh <server> "sudo /root/.acme.sh/acme.sh --issue --server letsencrypt -d app.example.com -w /var/www/vue3-todo-list"
ssh <server> "sudo install -d -m 755 /etc/nginx/ssl/app.example.com && sudo /root/.acme.sh/acme.sh --install-cert -d app.example.com --key-file /etc/nginx/ssl/app.example.com/privkey.pem --fullchain-file /etc/nginx/ssl/app.example.com/fullchain.pem --reloadcmd 'systemctl reload nginx'"
```

### 5. 启用 HTTPS 站点

先将配置文件上传到服务器，再启用站点：

```bash
scp deploy/nginx-vue3-todo-list.conf <server>:/tmp/vue3-todo-list.conf
ssh <server> "sudo cp /tmp/vue3-todo-list.conf /etc/nginx/sites-available/vue3-todo-list && sudo nginx -t && sudo systemctl reload nginx"
```

若服务器启用了 UFW，还需要放行 80 和 443 端口：

```bash
sudo ufw allow 'Nginx Full'
```

部署完成后访问：

```text
https://app.example.com/
```

证书续签由 acme.sh 的每日任务自动检查；续签并复制新证书后，会通过 `systemctl reload nginx` 让 Nginx 使用新证书。

### 更新部署

每次更新代码后重复构建和上传步骤即可。Vite 会生成带内容哈希的新资源文件，浏览器会自动请求新版本。

## 数据说明

数据仅保存在当前浏览器、当前访问地址下：

- 待办数据键：`vue3-todo-list-items`
- 主题偏好键：`vue3-todo-list-theme-mode`

正常的浏览器更新不会清除这些数据；清除站点数据、使用隐私模式、换浏览器或换设备后，数据不会自动同步。
