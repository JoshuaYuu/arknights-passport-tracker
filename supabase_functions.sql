-- 创建清空 changelog 表的函数
CREATE OR REPLACE FUNCTION truncate_changelog()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM changelog;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION truncate_changelog() TO anon;
GRANT EXECUTE ON FUNCTION truncate_changelog() TO authenticated;
