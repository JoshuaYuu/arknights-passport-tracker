# 明日方舟通行证统计工具

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.19-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.98.0-3ECF8E?logo=supabase)](https://supabase.com/)

一个用于统计和管理《明日方舟》通行证收藏进度的在线工具，支持多人协作编辑和数据云端同步。

## 功能特性

- **通行证统计**: 支持标准通行认证盒子和特殊通行证（音律联觉、嘉年华、联动等）的收藏管理
- **云端同步**: 基于 Supabase 实现用户数据和收藏进度的云端存储
- **多人协作**: 支持多用户注册登录，各自管理自己的收藏数据
- **进度追踪**: 实时显示收集进度百分比、已拥有干员数、通行证总数等统计信息
- **搜索筛选**: 支持按干员名称或盒子名称搜索，可筛选仅显示已拥有的项目
- **一键标记**: 支持一键标记整盒通行证为已拥有
- **数量管理**: 可为每个干员记录拥有的通行证数量
- **更新日志**: 内置版本更新记录管理功能

## 在线访问

**GitHub 仓库**: https://github.com/JoshuaYuu/arknights-passport-tracker

## 技术栈

### 前端框架
- [React 19](https://react.dev/) - 用于构建用户界面的 JavaScript 库
- [TypeScript](https://www.typescriptlang.org/) - 带有类型系统的 JavaScript 超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

### UI 组件
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - 基于 Radix UI 和 Tailwind CSS 的组件库
- [Radix UI](https://www.radix-ui.com/) - 无障碍的 React UI 组件原语
- [Lucide React](https://lucide.dev/) - 美观的图标库

### 后端服务
- [Supabase](https://supabase.com/) - 开源的 Firebase 替代品，提供 PostgreSQL 数据库和认证服务
- [EmailJS](https://www.emailjs.com/) - 无需后端即可发送邮件的服务

### 开发工具
- [ESLint](https://eslint.org/) - JavaScript/TypeScript 代码检查工具
- [PostCSS](https://postcss.org/) - CSS 转换工具

## 本地开发

### 环境要求
- Node.js 20+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
├── src/
│   ├── components/ui/     # UI 组件（基于 shadcn/ui）
│   ├── hooks/             # 自定义 React Hooks
│   ├── lib/               # 工具库和 API 客户端
│   │   ├── supabase.ts    # Supabase 客户端配置
│   │   ├── emailjs.ts     # EmailJS 邮件服务
│   │   └── utils.ts       # 通用工具函数
│   ├── App.tsx            # 主应用组件
│   ├── index.css          # 全局样式
│   └── main.tsx           # 应用入口
├── public/
│   └── data.json          # 通行证数据
├── Supabase配置指南.md     # Supabase 配置说明
├── EmailJS配置指南.md      # EmailJS 配置说明
└── README.md              # 项目说明
```

## 配置说明

### Supabase 配置
参考 [Supabase配置指南.md](./Supabase配置指南.md) 进行数据库和认证配置。

### EmailJS 配置
参考 [EmailJS配置指南.md](./EmailJS配置指南.md) 配置密码找回邮件服务。

## 许可证

MIT License

## 作者

- **小红书**: [@JoshuaYuu](https://www.xiaohongshu.com/user/profile/5ed74a200000000001004746)

---

*本项目为明日方舟玩家社区作品，与官方无关。*
