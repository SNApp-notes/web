import ForgotPasswordForm from './ForgotPasswordForm';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm isDevelopment={isDevelopment} />;
}
