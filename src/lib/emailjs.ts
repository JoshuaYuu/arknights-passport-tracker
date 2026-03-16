import emailjs from '@emailjs/browser';

// EmailJS 配置
const EMAILJS_SERVICE_ID = 'service_a4xyw3v';
const EMAILJS_TEMPLATE_ID = 'template_7eq8nkk';
const EMAILJS_PUBLIC_KEY = 'FNisI_hwpo0DFKlND';

// 初始化 EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// 发送密码邮件
export const sendPasswordEmail = async (toEmail: string, username: string, password: string) => {
  try {
    const templateParams = {
      email: toEmail,         // 收件人邮箱
      to_email: toEmail,      // 备用变量名
      username: username,     // 用户名
      password: password,     // 密码
      app_name: '明日方舟通行证统计',
      login_url: 'https://ohdvvlu6sgbec.ok.kimi.link'
    };
    
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    return { success: true, result };
  } catch (error: any) {
    console.error('EmailJS error:', error);
    return { success: false, error: error?.text || error?.message || '发送失败' };
  }
};

// 验证邮箱格式
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};
