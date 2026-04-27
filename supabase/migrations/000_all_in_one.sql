-- ========================================
-- 合并迁移脚本（一键执行版）
-- 包含：001_password_hash + 002_changelog_rls + 003_users_rls
-- 在 Supabase SQL Editor 中一次性执行
-- ========================================

-- ========== Part 1: 密码哈希迁移 ==========

-- 1a. 添加 password_hashed 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hashed BOOLEAN DEFAULT false;

-- 1b. 添加 reset_token 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- 1c. 启用 pgcrypto 扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1d. hash_password RPC
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- 1e. verify_password RPC（兼容明文和 bcrypt）
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF stored_hash LIKE '$2%' THEN
    RETURN crypt(input_password, stored_hash) = stored_hash;
  ELSE
    RETURN input_password = stored_hash;
  END IF;
END;
$$;

-- ========== Part 2: changelog 表 RLS ==========

ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select" ON changelog;
DROP POLICY IF EXISTS "Allow all insert" ON changelog;
DROP POLICY IF EXISTS "Allow all update" ON changelog;
DROP POLICY IF EXISTS "Allow all delete" ON changelog;

CREATE POLICY "changelog_select_all" ON changelog
  FOR SELECT USING (true);

CREATE POLICY "changelog_insert_admin" ON changelog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "changelog_update_admin" ON changelog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "changelog_delete_admin" ON changelog
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- ========== Part 3: users 表安全加固 ==========

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_select_all" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_all" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 安全视图（不暴露 password 和 reset_token）
CREATE OR REPLACE VIEW public_users AS
SELECT id, username, email, is_admin, password_hashed, created_at
FROM users;

GRANT SELECT ON public_users TO anon;
GRANT SELECT ON public_users TO authenticated;

-- ========== 验证 ==========
SELECT 'changelog policies:' AS check;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'changelog';

SELECT 'users policies:' AS check;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
