import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return <RegisterForm isDevelopment={isDevelopment} />;
}
