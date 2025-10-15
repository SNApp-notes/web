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
import { useEffect, useState, Suspense } from 'react';
import { ColorModeButton } from '@/components/ui/color-mode';
import { requestAccountDeletionAction } from '@/app/actions/auth';
import { Toaster, toaster } from '@/components/ui/toaster';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    errors: null as any,
    message: ''
  });

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

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFormData((prev) => ({ ...prev, errors: null, message: '' }));

    const formDataObj = new FormData(event.currentTarget);

    try {
      const result = await requestAccountDeletionAction(formData, formDataObj);

      if (result.success) {
        toaster.create({
          title: 'Confirmation Email Sent',
          description: result.message,
          type: 'success',
          duration: 10000
        });
        setShowDeleteForm(false);
        setFormData({ email: '', errors: null, message: '' });
      } else {
        setFormData((prev) => ({
          ...prev,
          errors: result.errors,
          message: result.message || ''
        }));

        if (result.message && !result.errors) {
          toaster.create({
            title: 'Error',
            description: result.message,
            type: 'error'
          });
        }
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

  return (
    <Box minH="100vh" bg="bg" p={6}>
      <Box maxW="2xl" mx="auto">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading p={3} size="lg">Settings</Heading>
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

          {/* Account Management */}
          <Card.Root p={3}>
            <Card.Header>
              <Card.Title>Account</Card.Title>
              <Card.Description>Manage your account settings and data</Card.Description>
            </Card.Header>
            <Card.Body>
              {!showDeleteForm ? (
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="medium" mb={1} color="red.500">
                      Delete Account
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Permanently delete your account and all notes
                    </Text>
                  </Box>
                  <Button
                    p={3}
                    colorPalette="red"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteForm(true)}
                  >
                    Delete Account
                  </Button>
                </Flex>
              ) : (
                <Stack gap={4}>
                  <Box>
                    <Text fontWeight="medium" mb={1} color="red.500">
                      Confirm Account Deletion
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mb={3}>
                      This action cannot be undone. Please enter your email address to
                      confirm account deletion.
                    </Text>
                  </Box>

                  <form onSubmit={handleDeleteSubmit}>
                    <Stack gap={4}>
                      <Field.Root invalid={!!formData.errors?.email}>
                        <Field.Label htmlFor="email">Email Address</Field.Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email to confirm"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                        {formData.errors?.email && (
                          <Field.ErrorText>{formData.errors.email[0]}</Field.ErrorText>
                        )}
                      </Field.Root>

                      <Flex gap={2} justify="flex-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDeleteForm(false);
                            setFormData({ email: '', errors: null, message: '' });
                          }}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          colorPalette="red"
                          loading={isLoading}
                          loadingText="Sending Email..."
                        >
                          Send Deletion Email
                        </Button>
                      </Flex>
                    </Stack>
                  </form>
                </Stack>
              )}
            </Card.Body>
          </Card.Root>
        </Stack>
      </Box>
      <Toaster />
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Box p={6}>Loading settings...</Box>}>
      <SettingsContent />
    </Suspense>
  );
}
