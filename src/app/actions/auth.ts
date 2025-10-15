'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

type FormDataState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  email?: string;
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

  let result;

  try {
    const headersList = await headers();

    result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: '/'
      },
      headers: headersList,
      asResponse: true
    });

    if (!result.ok) {
      const errorText = await result.text();
      let errorMessage = 'Failed to create account. Please try again.';

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
    console.error('Sign up error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  // Handle success case outside of try-catch to avoid catching redirect errors
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, redirect immediately as email verification is disabled
    redirect('/');
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
    console.error('Sign in error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  redirect('/');
}

export async function signOutAction() {
  try {
    const headersList = await headers();

    await auth.api.signOut({
      headers: headersList
    });
  } catch (error) {
    console.error('Sign out error:', error);
  }
  redirect('/login');
}

const deleteAccountSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export async function requestAccountDeletionAction(
  _prevState: FormDataState,
  formData: FormData
) {
  const validatedFields = deleteAccountSchema.safeParse({
    email: formData.get('email')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid email address'
    };
  }

  try {
    // Get the current session to verify user
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return {
        message: 'You must be logged in to delete your account'
      };
    }

    // Verify email matches the current user's email
    if (session.user.email !== validatedFields.data.email) {
      return {
        message: 'Email address does not match your account'
      };
    }

    // Generate a secure deletion token
    const deletionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the deletion token in the verification table
    await prisma.verification.create({
      data: {
        id: `delete_${deletionToken}`,
        identifier: session.user.id,
        value: 'account_deletion',
        expiresAt
      }
    });

    // Send deletion confirmation email
    const confirmationUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/delete-account?token=${deletionToken}`;

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
