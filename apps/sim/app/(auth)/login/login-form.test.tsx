/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client } from '@/lib/auth-client'
import LoginPage from '@/app/(auth)/login/login-form'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  client: {
    signIn: {
      email: vi.fn(),
    },
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
  },
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}

const mockSearchParams = {
  get: vi.fn(),
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)
    mockSearchParams.get.mockReturnValue(null)
  })

  const defaultProps = {
    githubAvailable: true,
    googleAvailable: true,
    isProduction: false,
  }

  describe('Basic Rendering', () => {
    it('renders login form with all required elements', () => {
      render(<LoginPage {...defaultProps} />)

      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when button is clicked', () => {
      render(<LoginPage {...defaultProps} />)

      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const toggleButton = screen.getByLabelText(/show password/i)

      expect(passwordInput).toHaveAttribute('type', 'password')

      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Interaction', () => {
    it('allows users to type in form fields', () => {
      render(<LoginPage {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)

      fireEvent.change(emailInput, { target: { value: 'user@company.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(emailInput).toHaveValue('user@company.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('shows loading state during form submission', async () => {
      const mockSignIn = vi.mocked(client.signIn.email)
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: { id: '1' } }, error: null }), 100)
          )
      )

      render(<LoginPage {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'user@company.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls signIn with correct credentials', async () => {
      const mockSignIn = vi.mocked(client.signIn.email)
      mockSignIn.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

      render(<LoginPage {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'user@company.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          {
            email: 'user@company.com',
            password: 'password123',
            callbackURL: '/workspace',
          },
          expect.objectContaining({
            onError: expect.any(Function),
          })
        )
      })
    })

    it('handles authentication errors', async () => {
      const mockSignIn = vi.mocked(client.signIn.email)

      mockSignIn.mockImplementation((credentials, options) => {
        if (options?.onError) {
          options.onError({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid credentials',
            } as any,
            response: {} as any,
            request: {} as any,
          } as any)
        }
        return Promise.resolve({ data: null, error: 'Invalid credentials' })
      })

      render(<LoginPage {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'user@company.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })
  })

  describe('Email Verification Flow', () => {
    it('redirects to verification page when email not verified', async () => {
      const mockSignIn = vi.mocked(client.signIn.email)
      const mockSendOtp = vi.mocked(client.emailOtp.sendVerificationOtp)

      mockSignIn.mockRejectedValue({
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
      })

      mockSendOtp.mockResolvedValue({ data: null, error: null })

      render(<LoginPage {...defaultProps} />)

      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'user@company.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith({
          email: 'user@company.com',
          type: 'email-verification',
        })
        expect(mockRouter.push).toHaveBeenCalledWith('/verify')
      })
    })
  })
})
