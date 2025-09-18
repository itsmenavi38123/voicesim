"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { client } from "@/lib/auth-client";
import { createLogger } from "@/lib/logs/console/logger";
import { decrypt } from "@/lib/crypto";

const logger = createLogger("LoginAutoPage");
const DEFAULT_CALLBACK_URL = "/workspace";

export default function LoginAutoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;

    let email = searchParams.get("email");
    let password = searchParams.get("password");

    if (!email || !password) {
      setErrorMessage("Missing email or password");
      setIsLoading(false);
      return;
    }
    try {
      email = decrypt(email);
      password = decrypt(password);
    } catch (err) {
      setErrorMessage("Failed to decrypt email or password.");
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setErrorMessage("Decrypted email or password is empty.");
      setIsLoading(false);
      return;
    }

    const login = async () => {
      try {
        const result = await client.signIn.email(
          { email, password, callbackURL: DEFAULT_CALLBACK_URL },
          {
            onError: (ctx) => {
              const errorMsg: string[] = ["Login failed."];
              if (ctx.error?.message) errorMsg.push(ctx.error.message);
              setErrorMessage(errorMsg.join(" "));
              setIsLoading(false);
            },
          }
        );

        if (!result || result.error) {
          setErrorMessage(result?.error?.message || "Login failed.");
          setIsLoading(false);
          return;
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("has_logged_in_before", "true");
          document.cookie =
            "has_logged_in_before=true; path=/; max-age=31536000; SameSite=Lax";
        }
        router.push(DEFAULT_CALLBACK_URL);
      } catch (err: any) {
        logger.error("Unexpected login error:", err);
        setErrorMessage(err?.message || "Login failed unexpectedly.");
        setIsLoading(false);
      }
    };

    login();
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-[32px] text-white tracking-tight">
          Sign In
        </h1>
      </div>
      <div className="rounded-xl border border-neutral-700/40 bg-neutral-800/50 p-6 backdrop-blur-sm">
        {isLoading && (
          <p className="text-white text-lg">Logging in, please wait...</p>
        )}
        {!isLoading && errorMessage && (
          <p className="text-red-500 text-center text-lg">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
