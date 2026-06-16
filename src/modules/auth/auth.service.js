const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/database');
const { sendEmail } = require('../../utils/mailer');

const loginUser = async (email, password) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Check if user is active
  if (!user.isActive) {
    const error = new Error('Account deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Verify password
  const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Silently do nothing for unregistered emails - security best practice
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // Generate secure reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Store hashed token and expiry in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    },
  });

  // Build reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  // Send email
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password for your Binslum Fleet account.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>

        <p>Or copy and paste this link:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>

        <p style="color: #666; font-size: 12px;">
          <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed unless you click the button above.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Binslum Fleet Management System
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset your Binslum Fleet password',
    html: emailHtml,
  });

  return { message: 'If that email exists, a reset link has been sent.' };
};

const resetPassword = async (token, newPassword) => {
  // Hash the token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpires: {
        gt: new Date(), // Token must not be expired
      },
    },
  });

  if (!user) {
    const error = new Error('Reset token is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return { message: 'Password reset successfully.' };
};

module.exports = {
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
