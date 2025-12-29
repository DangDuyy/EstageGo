import nodemailer from 'nodemailer'
import { env } from '~/config/environment'
import ApiError from './ApiError'
import { StatusCodes } from 'http-status-codes'

/**
 * Tạo transporter từ cấu hình env
 */
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  })
}

/**
 * Gửi email chung
 * options: { to, subject, text, html }
 */
export const sendMail = async (options = {}) => {
  try {
    const transporter = createTransporter()
    
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || env.SMTP_USER,
      to: options.to,
      subject: options.subject || '',
      text: options.text || '',
      html: options.html || ''
    })
    
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Email send error:', error)
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to send email: ${error.message}`)
  }
}

/**
 * Gửi email xác thực account với link
 */
export const sendVerificationEmail = async ({ to, verifyLink, userName }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to EstageGo!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hi ${userName || 'there'},</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          Thank you for registering with EstageGo! To complete your registration and activate your account, 
          please click the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-size: 16px; 
                    font-weight: bold;
                    display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="font-size: 12px; color: #667eea; word-break: break-all;">
          ${verifyLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    </div>
  `
  
  return sendMail({ 
    to, 
    subject: 'Verify Your Email - EstageGo', 
    html 
  })
}

/**
 * Gửi email reset password với link
 */
export const sendPasswordResetEmail = async ({ to, resetLink, userName }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333;">Hi ${userName || 'there'},</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          We received a request to reset your password for your EstageGo account. 
          Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-size: 16px; 
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Important:</p>
          <p style="margin: 10px 0 0 0; color: #856404;">
            This link will expire in <strong>15 minutes</strong> for security reasons.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="font-size: 12px; color: #ef4444; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
          ${resetLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
        </p>
        
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          This is an automated email from EstageGo. Please do not reply to this email.
        </p>
      </div>
    </div>
  `
  
  return sendMail({ 
    to, 
    subject: '🔐 Reset Your Password - EstageGo', 
    html 
  })
}