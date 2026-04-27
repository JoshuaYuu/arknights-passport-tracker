-- ========================================
-- Phase 1c: 修复 changelog 表 RLS 策略
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 启用 RLS（而不是禁用）
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Allow all select" ON changelog;
DROP POLICY IF EXISTS "Allow all insert" ON changelog;
DROP POLICY IF EXISTS "Allow all update" ON changelog;
DROP POLICY IF EXISTS "Allow all delete" ON changelog;

-- 3. 创建安全策略
-- SELECT: 所有人可读（包括未登录用户）
CREATE POLICY "changelog_select_all" ON changelog
  FOR SELECT USING (true);

-- INSERT: 仅管理员可插入
CREATE POLICY "changelog_insert_admin" ON changelog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- UPDATE: 仅管理员可更新
CREATE POLICY "changelog_update_admin" ON changelog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- DELETE: 仅管理员可删除
CREATE POLICY "changelog_delete_admin" ON changelog
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 4. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'changelog';
