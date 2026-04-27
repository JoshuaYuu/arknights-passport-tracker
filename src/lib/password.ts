import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 对密码进行哈希处理
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码是否匹配
 * 支持渐进式迁移：如果 passwordHashed 为 false，使用明文比对后自动升级为哈希
 */
export const verifyPassword = async (
  inputPassword: string,
  storedPassword: string,
  passwordHashed: boolean
): Promise<{ valid: boolean; needsMigration: boolean; hashedPassword?: string }> => {
  if (!passwordHashed) {
    // 旧用户：明文比对
    if (inputPassword === storedPassword) {
      // 比对通过，生成哈希供回写
      const hashedPassword = await hashPassword(inputPassword);
      return { valid: true, needsMigration: true, hashedPassword };
    }
    return { valid: false, needsMigration: false };
  }

  // 已迁移用户：bcrypt 比对
  const valid = await bcrypt.compare(inputPassword, storedPassword);
  return { valid, needsMigration: false };
};

/**
 * 生成密码重置令牌（6位数字）
 */
export const generateResetToken = (): string => {
  return Math.random().toString().slice(2, 8);
};
