"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/auth-client";
import { quickValidateEmail } from "@/lib/email/validation";
import { cn } from "@/lib/utils";
import { voiceCakeApi } from "./voiceCakeApi";

const validateEmailField = (emailValue: string): string[] => {
  const errors: string[] = [];

  if (!emailValue || !emailValue.trim()) {
    errors.push("Email is required.");
    return errors;
  }

  const validation = quickValidateEmail(emailValue.trim().toLowerCase());
  if (!validation.isValid) {
    errors.push(validation.reason || "Please enter a valid email address.");
  }

  return errors;
};

const PASSWORD_VALIDATIONS = {
  required: {
    test: (value: string) => Boolean(value && typeof value === "string"),
    message: "Password is required.",
  },
  notEmpty: {
    test: (value: string) => value.trim().length > 0,
    message: "Password cannot be empty.",
  },
};

const validatePassword = (passwordValue: string): string[] => {
  const errors: string[] = [];

  if (!PASSWORD_VALIDATIONS.required.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.required.message);
    return errors; // Return early for required field
  }

  if (!PASSWORD_VALIDATIONS.notEmpty.test(passwordValue)) {
    errors.push(PASSWORD_VALIDATIONS.notEmpty.message);
    return errors; // Return early for empty field
  }

  return errors;
};

export default function LoginPage({
  githubAvailable,
  googleAvailable,
  isProduction,
}: {
  githubAvailable: boolean;
  googleAvailable: boolean;
  isProduction: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showValidationError, setShowValidationError] = useState(false);

  const [email, setEmail] = useState("");
  const [emailErrors, setEmailErrors] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get("email");
      if (emailParam) {
        const newEmail = decodeURIComponent(emailParam);
        setEmail(newEmail);
        const errors = validateEmailField(newEmail);
        setEmailErrors(errors);
      }
    }
    setIsPageLoading(false);
  }, [searchParams]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Silently validate but don't show errors until submit
    const errors = validateEmailField(newEmail);
    setEmailErrors(errors);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    const errors = validatePassword(newPassword);
    setPasswordErrors(errors);
    setShowValidationError(false);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // validations
    const emailValidationErrors = validateEmailField(email);
    setEmailErrors(emailValidationErrors);
    const passwordValidationErrors = validatePassword(password);
    setPasswordErrors(passwordValidationErrors);
    setShowValidationError(passwordValidationErrors.length > 0);

    if (
      emailValidationErrors.length > 0 ||
      passwordValidationErrors.length > 0
    ) {
      setIsLoading(false);
      return;
    }
    try {
      // Final validation before submission
      const safeCallbackUrl = "/workspace";
      const payload = {
        email,
        password,
        callbackURL: safeCallbackUrl,
      };
      await voiceCakeApi(payload);
      const result = await client.signIn.email(payload, {
        onError: (ctx) => {
          console.error("Login error:", ctx.error);
          const errorMessage: string[] = ["Invalid email or password"];

          if (ctx.error.code?.includes("EMAIL_NOT_VERIFIED")) {
            return;
          }
          if (
            ctx.error.code?.includes("BAD_REQUEST") ||
            ctx.error.message?.includes(
              "Email and password sign in is not enabled"
            )
          ) {
            errorMessage.push("Email sign in is currently disabled.");
          } else if (
            ctx.error.code?.includes("INVALID_CREDENTIALS") ||
            ctx.error.message?.includes("invalid password")
          ) {
            errorMessage.push("Invalid email or password. Please try again.");
          } else if (
            ctx.error.code?.includes("USER_NOT_FOUND") ||
            ctx.error.message?.includes("not found")
          ) {
            errorMessage.push(
              "No account found with this email. Please sign up first."
            );
          } else if (ctx.error.code?.includes("MISSING_CREDENTIALS")) {
            errorMessage.push("Please enter both email and password.");
          } else if (ctx.error.code?.includes("EMAIL_PASSWORD_DISABLED")) {
            errorMessage.push("Email and password login is disabled.");
          } else if (ctx.error.code?.includes("FAILED_TO_CREATE_SESSION")) {
            errorMessage.push(
              "Failed to create session. Please try again later."
            );
          } else if (ctx.error.code?.includes("too many attempts")) {
            errorMessage.push(
              "Too many login attempts. Please try again later or reset your password."
            );
          } else if (ctx.error.code?.includes("account locked")) {
            errorMessage.push(
              "Your account has been locked for security. Please reset your password."
            );
          } else if (ctx.error.code?.includes("network")) {
            errorMessage.push(
              "Network error. Please check your connection and try again."
            );
          } else if (ctx.error.message?.includes("rate limit")) {
            errorMessage.push(
              "Too many requests. Please wait a moment before trying again."
            );
          }

          setPasswordErrors(errorMessage);
          setShowValidationError(true);
        },
      });

      if (!result || result.error) {
        setIsLoading(false);
        return;
      }

      // Mark that the user has previously logged in
      if (typeof window !== "undefined") {
        localStorage.setItem("has_logged_in_before", "true");
        document.cookie =
          "has_logged_in_before=true; path=/; max-age=31536000; SameSite=Lax"; // 1 year expiry
      }
    } catch (err: any) {
      // Handle only the special verification case that requires a redirect
      if (
        err.message?.includes("not verified") ||
        err.code?.includes("EMAIL_NOT_VERIFIED")
      ) {
        try {
          await client.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });

          if (typeof window !== "undefined") {
            sessionStorage.setItem("verificationEmail", email);
          }

          router.push("/verify");
          return;
        } catch (_verifyErr) {
          setPasswordErrors([
            "Failed to send verification code. Please try again later.",
          ]);
          setShowValidationError(true);
          setIsLoading(false);
          return;
        }
      }

      console.error("Uncaught login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-[32px] text-white tracking-tight">
          Sign In
        </h1>
        <p className="text-neutral-400 text-sm">
          Enter your email below to sign in to your account
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-neutral-700/40 bg-neutral-800/50 p-6 backdrop-blur-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className={cn(
                  "border-neutral-700 bg-neutral-900 text-white placeholder:text-white/60",
                  emailErrors.length > 0 &&
                  "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {emailErrors.length > 0 && (
                <div className="mt-1 space-y-1 text-red-400 text-xs">
                  {emailErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={cn(
                    "border-neutral-700 bg-neutral-900 pr-10 text-white placeholder:text-white/60",
                    showValidationError &&
                    passwordErrors.length > 0 &&
                    "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="-translate-y-1/2 absolute top-1/2 right-3 text-neutral-400 transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showValidationError && passwordErrors.length > 0 && (
                <div className="mt-1 space-y-1 text-red-400 text-xs">
                  {passwordErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 bg-brand-primary font-medium text-base text-white shadow-[var(--brand-primary-hex)]/20 shadow-lg transition-colors duration-200 hover:bg-brand-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
        <div className="text-center text-neutral-500/80 text-xs leading-relaxed">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="text-neutral-400 underline-offset-4 transition hover:text-neutral-300 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-neutral-400 underline-offset-4 transition hover:text-neutral-300 hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
