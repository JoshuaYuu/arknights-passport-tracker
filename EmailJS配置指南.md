# EmailJS 配置指南

## 1. 注册 EmailJS 账号

1. 访问 https://www.emailjs.com/
2. 点击右上角 **Sign Up** 注册账号
3. 可以使用 Google/GitHub 账号快速注册

## 2. 创建邮件服务

1. 登录后点击左侧 **Email Services**
2. 点击 **Add New Service**
3. 选择邮件提供商（推荐 Gmail 或 Outlook）
4. 按照提示连接你的邮箱账号
5. 创建完成后，复制 **Service ID**（例如：`service_abc123`）

## 3. 创建邮件模板

1. 点击左侧 **Email Templates**
2. 点击 **Create New Template**
3. 填写模板信息：

**Template Name**: `password_recovery`

**Subject**: `【明日方舟通行证统计】您的密码找回请求`

**Content**:
```html
<h2>密码找回</h2>
<p>您好，{{username}}！</p>
<p>您在「明日方舟通行证统计」的密码如下：</p>
<p style="font-size: 18px; font-weight: bold; color: #6366f1;">{{password}}</p>
<p>请妥善保管您的密码，不要泄露给他人。</p>
<p>登录地址：<a href="{{login_url}}">{{login_url}}</a></p>
<br>
<p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
```

4. 保存模板，复制 **Template ID**（例如：`template_xyz789`）

## 4. 获取 Public Key

1. 点击左侧 **Account**
2. 找到 **Public Key** 并复制（例如：`user_1234567890abcdef`）

## 5. 配置到代码中

打开 `src/lib/emailjs.ts` 文件，替换以下配置：

```typescript
const EMAILJS_SERVICE_ID = '你的_service_id';
const EMAILJS_TEMPLATE_ID = '你的_template_id';
const EMAILJS_PUBLIC_KEY = '你的_public_key';
```

## 6. 重新部署

```bash
npm run build
# 然后部署 dist 文件夹
```

## 免费额度

EmailJS 免费版包含：
- 每月 200 封邮件
- 足够个人使用

---

## 快速配置清单

| 配置项 | 获取位置 | 示例 |
|--------|----------|------|
| Service ID | Email Services | `service_abc123` |
| Template ID | Email Templates | `template_xyz789` |
| Public Key | Account | `user_1234567890abcdef` |

获取到这些配置后，发给我帮你更新代码！
