-- 修复 changelog 表的 RLS 策略

-- 1. 禁用 RLS（允许所有操作）
ALTER TABLE changelog DISABLE ROW LEVEL SECURITY;

-- 2. 或者启用 RLS 但允许所有用户读写
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果有）
DROP POLICY IF EXISTS "Allow all select" ON changelog;
DROP POLICY IF EXISTS "Allow all insert" ON changelog;
DROP POLICY IF EXISTS "Allow all update" ON changelog;
DROP POLICY IF EXISTS "Allow all delete" ON changelog;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all select" ON changelog FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON changelog FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON changelog FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON changelog FOR DELETE USING (true);

-- 验证数据
SELECT * FROM changelog ORDER BY date DESC;
