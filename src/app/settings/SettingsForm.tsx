'use client';

import {
  Box,
  Card,
  Flex,
  Heading,
  Stack,
  Text,
  Button,
  Input,
  Field
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ColorModeButton } from '@/components/ui/color-mode';
import {
  requestAccountDeletionAction,
  changePasswordAction,
  getUserAuthMethod,
  FormDataState
} from '@/app/actions/auth';
import { Toaster, toaster } from '@/components/ui/toaster';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export default function SettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState<boolean>(false);
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deletionUrl, setDeletionUrl] = useState<string>('');
  const [passwordFormData, setPasswordFormData] = useState<FormDataState>({
    errors: undefined,
    message: ''
  });

  useEffect(() => {
    async function checkAuthMethod() {
      const result = await getUserAuthMethod();
      setHasPassword(result.hasPassword);
    }
    checkAuthMethod();
  }, []);

  // Handle URL parameters for error/success messages
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      switch (error) {
        case 'invalid-token':
          toaster.create({
            title: 'Invalid Token',
            description: 'The account deletion link is invalid or has already been used.',
            type: 'error'
          });
          break;
        case 'token-expired':
          toaster.create({
            title: 'Token Expired',
            description:
              'The account deletion link has expired. Please request a new one.',
            type: 'error'
          });
          break;
        case 'deletion-failed':
          toaster.create({
            title: 'Deletion Failed',
            description:
              'An error occurred while deleting your account. Please try again.',
            type: 'error'
          });
          break;
      }
    }

    if (message === 'account-deleted') {
      toaster.create({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
        type: 'success'
      });
    }
  }, [searchParams]);

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      const result = await requestAccountDeletionAction();

      if (result.success) {
        if (result.requiresConfirmation && result.confirmationUrl) {
          setDeletionUrl(result.confirmationUrl);
          setShowDeleteDialog(true);
        } else {
          toaster.create({
            title: 'Confirmation Email Sent',
            description: result.message,
            type: 'success',
            duration: 10000
          });
        }
      } else if (result.message) {
        toaster.create({
          title: 'Error',
          description: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = () => {
    if (deletionUrl) {
      window.location.href = deletionUrl;
    }
  };

  const handlePasswordChangeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    setIsPasswordLoading(true);
    setPasswordFormData({ errors: undefined, message: '' });

    const formDataObj = new FormData(target);

    const result = await changePasswordAction(passwordFormData, formDataObj);

    setIsPasswordLoading(false);
    if (result.success) {
      toaster.create({
        title: 'Password Changed',
        description: result.message,
        type: 'success',
        duration: 5000
      });
      setShowPasswordForm(false);
      setPasswordFormData({ errors: undefined, message: '' });
      target.reset();
    } else {
      setPasswordFormData({
        errors: result.errors,
        message: result.message
      });
      toaster.create({
        title: 'Error',
        description: result.message,
        type: 'error'
      });
    }
  };

  return (
    <Box minH="100vh" bg="bg" p={6}>
      <Box maxW="2xl" mx="auto">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading p={3} size="lg">
            Settings
          </Heading>
          <Button p={3} variant="outline" onClick={() => router.push('/')}>
            Back to Notes
          </Button>
        </Flex>

        <Stack gap={6}>
          {/* Theme Settings */}
          <Card.Root p={3}>
            <Card.Header>
              <Card.Title>Appearance</Card.Title>
              <Card.Description>Customize how SNApp looks and feels</Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium" mb={1}>
                    Dark Mode
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Toggle between light and dark theme
                  </Text>
                </Box>
                <ColorModeButton />
              </Flex>
            </Card.Body>
          </Card.Root>

          {/* Password Change - Only for email/password users */}
          {hasPassword && (
            <Card.Root p={3}>
              <Card.Header>
                <Card.Title>Password</Card.Title>
                <Card.Description>Change your account password</Card.Description>
              </Card.Header>
              <Card.Body>
                {!showPasswordForm ? (
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="medium" mb={1}>
                        Change Password
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        Update your password to keep your account secure
                      </Text>
                    </Box>
                    <Button
                      p={3}
                      colorPalette="blue"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordForm(true)}
                    >
                      Change Password
                    </Button>
                  </Flex>
                ) : (
                  <Stack gap={4}>
                    <Box>
                      <Text fontWeight="medium" mb={1}>
                        Change Your Password
                      </Text>
                      <Text fontSize="sm" color="fg.muted" mb={3}>
                        Enter your current password and choose a new one.
                      </Text>
                    </Box>

                    <form onSubmit={handlePasswordChangeSubmit}>
                      <Stack gap={4}>
                        <Field.Root invalid={!!passwordFormData.errors?.currentPassword}>
                          <Field.Label htmlFor="currentPassword">
                            Current Password
                          </Field.Label>
                          <Input
                            p={3}
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            placeholder="Enter your current password"
                            required
                          />
                          {passwordFormData.errors?.currentPassword && (
                            <Field.ErrorText>
                              {passwordFormData.errors.currentPassword[0]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root invalid={!!passwordFormData.errors?.newPassword}>
                          <Field.Label htmlFor="newPassword">New Password</Field.Label>
                          <Input
                            p={3}
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="Enter your new password (min 8 characters)"
                            required
                          />
                          {passwordFormData.errors?.newPassword && (
                            <Field.ErrorText>
                              {passwordFormData.errors.newPassword[0]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root invalid={!!passwordFormData.errors?.confirmPassword}>
                          <Field.Label htmlFor="confirmPassword">
                            Confirm New Password
                          </Field.Label>
                          <Input
                            p={3}
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm your new password"
                            required
                          />
                          {passwordFormData.errors?.confirmPassword && (
                            <Field.ErrorText>
                              {passwordFormData.errors.confirmPassword[0]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Flex gap={2} justify="flex-end">
                          <Button
                            p={3}
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordFormData({ errors: undefined, message: '' });
                            }}
                            disabled={isPasswordLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            p={3}
                            type="submit"
                            colorPalette="blue"
                            loading={isPasswordLoading}
                            loadingText="Changing..."
                          >
                            Change Password
                          </Button>
                        </Flex>
                      </Stack>
                    </form>
                  </Stack>
                )}
              </Card.Body>
            </Card.Root>
          )}

          {/* Account Management */}
          <Card.Root p={3}>
            <Card.Header>
              <Card.Title>Account</Card.Title>
              <Card.Description>Manage your account settings and data</Card.Description>
            </Card.Header>
            <Card.Body>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="medium" mb={1} color="red.500">
                    Delete Account
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Permanently delete your account and all notes. A confirmation email
                    will be sent.
                  </Text>
                </Box>
                <Button
                  p={3}
                  colorPalette="red"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAccount}
                  loading={isLoading}
                  loadingText="Sending..."
                >
                  Delete Account
                </Button>
              </Flex>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Box>
      <Toaster />
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDeletion}
        title="Confirm Account Deletion"
        message="This action cannot be undone. Are you sure you want to permanently delete your account and all your notes?"
        confirmText="Delete My Account"
        cancelText="Cancel"
        variant="danger"
      />
    </Box>
  );
}
