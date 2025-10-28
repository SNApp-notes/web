import { redirect } from 'next/navigation';
import { verifyEmailAction } from '@/app/actions/auth';
import VerifyEmailClient from '@/components/VerifyEmailClient';

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token;

  // If no token provided, redirect to home
  if (!token) {
    redirect('/');
  }

  // Verify email using server action
  const result = await verifyEmailAction(token);

  // If successful, redirect to home after a short delay (handled by client component)
  // If failed, show error message in client component
  return (
    <VerifyEmailClient
      success={result.success}
      error={result.error}
      isExpired={result.isExpired}
    />
  );
}
