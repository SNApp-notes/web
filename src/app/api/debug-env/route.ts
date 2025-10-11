import { NextResponse } from 'next/server';

export async function GET() {
  // Temporarily allow in production for debugging
  // if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_ENV) {
  //   return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  // }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    BETTER_AUTH_SECRET_EXISTS: !!process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    GITHUB_CLIENT_ID_EXISTS: !!process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET_EXISTS: !!process.env.GITHUB_CLIENT_SECRET,
    // Show first few characters to verify the values are loaded correctly
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 10),
    GITHUB_CLIENT_ID_PREFIX: process.env.GITHUB_CLIENT_ID?.substring(0, 5)
  };

  return NextResponse.json(envVars);
}
