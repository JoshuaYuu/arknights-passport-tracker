import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const SUPABASE_URL = 'https://xlegccilynwgqljdvgnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWdjY2lseW53Z3FsamR2Z25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjY3OTQsImV4cCI6MjA4Nzk0Mjc5NH0.EGb61asBpHDsaxZHOq81XsmA46SqTWxK6eUYTMdvL0A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 数据库表类型定义
export interface DBUser {
  id: string;
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
  created_at: string;
}

export interface DBOwnership {
  id: string;
  user_id: string;
  character_id: number;
  owned: boolean;
  count: number;
  created_at: string;
  updated_at: string;
}
