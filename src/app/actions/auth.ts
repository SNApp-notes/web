'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export type FormDataState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  email?: string;
  requiresConfirmation?: boolean;
  confirmationUrl?: string;
};

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

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

  // Handle success case outside of try-catch to avoid catching redirect errors
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In development and test, create welcome note and return success
    try {
      await prisma.$transaction(async (tx) => {
        const existingNotes = await tx.note.findMany({
          where: { userId }
        });

        if (existingNotes.length === 0) {
          await tx.note.create({
            data: {
              noteId: 1, // First note for this user
              name: 'Welcome to SNApp',
              content: null,
              userId
            }
          });
        }
      });
    } catch (error) {
      console.error('Error creating welcome note:', error);
    }

    return {
      success: true
    };
  } else {
    // In production, show success message for email verification
    return {
      success: true,
      email: email,
      message:
        'Account created successfully! Please check your email to verify your account.'
    };
  }
}

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

    const confirmationUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/delete-account?token=${deletionToken}`;

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
      text: 'Check HTML email',
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
});

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

    // Parse the response to get user information
    const responseData = await result.json();
    const userId = responseData.user?.id;

    if (userId) {
      // Create welcome note for newly verified user
      try {
        await prisma.$transaction(async (tx) => {
          const existingNotes = await tx.note.findMany({
            where: { userId }
          });

          if (existingNotes.length === 0) {
            await tx.note.create({
              data: {
                noteId: 1, // First note for this user
                name: 'Welcome to SNApp',
                content: null,
                userId
              }
            });
          }
        });
      } catch (error) {
        console.error('Error creating welcome note:', error);
      }
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

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

    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password`
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

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  token: z.string().min(1, 'Reset token is required')
});

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
