/**
 * @module actions/auth
 * @description Server actions for authentication operations.
 * Provides form handlers for sign up, sign in, password management, account deletion,
 * email verification, and password reset flows.
 *
 * @dependencies
 * - next/headers: Server-side header access for Better Auth
 * - zod: Schema validation for form inputs
 * - @/lib/auth: Server-side authentication instance
 * - @/lib/email: Email service for notifications
 * - @/lib/prisma: Database client for account queries
 *
 * @remarks
 * - All functions are server actions (marked with 'use server')
 * - Email verification is required in production, disabled in development
 * - Password requirements: minimum 8 characters
 * - All functions return FormDataState for useActionState hook compatibility
 * - Account deletion requires email confirmation with 24-hour expiry
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useActionState } from 'react';
 * import { signInAction } from '@/app/actions/auth';
 *
 * export default function SignInForm() {
 *   const [state, action, pending] = useActionState(signInAction, {});
 *
 *   return (
 *     <form action={action}>
 *       <input name="email" type="email" required />
 *       <input name="password" type="password" required />
 *       {state.message && <p>{state.message}</p>}
 *       <button disabled={pending}>Sign In</button>
 *     </form>
 *   );
 * }
 * ```
 */

'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * State object returned by all auth form actions.
 * Used with React's useActionState hook for form handling.
 *
 * @interface FormDataState
 * @property {Record<string, string[]>} [errors] - Field-specific validation errors
 * @property {string} [message] - General success or error message
 * @property {boolean} [success] - Whether the action completed successfully
 * @property {string} [email] - Email address (for verification flows)
 * @property {boolean} [requiresConfirmation] - Whether additional confirmation is needed
 * @property {string} [confirmationUrl] - URL for confirmation (development mode only)
 */
export type FormDataState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  email?: string;
  requiresConfirmation?: boolean;
  confirmationUrl?: string;
};

/**
 * Zod schema for sign up validation.
 *
 * @remarks
 * - Email must be a valid email address
 * - Password must be at least 8 characters
 * - Name is required (minimum 1 character)
 */
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
});

/**
 * Zod schema for sign in validation.
 *
 * @remarks
 * - Email must be a valid email address
 * - Password cannot be empty
 */
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Server action for user sign up with email and password.
 * Creates a new user account with email verification in production.
 *
 * @async
 * @param {FormDataState} _prevState - Previous form state (unused, required by useActionState)
 * @param {FormData} formData - Form data containing email, password, and name
 *
 * @returns {Promise<FormDataState>} State object with success status, errors, or messages
 *
 * @throws {Error} Does not throw - returns error state instead
 *
 * @example
 * ```tsx
 * const [state, action] = useActionState(signUpAction, {});
 *
 * <form action={action}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" minLength={8} required />
 *   <input name="name" type="text" required />
 *   <button type="submit">Sign Up</button>
 * </form>
 * ```
 *
 * @remarks
 * - Password must be at least 8 characters
 * - In production: sends verification email, requires email confirmation
 * - In development: auto-signs in user without email verification
 * - Creates welcome note for new users via auth database hooks
 * - Returns `success: true` without message to trigger auto-redirect in dev mode
 */
export async function signUpAction(_prevState: FormDataState, formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your input.'
    };
  }

  const { email, password, name } = validatedFields.data;

  let userId: string;

  try {
    const headersList = await headers();

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: '/'
      },
      headers: headersList,
      asResponse: true
    });

    const responseText = await result.text();

    if (!result.ok) {
      let errorMessage = 'Failed to create account. Please try again.';

      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use default error message if parsing fails
      }

      return {
        message: errorMessage
      };
    }

    // Parse successful response to get user ID
    const responseData = JSON.parse(responseText);
    userId = responseData.user?.id;

    if (!userId) {
      return {
        message: 'Failed to create account. Please try again.'
      };
    }
  } catch (error) {
    console.error(`Sign up failed for user: ${email}`, error);
    const message = (error as { message: string }).message;
    return {
      message: `An unexpected error occurred. Please try again. Reason: ${message}`
    };
  }

  // In development mode, auto-sign in without email verification
  const requiresEmailVerification = process.env.NODE_ENV === 'production';

  if (requiresEmailVerification) {
    return {
      success: true,
      email: email,
      message:
        'Account created successfully! Please check your email to verify your account.'
    };
  }

  // Development mode - no message triggers auto-redirect
  return {
    success: true,
    email: email
  };
}

/**
 * Server action for user sign in with email and password.
 *
 * @async
 * @param {Object} _prevState - Previous form state (unused, required by useActionState)
 * @param {FormData} formData - Form data containing email and password
 *
 * @returns {Promise<FormDataState>} State object with success status or error messages
 *
 * @example
 * ```tsx
 * const [state, action] = useActionState(signInAction, {});
 *
 * <form action={action}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 * </form>
 * ```
 *
 * @remarks
 * - Validates email format and password presence
 * - Returns specific error messages for invalid credentials
 * - Success state has no message to trigger auto-redirect
 */
export async function signInAction(
  _prevState: { errors?: Record<string, string[]>; message?: string },
  formData: FormData
) {
  const validatedFields = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your input.'
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const headersList = await headers();

    const result = await auth.api.signInEmail({
      body: {
        email,
        password
      },
      headers: headersList,
      asResponse: true
    });

    if (!result.ok) {
      const errorText = await result.text();
      let errorMessage = 'Invalid credentials. Please try again.';

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use default error message if parsing fails
      }

      return {
        message: errorMessage
      };
    }
  } catch (error) {
    console.error(`Sign in failed for user: ${email}`);
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  return {
    success: true
  };
}

/**
 * Server action for signing out the current user.
 * Clears the user's session and authentication cookies.
 *
 * @async
 * @returns {Promise<void>} Resolves when sign out is complete
 *
 * @example
 * ```tsx
 * <button onClick={async () => await signOutAction()}>
 *   Sign Out
 * </button>
 * ```
 *
 * @remarks
 * - Errors during sign out are logged but not thrown
 * - Safe to call even if no active session exists
 * - Redirects are handled by the client-side router
 */
export async function signOutAction() {
  try {
    const headersList = await headers();

    await auth.api.signOut({
      headers: headersList
    });
  } catch (error) {
    console.error('Sign out failed - session cleanup error');
  }
}

/**
 * Server action to request account deletion via email confirmation.
 * Sends a confirmation email with a deletion link that expires in 24 hours.
 *
 * @async
 * @returns {Promise<FormDataState>} State object with success status, confirmation URL (dev mode), or error messages
 *
 * @example
 * ```tsx
 * <button onClick={async () => {
 *   const result = await requestAccountDeletionAction();
 *   if (result.success) {
 *     console.log('Confirmation email sent');
 *   }
 * }}>
 *   Delete Account
 * </button>
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Creates verification token valid for 24 hours
 * - Development mode: returns confirmation URL directly without sending email
 * - Production mode: sends email with deletion confirmation link
 * - Deletion is permanent and removes all user data and notes
 * - Email includes warning about irreversible data loss
 */
export async function requestAccountDeletionAction() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return {
        message: 'You must be logged in to delete your account'
      };
    }

    if (!session.user.email) {
      return {
        message: 'No email address found for your account'
      };
    }

    const isDevelopment = process.env.NODE_ENV !== 'production';

    const deletionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verification.create({
      data: {
        id: `delete_${deletionToken}`,
        identifier: session.user.id,
        value: 'account_deletion',
        expiresAt
      }
    });

    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const confirmationUrl = `${baseUrl.replace(/\/$/, '')}/api/auth/delete-account?token=${deletionToken}`;

    if (isDevelopment) {
      return {
        success: true,
        requiresConfirmation: true,
        confirmationUrl,
        message: 'In development mode, use the confirmation dialog to proceed.'
      };
    }

    await sendEmail({
      to: session.user.email,
      subject: 'Confirm Account Deletion - SNApp',
      text: `
Hi ${session.user.name || 'there'},

We received a request to delete your SNApp account. This action cannot be undone and will permanently delete:

- Your account and profile information
- All your notes and content
- Your login sessions

If you're sure you want to delete your account, click the link below:

${confirmationUrl}

This link will expire in 24 hours for security reasons.

If you didn't request account deletion, you can safely ignore this email. Your account will remain active.
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E53E3E; text-align: center;">Account Deletion Request</h1>
          <p style="color: #4A5568; font-size: 16px;">
            Hi ${session.user.name || 'there'},
          </p>
          <p style="color: #4A5568; font-size: 16px;">
            We received a request to delete your SNApp account. This action cannot be undone and will permanently delete:
          </p>
          <ul style="color: #4A5568; font-size: 16px; margin: 16px 0;">
            <li>Your account and profile information</li>
            <li>All your notes and content</li>
            <li>Your login sessions</li>
          </ul>
          <p style="color: #4A5568; font-size: 16px;">
            <strong>If you're sure you want to delete your account, click the button below:</strong>
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmationUrl}" style="background-color: #E53E3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Permanently Delete My Account
            </a>
          </div>
          <p style="color: #718096; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #718096; font-size: 14px; word-break: break-all;">
            ${confirmationUrl}
          </p>
          <p style="color: #718096; font-size: 14px;">
            This link will expire in 24 hours for security reasons.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;">
          <p style="color: #A0AEC0; font-size: 12px; text-align: center;">
            If you didn't request account deletion, you can safely ignore this email. Your account will remain active.
          </p>
        </div>
      `
    });

    return {
      success: true,
      message:
        'Account deletion confirmation email sent. Please check your email and click the confirmation link to permanently delete your account.'
    };
  } catch (error) {
    console.error('Account deletion request error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Zod schema for password change validation.
 *
 * @remarks
 * - Current password must be provided
 * - New password must be at least 8 characters
 * - Confirmation password is required
 * - Additional validation in changePasswordAction ensures passwords match
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
});

/**
 * Checks if the current user has password authentication enabled.
 * Used to determine if password change is available.
 *
 * @async
 * @returns {Promise<{hasPassword: boolean}>} Object indicating if user has password auth
 *
 * @example
 * ```tsx
 * const { hasPassword } = await getUserAuthMethod();
 * if (hasPassword) {
 *   // Show password change form
 * } else {
 *   // Show OAuth-only message
 * }
 * ```
 *
 * @remarks
 * - Returns false if no active session
 * - Only checks for 'credential' provider (email/password)
 * - OAuth-only users will have hasPassword: false
 * - Used in settings page to conditionally show password change form
 */
export async function getUserAuthMethod() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return { hasPassword: false };
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential'
      }
    });

    return {
      hasPassword: !!account?.password
    };
  } catch (error) {
    console.error('Error checking user auth method:', error);
    return { hasPassword: false };
  }
}

/**
 * Server action to change user password.
 * Validates current password and updates to new password.
 *
 * @async
 * @param {FormDataState} _prevState - Previous form state (unused)
 * @param {FormData} formData - Form data with currentPassword, newPassword, confirmPassword
 *
 * @returns {Promise<FormDataState>} State object with success status or error messages
 *
 * @example
 * ```tsx
 * const [state, action] = useActionState(changePasswordAction, {});
 *
 * <form action={action}>
 *   <input name="currentPassword" type="password" required />
 *   <input name="newPassword" type="password" minLength={8} required />
 *   <input name="confirmPassword" type="password" required />
 * </form>
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Only available for email/password accounts (not OAuth-only)
 * - New password must be at least 8 characters
 * - New password must differ from current password
 * - Passwords must match between newPassword and confirmPassword
 * - Does not revoke other sessions (revokeOtherSessions: false)
 * - Returns field-specific errors for validation failures
 */
export async function changePasswordAction(
  _prevState: FormDataState,
  formData: FormData
) {
  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your input'
    };
  }

  const { currentPassword, newPassword, confirmPassword } = validatedFields.data;

  if (newPassword !== confirmPassword) {
    return {
      errors: { confirmPassword: ['Passwords do not match'] },
      message: 'Passwords do not match'
    };
  }

  if (currentPassword === newPassword) {
    return {
      errors: { newPassword: ['New password must be different from current password'] },
      message: 'New password must be different from current password'
    };
  }

  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return {
        message: 'You must be logged in to change your password'
      };
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential'
      }
    });

    if (!account || !account.password) {
      return {
        message: 'Password change is only available for email/password accounts'
      };
    }

    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false
      },
      headers: headersList,
      asResponse: true
    });

    if (!result.ok) {
      const errorText = await result.text();
      let errorMessage = 'Failed to change password. Please try again.';

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          if (errorData.message.includes('Invalid password')) {
            errorMessage = 'Current password is incorrect';
          } else {
            errorMessage = errorData.message;
          }
        }
      } catch {
        // Use default error message
      }

      return {
        message: errorMessage,
        errors:
          errorMessage === 'Current password is incorrect'
            ? { currentPassword: [errorMessage] }
            : undefined
      };
    }

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Server action to verify user email address using a verification token.
 * Called when user clicks email verification link.
 *
 * @async
 * @param {string} token - Email verification token from the verification link
 *
 * @returns {Promise<{success: boolean; error?: string; isExpired?: boolean}>} Verification result
 *
 * @example
 * ```tsx
 * // In verify-email page
 * const token = searchParams.get('token');
 * const result = await verifyEmailAction(token);
 *
 * if (result.success) {
 *   // Show success message and redirect
 * } else if (result.isExpired) {
 *   // Show resend verification option
 * }
 * ```
 *
 * @remarks
 * - Token is generated during sign-up and sent via email
 * - Tokens can expire or become invalid
 * - Returns isExpired flag for expired/invalid tokens
 * - Successful verification enables full account access
 * - Does not require active session (token provides authentication)
 */
export async function verifyEmailAction(token: string) {
  try {
    const headersList = await headers();

    const result = await auth.api.verifyEmail({
      query: {
        token
      },
      headers: headersList,
      asResponse: true
    });

    if (!result.ok) {
      const errorText = await result.text();
      let errorMessage = 'Email verification failed';
      let isExpired = false;

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
          if (
            errorMessage.includes('expired') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('not found')
          ) {
            isExpired = true;
            errorMessage = 'This verification link has expired or is invalid';
          }
        }
      } catch {
        // Use default error message
      }

      return {
        success: false,
        error: errorMessage,
        isExpired
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      error: 'Email verification failed',
      isExpired: false
    };
  }
}

/**
 * Zod schema for forgot password validation.
 *
 * @remarks
 * - Only validates email format
 * - Email must be a valid email address
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

/**
 * Server action to initiate password reset flow.
 * Sends password reset email with token-based reset link.
 *
 * @async
 * @param {FormDataState} _prevState - Previous form state (unused)
 * @param {FormData} formData - Form data containing user email
 *
 * @returns {Promise<FormDataState>} State object with success status and email, or error message
 *
 * @example
 * ```tsx
 * const [state, action] = useActionState(forgotPasswordAction, {});
 *
 * <form action={action}>
 *   <input name="email" type="email" required />
 *   <button type="submit">Send Reset Link</button>
 * </form>
 *
 * {state.success && <p>Reset link sent to {state.email}</p>}
 * ```
 *
 * @remarks
 * - Always returns success to prevent email enumeration attacks
 * - Sends email with password reset link to /reset-password page
 * - Reset link includes token for authentication
 * - Email is sent via Better Auth's forgetPassword API
 * - Base URL determined from BETTER_AUTH_URL environment variable
 */
export async function forgotPasswordAction(
  _prevState: FormDataState,
  formData: FormData
) {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please enter a valid email address'
    };
  }

  const { email } = validatedFields.data;

  try {
    const headersList = await headers();
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${baseUrl}/reset-password`
      },
      headers: headersList
    });

    return {
      success: true,
      email
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      message: 'Failed to send reset email. Please try again.'
    };
  }
}

/**
 * Zod schema for password reset validation.
 *
 * @remarks
 * - Password must be at least 8 characters
 * - Confirmation password is required
 * - Reset token is required for authentication
 * - Additional validation in resetPasswordAction ensures passwords match
 */
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  token: z.string().min(1, 'Reset token is required')
});

/**
 * Server action to reset user password using a reset token.
 * Completes the password reset flow initiated by forgotPasswordAction.
 *
 * @async
 * @param {FormDataState} _prevState - Previous form state (unused)
 * @param {FormData} formData - Form data with password, confirmPassword, and token
 *
 * @returns {Promise<FormDataState>} State object with success status or error messages
 *
 * @example
 * ```tsx
 * const [state, action] = useActionState(resetPasswordAction, {});
 * const token = searchParams.get('token');
 *
 * <form action={action}>
 *   <input type="hidden" name="token" value={token} />
 *   <input name="password" type="password" minLength={8} required />
 *   <input name="confirmPassword" type="password" required />
 *   <button type="submit">Reset Password</button>
 * </form>
 * ```
 *
 * @remarks
 * - Token comes from email reset link query parameter
 * - Password must be at least 8 characters
 * - Passwords must match between password and confirmPassword
 * - Token can expire or become invalid
 * - Returns generic error for invalid/expired tokens
 * - Success allows immediate sign-in with new password
 */
export async function resetPasswordAction(_prevState: FormDataState, formData: FormData) {
  const validatedFields = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    token: formData.get('token')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your input'
    };
  }

  const { password, confirmPassword, token } = validatedFields.data;

  if (password !== confirmPassword) {
    return {
      errors: { confirmPassword: ['Passwords do not match'] },
      message: 'Passwords do not match'
    };
  }

  try {
    const headersList = await headers();

    const result = await auth.api.resetPassword({
      body: {
        newPassword: password,
        token
      },
      headers: headersList,
      asResponse: true
    });

    if (!result.ok) {
      const errorText = await result.text();
      let errorMessage = 'Failed to reset password. The link may be invalid or expired.';

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use default error message
      }

      return {
        message: errorMessage
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}
