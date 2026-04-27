import { createClient } from '@supabase/supabase-js';

// Supabase 配置（从环境变量读取）
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 数据库表类型定义
export interface DBUser {
  id: string;
  username: string;
  email: string;
  password: string;
  password_hashed: boolean;
  reset_token?: string;
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
