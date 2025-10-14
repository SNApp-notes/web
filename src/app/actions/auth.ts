'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function signUpAction(
  _prevState: {
    errors?: Record<string, string[]>;
    message?: string;
    success?: boolean;
    email?: string;
  },
  formData: FormData
) {
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
