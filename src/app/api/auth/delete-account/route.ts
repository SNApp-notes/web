import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/settings?error=invalid-token', request.url));
  }

  try {
    // Find the deletion verification record
    const verification = await prisma.verification.findUnique({
      where: {
        id: `delete_${token}`
      }
    });

    if (!verification) {
      return NextResponse.redirect(new URL('/settings?error=invalid-token', request.url));
    }

    // Check if token has expired
    if (verification.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.verification.delete({
        where: {
          id: `delete_${token}`
        }
      });
      return NextResponse.redirect(new URL('/settings?error=token-expired', request.url));
    }

    // Verify this is an account deletion request
    if (verification.value !== 'account_deletion') {
      return NextResponse.redirect(new URL('/settings?error=invalid-token', request.url));
    }

    const userId = verification.identifier;

    // Delete the user and all related data (cascade delete will handle notes, sessions, accounts)
    await prisma.user.delete({
      where: {
        id: userId
      }
    });

    // Clean up the verification token
    await prisma.verification.delete({
      where: {
        id: `delete_${token}`
      }
    });

    // Sign out the user if they have any active sessions
    try {
      await auth.api.signOut({
        headers: request.headers
      });
    } catch (error) {
      // Ignore signout errors since user is already deleted
      console.log('User already signed out or deleted');
    }

    // Redirect to a success page
    return NextResponse.redirect(new URL('/login?message=account-deleted', request.url));
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.redirect(new URL('/settings?error=deletion-failed', request.url));
  }
}
