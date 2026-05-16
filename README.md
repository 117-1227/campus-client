# 校内学助工作平台（客户端）

基于 React + Vite + Tailwind CSS 的学生助手考勤管理系统前端。

## 功能模块

| 模块 | 页面 | 说明 |
|------|------|------|
| 登录 | `Login` | 学号 + 密码登录，返回 JWT token |
| 打卡签到 | `ClockInOut` | 上班签到 / 下班签退，实时计时，加班提醒弹窗 |
| 工时记录 | `WorkHoursRecord` | 按月汇总工时，每日明细，异常收口提醒 |
| 个人档案 | `Profile` | 查看学助资料，编辑手机号，修改密码 |

## 环境要求

- **Node.js** >= 18
- **npm** >= 9

## 新电脑快速部署

```bash
# 1. 克隆项目后进入目录
cd campus-client

# 2. 安装依赖
npm install

# 3. 启动（根据需求选择下方"本地 Mock 运行"或"对接后端运行"）
npm run dev
```

## 两种运行模式

项目支持两种运行模式，通过 `src/utils/api.js` 第 29 行的开关切换：

```js
const USE_MOCK = true   // Mock 模式：无需后端，数据在浏览器内模拟
const USE_MOCK = false  // 后端模式：通过 Vite 代理转发到真实后端
```

---

### 一、本地 Mock 运行（无需后端）

项目内置完整的接口模拟层，无需启动任何后端服务即可完整体验全部功能。

**1. 确认开关**

打开 `src/utils/api.js`，确认第 29 行：

```js
const USE_MOCK = true
```

**2. 启动**

```bash
npm run dev
```

**3. 访问**

浏览器打开 `http://localhost:3001`

**4. Mock 测试账号**

| 学号 | 密码 |
|------|------|
| `2021001` | `654321` |

Mock 模式下登录、打卡、工时、档案全部走本地模拟数据，接口延迟 300ms 模拟网络请求。

---

### 二、对接后端运行

需要后端服务已启动，前端通过 Vite 开发服务器代理将 `/api` 请求转发到后端。

**1. 确认开关**

打开 `src/utils/api.js`，确认第 29 行：

```js
const USE_MOCK = false
```

**2. 配置后端地址**

编辑 `vite.config.js`，修改 `proxy.target` 为你的后端地址：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: { '/api': { target: 'http://192.168.10.100:3000', changeOrigin: true } },
  },
})
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `server.port` | `3001` | 前端开发服务器端口 |
| `proxy.target` | `http://192.168.10.100:3000` | 后端 API 地址 |

**3. 启动**

```bash
npm run dev
```

**4. 登录**

使用后端数据库中的学号和密码登录（默认密码为学号后 6 位）。

**5. 后端依赖**

确保后端以下接口可用：

| 接口 | 用途 |
|------|------|
| `POST /api/user/login` | 登录 |
| `GET /api/assistants/:id` | 学助档案 |
| `PUT /api/assistants/me` | 更新手机号/密码 |
| `POST /api/attendance/punch` | 打卡 |
| `GET /api/attendance/status` | 考勤状态 |
| `GET /api/attendance/summary` | 工时汇总 |

---

## 运行模式对比

| 维度 | Mock 模式 | 后端模式 |
|------|-----------|----------|
| 后端服务 | 不需要 | 必须启动 |
| 数据库 | 不需要 | 必须有 |
| 数据持久化 | 不持久（刷新丢失） | 持久存储 |
| 登录账号 | 固定 Mock 账号 | 后端数据库中的真实账号 |
| 适用场景 | 开发调试、UI 演示、离线开发 | 联调测试、生产部署 |
| 网络要求 | 无 | 能访问后端地址 |

## 生产构建

两种模式均可构建为静态文件部署到任意 Web 服务器：

```bash
# 构建
npm run build

# 产物在 dist/ 目录
# 部署 dist/ 到 Nginx / Apache / CDN 等
```

构建产物为纯静态文件，不依赖 Node.js。部署后需在 Web 服务器配置 `/api` 反向代理到后端。

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | ^18.3 | UI 框架 |
| Vite | ^6.0 | 构建工具 |
| Tailwind CSS | ^3.4 | 原子化 CSS |
| PostCSS | ^8.4 | CSS 后处理 |
| Autoprefixer | ^10.4 | CSS 自动补前缀 |

## 项目结构

```
campus-client/
├── index.html                    # 入口 HTML
├── package.json                  # 项目配置与依赖
├── vite.config.js                # Vite 配置（端口、代理）
├── tailwind.config.js            # Tailwind 主题（字号/字重定制）
├── postcss.config.js             # PostCSS 配置
└── src/
    ├── main.jsx                  # 应用入口
    ├── index.css                 # 全局样式
    ├── App.jsx                   # 根组件（登录态、路由）
    ├── utils/
    │   └── api.js                # 接口统一管理（Mock / 真实切换）
    ├── components/
    │   ├── StudentShell.jsx      # 学生端侧边栏
    │   ├── TeacherShell.jsx      # 教师端侧边栏
    │   ├── Modal.jsx             # 通用弹窗
    │   └── Table.jsx             # 通用表格
    └── pages/
        ├── Login.jsx             # 登录页
        ├── student/
        │   ├── ClockInOut.jsx    # 打卡签到
        │   ├── WorkHoursRecord.jsx # 工时记录
        │   └── Profile.jsx       # 个人档案
        └── teacher/
            ├── AssistantsList.jsx
            ├── WorkHoursStats.jsx
            └── ScheduleManagement.jsx
```

## 接口清单

所有接口函数集中在 `src/utils/api.js`，自动携带 JWT token。

### 用户模块

| 函数 | 端点 | 说明 |
|------|------|------|
| `loginApi(studentId, password)` | `POST /api/user/login` | 学号登录 |
| `fetchAssistant(id)` | `GET /api/assistants/:id` | 获取学助档案 |
| `updateMyProfile(data)` | `PUT /api/assistants/me` | 更新手机号/密码 |

### 考勤模块

| 函数 | 端点 | 说明 |
|------|------|------|
| `fetchAttendanceStatus()` | `GET /api/attendance/status` | 考勤状态快照（60s 轮询） |
| `punch(type, source)` | `POST /api/attendance/punch` | 上班/下班打卡 |
| `fetchAttendanceSessions(params)` | `GET /api/attendance/sessions` | 历史班次明细 |
| `fetchAttendanceSummary(from, to)` | `GET /api/attendance/summary` | 工时汇总统计 |

### 教师模块（暂停使用）

| 函数 | 端点 |
|------|------|
| `fetchAssistants()` | `GET /api/teacher/assistants` |
| `fetchTeacherWorkHours(month)` | `GET /api/teacher/work-hours` |
| `fetchSchedules(month)` | `GET /api/teacher/schedules` |
| `createSchedule(data)` | `POST /api/teacher/schedules` |
| `updateSchedule(id, data)` | `PUT /api/teacher/schedules/:id` |
| `deleteSchedule(id)` | `DELETE /api/teacher/schedules/:id` |

## 版权

© 版权归青穹团队所有
