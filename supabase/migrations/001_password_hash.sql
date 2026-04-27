-- ========================================
-- Phase 1a: 密码哈希迁移 - 数据库 schema 变更
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 添加 password_hashed 字段（默认 false，表示当前存储的是明文密码）
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hashed BOOLEAN DEFAULT false;

-- 2. 添加 reset_token 字段（用于密码重置流程）
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- 3. 创建 bcrypt 相关的 RPC 函数

-- 3a. 启用 pgcrypto 扩展（bcrypt 支持）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3b. hash_password: 对密码进行 bcrypt 哈希
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- 3c. verify_password: 验证密码是否匹配
-- 兼容两种情况：明文比对（旧用户）和 bcrypt 比对（已迁移用户）
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 如果 stored_hash 以 $2 开头，说明是 bcrypt 哈希
  IF stored_hash LIKE '$2%' THEN
    RETURN crypt(input_password, stored_hash) = stored_hash;
  ELSE
    -- 旧用户：明文比对
    RETURN input_password = stored_hash;
  END IF;
END;
$$;

-- 4. （可选）批量迁移明文密码为哈希
-- 谨慎执行！建议先走渐进式迁移，确认无问题后再执行
-- CALL migrate_all_passwords();

-- CREATE OR REPLACE FUNCTION migrate_all_passwords()
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   UPDATE users
--   SET password = crypt(password, gen_salt('bf', 10)),
--       password_hashed = true
--   WHERE password_hashed = false;
-- END;
-- $$;
