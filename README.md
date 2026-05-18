# 校内学助工作平台（客户端）

基于 React 18 + Vite 6 + Tailwind CSS 3 的学生助手考勤管理系统前端。

## 功能模块

| 模块 | 页面 | 说明 |
|------|------|------|
| 登录 | `Login` | 学号 + 密码登录，返回 JWT token，自动存储会话 |
| 打卡签到 | `ClockInOut` | 上班签到 / 下班签退、实时计时、加班提醒弹窗、管理员远程通知响应 |
| 工时记录 | `WorkHoursRecord` | 按月汇总工时、每日明细表、异常收口提醒、班次详情（分页 + 状态筛选） |
| 个人档案 | `Profile` | 查看学助资料、编辑手机号、修改密码 |
| 服务器设置 | `SettingsModal` | 远程/本地一键切换，无需改代码或重启 |

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18 | JavaScript 运行时 |
| npm | >= 9 | 包管理器 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 浏览器访问
# http://localhost:5173
```

## 依赖清单

### 运行时依赖

| 包 | 版本 | 用途 |
|---|------|------|
| react | ^18.3.1 | UI 组件框架 |
| react-dom | ^18.3.1 | React DOM 渲染 |

### 开发依赖

| 包 | 版本 | 用途 |
|---|------|------|
| vite | ^6.0.5 | 构建工具与开发服务器 |
| @vitejs/plugin-react | ^4.3.4 | Vite React JSX 编译 |
| tailwindcss | ^3.4.17 | 原子化 CSS 框架 |
| postcss | ^8.4.49 | CSS 后处理 |
| autoprefixer | ^10.4.20 | CSS 浏览器前缀自动补全 |

无其他第三方依赖，API 请求使用浏览器原生 `fetch`，状态管理使用 React 内置 `useState`/`useEffect`。

## 后端连接

### 开发模式（`npm run dev`）

Vite 开发服务器将 `/api` 请求代理到后端。地址支持两种方式配置：

**方式一：页面设置面板（推荐）**

侧边栏齿轮图标 → 服务器设置 → 选择远程/本地 → 填写地址 → 保存立即生效，无需刷新。

**方式二：vite.config.js**

```js
const PROXY_TARGET = 'http://192.168.10.100:3000'  // 修改此行
```

设置面板填了地址后优先级高于 Vite 代理——请求直连目标，不经过代理。

### 生产构建

```bash
npm run build        # 产物在 dist/
npm run preview      # 本地预览构建产物
```

`dist/` 为纯静态文件，部署到任意 Web 服务器（Nginx / Apache / CDN）后需配置 `/api` 反向代理到后端，或在页面设置面板中填写完整的后端地址。

## 项目结构

```
campus-client/
├── index.html                         # 入口 HTML
├── package.json                       # 项目配置与依赖
├── vite.config.js                     # Vite 配置（端口 5173、代理目标）
├── tailwind.config.js                 # Tailwind 主题定制
├── postcss.config.js                  # PostCSS 配置
└── src/
    ├── main.jsx                       # 应用挂载入口
    ├── index.css                      # 全局样式（Tailwind 指令）
    ├── App.jsx                        # 根组件：登录态管理、token 过期检测、登出
    ├── utils/
    │   ├── api.js                     # 统一 API 请求层（自动拼接 base URL、携带 JWT）
    │   ├── config.js                  # 运行时服务器配置（预设远程/本地、变更监听）
    │   └── debug.js                   # 调试日志模块（按标签开关、全局错误捕获）
    ├── components/
    │   ├── StudentShell.jsx           # 学生端侧边栏（导航、用户信息、登出确认）
    │   ├── SettingsModal.jsx          # 服务器设置弹窗（复用 Modal）
    │   └── Modal.jsx                  # 通用弹窗组件
    └── pages/
        ├── Login.jsx                  # 登录页
        └── student/
            ├── ClockInOut.jsx         # 打卡签到（含管理员远程通知）
            ├── WorkHoursRecord.jsx    # 工时记录（汇总 + 班次明细）
            └── Profile.jsx            # 个人档案（查看 + 编辑手机号/密码）
```

## 接口清单

所有 API 函数集中在 `src/utils/api.js`，自动携带 `Authorization: Bearer <token>`。

### 认证模块

| 函数 | 端点 | 方法 | 说明 |
|------|------|------|------|
| `loginApi(studentId, password)` | `/api/user/login` | POST | 学号登录，返回 `{ id, username, assistantId, token }` |
| `logoutApi()` | `/api/user/logout` | POST | 登出，使服务端 token 失效 |
| `fetchUserProfile()` | `/api/user/profile` | GET | 获取当前账户资料 |

### 学助资料

| 函数 | 端点 | 方法 | 说明 |
|------|------|------|------|
| `fetchAssistant(id)` | `/api/assistants/:id` | GET | 获取学助详情（姓名、岗位、手机号等） |
| `updateMyProfile(data)` | `/api/assistants/me` | PUT | 更新手机号或密码（`{ phone }` / `{ currentPassword, newPassword }`） |

### 考勤模块

| 函数 | 端点 | 方法 | 轮询 | 说明 |
|------|------|------|------|------|
| `fetchAttendanceStatus()` | `/api/attendance/status` | GET | 60s | 考勤状态快照（openSession、pendingReminder、todaySessions） |
| `punch(type, source)` | `/api/attendance/punch` | POST | — | 上班 (IN) / 下班 (OUT) 打卡 |
| `fetchAttendanceSessions(params)` | `/api/attendance/sessions` | GET | — | 历史班次明细（分页、日期筛选、状态过滤） |
| `fetchAttendanceSummary(from, to)` | `/api/attendance/summary` | GET | — | 工时汇总统计（总时长、班次数、异常数、按日汇总） |
| `fetchShiftNotice()` | `/api/attendance/shift-notice` | GET | 10s | 轮询管理员远程打卡通知 |
| `respondShiftNotice(id, response)` | `/api/attendance/shift-notice/respond` | POST | — | 响应通知（confirmed / declined） |

## 调试日志

`src/utils/debug.js` 提供统一的调试日志系统，开发模式自动启用，生产构建自动关闭。

模块标签：`api` `auth` `component` `state` `global`

- `[api]` — 所有 HTTP 请求/响应/错误
- `[auth]` — 登录/登出/token 过期
- `[component]` — 组件数据加载成功/失败
- `[global]` — 未捕获异常和未处理 Promise rejection（红色分隔线 + 可复制的单行摘要）

错误发生时控制台输出格式：

```
━━━━━━ 🐛 复制这行给我 ━━━━━━
[global] 14:30:22 | 未捕获异常: Cannot read properties of undefined (reading 'name') | ClockInOut.jsx:45:12
━━━━━━━━━━━━━━━━━━━━━━
```

选中中间行复制即可定位错误。

## 版权

© 版权归青穹团队所有
