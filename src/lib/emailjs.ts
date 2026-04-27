import emailjs from '@emailjs/browser';

// EmailJS 配置（从环境变量读取）
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_RESET_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// 初始化 EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// 发送密码重置令牌邮件（替代原来的明文密码邮件）
export const sendResetTokenEmail = async (toEmail: string, username: string, resetToken: string) => {
  try {
    const templateParams = {
      email: toEmail,
      to_email: toEmail,
      username: username,
      reset_token: resetToken,
      app_name: '明日方舟通行证统计',
      login_url: window.location.origin
    };
    
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_RESET_TEMPLATE_ID || EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    return { success: true, result };
  } catch (error: any) {
    console.error('EmailJS error:', error);
    return { success: false, error: error?.text || error?.message || '发送失败' };
  }
};

// 保留旧函数签名以兼容（但不再发送明文密码）
// @deprecated 使用 sendResetTokenEmail 替代
export const sendPasswordEmail = async (toEmail: string, username: string, _password: string) => {
  // 为兼容旧调用，内部转发到重置令牌流程
  const resetToken = Math.random().toString().slice(2, 8);
  return sendResetTokenEmail(toEmail, username, resetToken);
};

// 验证邮箱格式
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};
