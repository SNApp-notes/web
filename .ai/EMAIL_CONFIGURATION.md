# Email Verification Configuration

SNApp uses environment-based email verification: disabled in development for easy testing, enabled in production with SMTP.

## Development Mode

In development (`NODE_ENV !== 'production`):

- **Email verification is completely disabled** for easier local testing
- Users are automatically signed in after registration
- Clear "Development Mode" indicators show on sign-in and registration pages
- No verification emails are sent or displayed

## Production Mode

In production, emails are sent via SMTP using the configured environment variables.

### SMTP Environment Variables

Add these variables to your `.env` file:

```bash
# SMTP Configuration for email verification
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_HOST="smtp.gmail.com"           # Or your SMTP provider
SMTP_PORT="587"                      # 587 for TLS, 465 for SSL
SMTP_USERNAME="your-smtp-username"   # Your SMTP login
SMTP_PASSWORD="your-smtp-password"   # Your SMTP password or app password
```

### Common SMTP Providers

**Gmail:**

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-gmail@gmail.com"
SMTP_PASSWORD="your-app-password"    # Use App Password, not regular password
```

**SendGrid:**

```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USERNAME="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

**Mailgun:**

```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USERNAME="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-password"
```

**Amazon SES:**

```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"  # Adjust region
SMTP_PORT="587"
SMTP_USERNAME="your-ses-smtp-username"
SMTP_PASSWORD="your-ses-smtp-password"
```

### Security Notes

- **Never commit SMTP credentials** to version control
- Use **App Passwords** for Gmail (not your regular password)
- Configure **SPF/DKIM records** for your domain to improve deliverability
- Use **environment-specific .env files** (.env.production, .env.local)
- Consider using **secrets management** services in production

### Testing SMTP Configuration

To test your SMTP configuration:

1. Set `NODE_ENV=production` temporarily in development
2. Configure SMTP variables in `.env.local`
3. Register a test account and check email delivery
4. Monitor server logs for SMTP connection errors

**Note:** In development mode, verification is disabled by default. Set `NODE_ENV=production` to test email verification flow.

### Email Template

The production email includes:

- Professional HTML styling with your app branding
- Clear call-to-action button for verification
- Fallback text link for accessibility
- Security notice about 24-hour expiration
- Professional footer with unsubscribe notice

### Error Handling

SMTP failures will:

- Log detailed errors to the server console
- Throw an error that prevents registration completion
- Allow users to retry registration
- Preserve user feedback with appropriate error messages
