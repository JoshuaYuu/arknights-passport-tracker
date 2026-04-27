-- ========================================
-- Phase 1c 附加: users 表安全加固
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- 3. 创建安全策略
-- SELECT: 允许读取（前端需要查询用户信息），但通过列级安全保护密码
-- 注意：Supabase 不直接支持列级 RLS，改用视图或函数方式保护
-- 这里先确保基础 RLS 就位，密码保护依赖前端不读取 password 字段

-- SELECT: 所有人可查（登录注册需要）
CREATE POLICY "users_select_all" ON users
  FOR SELECT USING (true);

-- INSERT: 允许注册
CREATE POLICY "users_insert_all" ON users
  FOR INSERT WITH CHECK (true);

-- UPDATE: 仅可更新自己的记录（用于密码迁移和重置）
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 4. 创建安全视图（不暴露 password 和 reset_token 字段）
CREATE OR REPLACE VIEW public_users AS
SELECT id, username, email, is_admin, password_hashed, created_at
FROM users;

-- 5. 给 anon 角色授予视图访问权限
GRANT SELECT ON public_users TO anon;
GRANT SELECT ON public_users TO authenticated;

-- 验证
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';
