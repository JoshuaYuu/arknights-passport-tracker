# 上线前手动操作指南

> 完成以下 3 步即可上线。代码层面的配置已全部就绪。

---

## Step 1：执行数据库迁移

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目
2. 左侧菜单 → **SQL Editor**
3. 复制 `supabase/migrations/000_all_in_one.sql` 全部内容，粘贴到编辑器
4. 点击 **Run** 执行
5. 确认底部输出显示 changelog 和 users 的 RLS 策略列表

> 如需单独执行，3 个脚本在 `supabase/migrations/001-003.sql`，按顺序执行即可。

---

## Step 2：配置微信云函数环境变量

1. 打开 [微信云开发控制台](https://cloud.weixin.qq.com/)
2. 选择环境 `cloudbase-9gp20xd952065351`
3. 左侧 → **云函数** → 找到 `supabaseProxy`
4. 点击 **配置** → **环境变量**，添加以下两项：

| 变量名 | 值 |
|--------|-----|
| `SUPABASE_URL` | `xlegccilynwgqljdvgnk.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWdjY2lseW53Z3FsamR2Z25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjY3OTQsImV4cCI6MjA4Nzk0Mjc5NH0.EGb61asBpHDsaxZHOq81XsmA46SqTWxK6eUYTMdvL0A` |

5. 保存后，**重新部署** `supabaseProxy` 云函数

> ⚠️ 代码中已移除 fallback 硬编码值，如果未配置环境变量，云函数会直接报错而非静默降级。

---

## Step 3：创建 EmailJS 重置令牌模板

1. 登录 [EmailJS](https://www.emailjs.com/)
2. 进入 **Email Templates** → **Create New Template**
3. 配置模板：

**模板内容参考：**

```
Subject: 【明日方舟通行证统计】密码重置验证码

Hi {{username}}，

您正在重置明日方舟通行证统计的密码。

验证码：{{reset_token}}

请在应用中输入此验证码完成密码重置。如非本人操作，请忽略此邮件。

{{app_name}}
```

**模板变量映射：**

| 变量 | 用途 |
|------|------|
| `{{email}}` / `{{to_email}}` | 收件人邮箱 |
| `{{username}}` | 用户名 |
| `{{reset_token}}` | 6 位重置验证码 |
| `{{app_name}}` | 应用名称 |
| `{{login_url}}` | 登录页地址 |

4. 保存模板后，复制 **Template ID**（格式如 `template_xxxxx`）
5. 填入 `.env` 文件的 `VITE_EMAILJS_RESET_TEMPLATE_ID`：

```
VITE_EMAILJS_RESET_TEMPLATE_ID=template_xxxxx
```

> 如果不创建独立模板，代码会 fallback 到现有的 `template_7eq8nkk`（原密码找回模板），但建议创建专用模板以区分邮件内容。

---

## 完成清单

- [ ] 数据库迁移执行成功
- [ ] 云函数环境变量已配置并重新部署
- [ ] EmailJS 重置模板已创建，Template ID 已填入 `.env`
- [ ] `.env` 中 `VITE_EMAILJS_RESET_TEMPLATE_ID` 不为空
