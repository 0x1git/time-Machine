# Email Setup Guide for Time Tracker

## Setting up Gmail for Sending Invitation Emails

To enable email functionality for team invitations, you need to configure Gmail with an App Password.

### Step 1: Enable 2-Factor Authentication on your Gmail account

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the steps to enable 2-factor authentication if not already enabled

### Step 2: Generate an App Password

1. Still in Security settings, click on "2-Step Verification"
2. Scroll down and click on "App passwords"
3. Select "Mail" from the dropdown
4. Choose "Other (Custom name)" and enter "Time Tracker"
5. Click "Generate"
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update the .env file

1. Open `backend/.env` file
2. Update these lines with your actual Gmail credentials:

```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Example:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 4: Restart the Backend Server

After updating the .env file, restart your backend server:

```bash
cd backend
npm run dev
```

### Step 5: Test Email Functionality

1. Go to the Teams section in your app
2. Create a team
3. Click "Invite Members" and enter an email address
4. Check the recipient's email inbox for the invitation

## Important Security Notes

- **Never commit your .env file to version control**
- The App Password is different from your regular Gmail password
- Keep your App Password secure and don't share it
- You can revoke App Passwords anytime from Google Account settings

## Troubleshooting

### "Authentication failed" error:
- Double-check your email and app password in .env
- Make sure 2-factor authentication is enabled
- Ensure you're using the App Password, not your regular password

### Emails not being received:
- Check spam/junk folder
- Verify the recipient email address is correct
- Check server logs for email sending errors

### "Less secure app access" error:
- This shouldn't happen with App Passwords
- If it does, make sure you're using App Password, not regular password

## Alternative Email Providers

If you prefer not to use Gmail, you can modify the email service to use other providers:

### SendGrid:
```javascript
// In emailService.js
const transporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Outlook/Hotmail:
```javascript
// In emailService.js
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

Once configured, your team invitation emails will be sent automatically when users invite team members!
