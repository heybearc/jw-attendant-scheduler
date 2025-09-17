"use strict";exports.id=2323,exports.ids=[2323],exports.modules={2323:(t,e,n)=>{n.d(e,{EmailService:()=>l});var i=n(3524),o=n(4770),a=n.n(o);let r=new i.PrismaClient,s=process.env.EMAIL_ENCRYPTION_KEY||"default-key-for-staging-only-32b";class l{static async getEmailConfig(){try{let t=await r.email_configurations.findFirst({where:{isActive:!0}});if(!t)return console.error("[EMAIL_SERVICE] No active email configuration found"),null;return{smtpHost:t.smtpServer,smtpPort:t.smtpPort,smtpUser:t.smtpUser,smtpPassword:function(t){let e=a().createDecipher("aes-256-cbc",s),n=e.update(t,"hex","utf8");return n+=e.final("utf8")}(t.smtpPassword),fromEmail:t.fromEmail,fromName:t.fromName}}catch(t){return console.error("[EMAIL_SERVICE] Failed to get email configuration:",t),null}}static async sendInvitationEmail(t,e,n,i){try{let o=await this.getEmailConfig();if(!o)return console.error("[EMAIL_SERVICE] Cannot send invitation - no email configuration"),!1;let a=`${process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:3001"}/auth/accept-invite?token=${n}`;return this.generateInvitationEmailHTML(e,a,i),this.generateInvitationEmailText(e,a,i),console.log("[EMAIL_SERVICE] Invitation email prepared:"),console.log(`To: ${t}`),console.log("Subject: Invitation to JW Attendant Scheduler"),console.log(`Invite URL: ${a}`),console.log(`SMTP Config: ${o.smtpHost}:${o.smtpPort}`),console.log(`From: ${o.fromName} <${o.fromEmail}>`),!0}catch(t){return console.error("[EMAIL_SERVICE] Failed to send invitation email:",t),!1}}static async sendTestEmail(t){try{let e=await this.getEmailConfig();if(!e)return console.error("[EMAIL_SERVICE] Cannot send test email - no email configuration"),!1;return this.generateTestEmailHTML(),this.generateTestEmailText(),console.log("[EMAIL_SERVICE] Test email prepared:"),console.log(`To: ${t}`),console.log("Subject: Test Email from JW Attendant Scheduler"),console.log(`SMTP Config: ${e.smtpHost}:${e.smtpPort}`),console.log(`From: ${e.fromName} <${e.fromEmail}>`),!0}catch(t){return console.error("[EMAIL_SERVICE] Failed to send test email:",t),!1}}static generateInvitationEmailHTML(t,e,n){return`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to JW Attendant Scheduler</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JW Attendant Scheduler</h1>
        </div>
        <div class="content">
            <h2>You're Invited!</h2>
            <p>Hello ${t},</p>
            ${n?`<p>${n} has invited you to join the JW Attendant Scheduler system.</p>`:"<p>You have been invited to join the JW Attendant Scheduler system.</p>"}
            <p>This system helps manage attendant assignments and scheduling for our congregation.</p>
            <p>To accept your invitation and set up your account, please click the button below:</p>
            <a href="${e}" class="button">Accept Invitation</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${e}">${e}</a></p>
            <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from JW Attendant Scheduler.</p>
        </div>
    </div>
</body>
</html>
    `}static generateInvitationEmailText(t,e,n){return`
JW Attendant Scheduler - Invitation

Hello ${t},

${n?`${n} has invited you to join the JW Attendant Scheduler system.`:"You have been invited to join the JW Attendant Scheduler system."}

This system helps manage attendant assignments and scheduling for our congregation.

To accept your invitation and set up your account, please visit:
${e}

Important: This invitation will expire in 7 days.

This is an automated message from JW Attendant Scheduler.
    `}static generateTestEmailHTML(){return`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f0f9ff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Email Configuration Test</h1>
        </div>
        <div class="content">
            <h2>Success!</h2>
            <p>This is a test email from JW Attendant Scheduler.</p>
            <p>If you received this email, your email configuration is working correctly.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>
    `}static generateTestEmailText(){return`
JW Attendant Scheduler - Email Configuration Test

Success!

This is a test email from JW Attendant Scheduler.
If you received this email, your email configuration is working correctly.

Timestamp: ${new Date().toISOString()}
    `}}}};