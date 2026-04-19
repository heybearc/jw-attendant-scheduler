import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../src/lib/prisma'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Check if volunteer exists
    const volunteer = await prisma.volunteers.findUnique({
      where: { email }
    })

    if (!volunteer) {
      return res.status(404).json({ error: 'Email not registered. Please contact your coordinator.' })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    })

    // Get email configuration
    const emailConfig = await prisma.system_settings.findFirst({
      where: { key: 'email_config' }
    })

    if (!emailConfig) {
      throw new Error('Email configuration not found')
    }

    const { authType, config } = JSON.parse(emailConfig.value as string)

    // Create transporter
    let transporter
    if (authType === 'gmail') {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.gmailEmail,
          pass: config.gmailAppPassword
        }
      })
    } else {
      transporter = nodemailer.createTransport({
        host: config.smtpServer,
        port: parseInt(config.smtpPort || '587'),
        secure: config.smtpSecure || false,
        requireTLS: !config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        }
      })
    }

    // Build magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`
    const magicLink = `${baseUrl}/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(email)}`

    // Send email
    await transporter.sendMail({
      from: `"TheoShift Team" <${config.fromEmail}>`,
      to: email,
      subject: 'Sign in to TheoShift',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Sign in to TheoShift</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Click the button below to access your volunteer dashboard.</p>
            </div>

            <div style="padding: 30px 20px;">
              <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${volunteer.firstName}!</h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
                You requested to sign in to your TheoShift volunteer dashboard. Click the button below to continue.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  🔐 Sign In to TheoShift
                </a>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">
                  ⚡ <strong>Security Notice:</strong> This link will expire in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.
                </p>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                  <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                  <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
                </p>
              </div>
            </div>

            <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px;">TheoShift - Supporting Theocratic Event Coordination</p>
              <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return res.status(200).json({ success: true, message: 'Magic link sent to your email' })
  } catch (error) {
    console.error('Magic link send error:', error)
    return res.status(500).json({ error: 'Failed to send magic link' })
  }
}
