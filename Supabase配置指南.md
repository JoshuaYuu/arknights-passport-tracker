# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录
4. 点击 "New project"
5. 填写项目信息：
   - **Organization**: 选择或创建组织
   - **Project name**: `arknights-pass`（或其他你喜欢的名字）
   - **Database Password**: 设置一个强密码（请保存好！）
   - **Region**: 选择 `Asia Pacific (Singapore)` 或 `Asia Northeast (Tokyo)`（离中国近）
6. 点击 "Create new project"
7. 等待项目创建完成（约1-2分钟）

## 2. 获取 API 密钥

项目创建完成后：

1. 点击左侧菜单的 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public**: `eyJhbG...`（长串字符）

## 3. 创建数据库表

点击左侧菜单的 **SQL Editor**，然后点击 **New query**，粘贴以下 SQL：

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建拥有记录表
CREATE TABLE ownerships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL,
  owned BOOLEAN DEFAULT false,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- 创建索引优化查询
CREATE INDEX idx_ownerships_user_id ON ownerships(user_id);
CREATE INDEX idx_ownerships_character_id ON ownerships(character_id);

-- 创建更新触发器（自动更新 updated_at）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ownerships_updated_at
  BEFORE UPDATE ON ownerships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

点击 **Run** 执行 SQL。

## 4. 配置 Row Level Security (RLS)

点击左侧菜单的 **Authentication** → **Policies**，然后为每个表添加策略：

### users 表策略

点击 **New policy**，选择 **Create a policy from scratch**：

1. **Policy name**: `Users can view all users`
   - **Operation**: SELECT
   - **Target roles**: 留空（所有角色）
   - **Using expression**: `true`

2. **Policy name**: `Users can insert their own data`
   - **Operation**: INSERT
   - **Target roles**: 留空
   - **With check expression**: `true`

3. **Policy name**: `Users can update their own data`
   - **Operation**: UPDATE
   - **Target roles**: 留空
   - **Using expression**: `auth.uid() = id`

### ownerships 表策略

1. **Policy name**: `Users can view their own ownerships`
   - **Operation**: SELECT
   - **Target roles**: 留空
   - **Using expression**: `auth.uid() = user_id`

2. **Policy name**: `Users can insert their own ownerships`
   - **Operation**: INSERT
   - **Target roles**: 留空
   - **With check expression**: `auth.uid() = user_id`

3. **Policy name**: `Users can update their own ownerships`
   - **Operation**: UPDATE
   - **Target roles**: 留空
   - **Using expression**: `auth.uid() = user_id`

4. **Policy name**: `Users can delete their own ownerships`
   - **Operation**: DELETE
   - **Target roles**: 留空
   - **Using expression**: `auth.uid() = user_id`

## 5. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

## 6. 部署

```bash
# 构建项目
npm run build

# 部署（根据你的部署方式）
```

## 7. 测试

1. 打开网站
2. 点击"登录/注册"
3. 注册一个新账号
4. 登录后尝试勾选通行证
5. 刷新页面，数据应该保留

## 常见问题

### Q: 注册时提示错误？
A: 检查 RLS 策略是否正确配置，确保 users 表允许 INSERT 操作。

### Q: 数据无法保存？
A: 检查 ownerships 表的 RLS 策略，确保用户只能操作自己的数据。

### Q: 如何添加管理员账号？
A: 在 SQL Editor 中执行：
```sql
UPDATE users SET is_admin = true WHERE username = '你的用户名';
```

## 免费额度说明

Supabase 免费版包含：
- 500MB 数据库空间
- 2GB 带宽/月
- 无限用户
- 无限 API 请求

对于个人使用完全足够！
