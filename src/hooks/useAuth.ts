import { useState, useCallback, useEffect } from 'react';
import { supabase, DBUser } from '@/lib/supabase';
import { hashPassword, verifyPassword, generateResetToken } from '@/lib/password';
import { sendResetTokenEmail, validateEmail } from '@/lib/emailjs';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<DBUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 自动登录
  useEffect(() => {
    const savedUser = localStorage.getItem('arknights_user');
    if (savedUser) {
      try {
        const user: DBUser = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('arknights_user');
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; user?: DBUser; error?: string }> => {
    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (fetchError || !user) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 使用 bcrypt 验证（支持渐进式迁移）
      const result = await verifyPassword(
        password,
        user.password,
        user.password_hashed ?? false
      );

      if (!result.valid) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 渐进式迁移
      if (result.needsMigration && result.hashedPassword) {
        await supabase
          .from('users')
          .update({ password: result.hashedPassword, password_hashed: true })
          .eq('id', user.id);
      }

      // 不暴露密码到前端
      const { password: _, reset_token: __, ...safeUser } = user;
      const dbUser = safeUser as any as DBUser;

      setCurrentUser(dbUser);
      setIsLoggedIn(true);
      localStorage.setItem('arknights_user', JSON.stringify(dbUser));

      return { success: true, user: dbUser };
    } catch (err) {
      return { success: false, error: '登录失败，请重试' };
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查用户名
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        return { success: false, error: '用户名已存在' };
      }

      // 检查邮箱
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .single();

      if (existingEmail) {
        return { success: false, error: '该邮箱已被注册' };
      }

      const { error: createError } = await supabase
        .from('users')
        .insert({
          username: username.trim(),
          email: email.trim(),
          password: await hashPassword(password),
          password_hashed: true,
          is_admin: false
        })
        .select()
        .single();

      if (createError) {
        return { success: false, error: '注册失败，请重试' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: '注册失败，请重试' };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      if (!validateEmail(email)) {
        return { success: false, error: '请输入有效的邮箱地址' };
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (!user) {
        return { success: false, error: '未找到该邮箱对应的用户' };
      }

      // 生成重置令牌
      const resetToken = generateResetToken();
      await supabase
        .from('users')
        .update({ reset_token: resetToken })
        .eq('id', user.id);

      // 发送重置令牌
      const result = await sendResetTokenEmail(user.email, user.username, resetToken);

      if (result.success) {
        return { success: true, message: '重置码已发送到您的邮箱，请查收' };
      } else {
        return { success: false, error: `邮件发送失败: ${result.error || '请检查EmailJS配置'}` };
      }
    } catch (err) {
      return { success: false, error: '找回密码失败，请重试' };
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('arknights_user');
  }, []);

  const isAdmin = currentUser?.is_admin === true || currentUser?.username === 'admin';

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    login,
    register,
    forgotPassword,
    logout,
  };
}
