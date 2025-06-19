const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    // Check if email is configured properly
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️  Email credentials not configured. Email notifications will be disabled."
      );
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log("📧 Email service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error.message);
      this.transporter = null;
    }
  }
  async sendTeamInvitation(
    email,
    teamName,
    invitedByName,
    invitationToken,
    role
  ) {
    // If email service is not configured, log and return
    if (!this.transporter) {
      console.log(
        `📧 Email service not configured - invitation created for ${email} but no email sent`
      );
      console.log(`📋 Manual invitation details:`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   👥 Team: ${teamName}`);
      console.log(`   👤 Invited by: ${invitedByName}`);
      console.log(`   🔑 Token: ${invitationToken}`);
      console.log(`   🎭 Role: ${role}`);
      console.log(
        `   🔗 Invitation URL: ${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}`
      );
      return false; // Indicate email was not sent, but don't throw error
    }

    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You've been invited to join ${teamName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #3498db;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #3498db;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .role-badge {
              background: #e74c3c;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Team Invitation</h1>
          </div>
          
          <div class="content">
            <h2>You've been invited to join ${teamName}!</h2>
            
            <p>Hi there!</p>
            
            <p><strong>${invitedByName}</strong> has invited you to join the team <strong>"${teamName}"</strong> with the role of <span class="role-badge">${role.toUpperCase()}</span>.</p>
            
            <p>As a ${role}, you'll be able to:</p>
            <ul>
              ${
                role === "admin"
                  ? `
                <li>✅ Create and manage projects</li>
                <li>✅ Manage team members and roles</li>
                <li>✅ View all reports and analytics</li>
                <li>✅ Manage tasks and assignments</li>
              `
                  : role === "manager"
                  ? `
                <li>✅ Create and manage projects</li>
                <li>✅ View reports and analytics</li>
                <li>✅ Manage tasks and assignments</li>
                <li>❌ Manage team members (admin only)</li>
              `
                  : `
                <li>✅ View reports and analytics</li>
                <li>✅ Track your time on assigned tasks</li>
                <li>❌ Create projects (manager/admin only)</li>
                <li>❌ Manage team members (admin only)</li>
              `
              }
            </ul>
            
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
            
            <p>If you don't have an account yet, you'll be able to create one when you click the accept button.</p>
            
            <div class="footer">
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
              <p>${acceptUrl}</p>
              
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Team invitation email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to send team invitation email to ${email}:`,
        error.message
      );

      // Provide specific guidance for common Gmail errors
      if (error.code === "EAUTH") {
        console.log(`💡 Gmail Authentication Fix:`);
        console.log(
          `   1. Enable 2-Factor Authentication on your Gmail account`
        );
        console.log(
          `   2. Generate an App Password: https://myaccount.google.com/apppasswords`
        );
        console.log(
          `   3. Update EMAIL_PASS in .env with the App Password (not your regular password)`
        );
        console.log(
          `   4. Or temporarily disable email by removing EMAIL_USER from .env`
        );
      }

      throw error;
    }
  }

  async sendWelcomeEmail(email, name, teamName) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${teamName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #27ae60;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #27ae60;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to the Team!</h1>
          </div>
          
          <div class="content">
            <h2>Hi ${name}!</h2>
            
            <p>Congratulations! You've successfully joined <strong>${teamName}</strong>.</p>
            
            <p>You can now:</p>
            <ul>
              <li>📊 Track your time on projects and tasks</li>
              <li>📈 View team reports and analytics</li>
              <li>👥 Collaborate with your team members</li>
              <li>🎯 Stay productive and organized</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>Welcome aboard! We're excited to have you as part of the team.</p>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error;
    }
  }

  async sendOTPEmail(email, otp, type, userName = null) {
    // If email service is not configured, log and return
    if (!this.transporter) {
      console.log(
        `📧 Email service not configured - OTP generated for ${email} but no email sent`
      );
      console.log(`📋 Manual OTP details:`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔐 OTP: ${otp}`);
      console.log(`   📝 Type: ${type}`);
      return false;
    }

    const subject =
      type === "email_verification"
        ? "Verify Your Email Address"
        : "Your Login Verification Code";

    const title =
      type === "email_verification"
        ? "Email Verification Required"
        : "Login Verification";

    const message =
      type === "email_verification"
        ? "To complete your account registration, please verify your email address using the code below:"
        : "To complete your login, please enter the verification code below:";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .otp-code {
              background: #f8f9fa;
              border: 2px solid #667eea;
              border-radius: 8px;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              margin: 20px 0;
              color: #667eea;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 ${title}</h1>
            </div>
            
            <div class="content">
              ${userName ? `<h2>Hi ${userName}!</h2>` : "<h2>Hello!</h2>"}
              
              <p>${message}</p>
              
              <div class="otp-code">
                ${otp}
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>
              
              <p>If you have any questions or need help, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Time Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email} for ${type}`);
      return true;
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw error;
    }
  }

  async sendEmailVerificationOTP(email, otp, userName = null) {
    return this.sendOTPEmail(email, otp, "email_verification", userName);
  }

  async sendLoginOTP(email, otp, userName = null) {
    return this.sendOTPEmail(email, otp, "login_2fa", userName);
  }
}

module.exports = new EmailService();
