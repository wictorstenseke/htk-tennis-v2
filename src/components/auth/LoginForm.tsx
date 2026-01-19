import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FirebaseError } from "firebase/app";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signUp } from "@/lib/auth";
import { cn } from "@/lib/utils";

const DISPLAY_NAME_MIN_LENGTH = 2;

const createLoginSchema = (mode: "signin" | "signup") =>
  z
    .object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      displayName: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (mode === "signup") {
        const trimmedName = data.displayName?.trim() ?? "";
        if (trimmedName.length < DISPLAY_NAME_MIN_LENGTH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["displayName"],
            message: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters`,
          });
        }
      }
    });

type LoginFormData = {
  email: string;
  password: string;
  displayName?: string;
};

interface LoginFormProps {
  onSuccess?: () => void;
  defaultMode?: "signin" | "signup";
}

const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/password authentication is not enabled.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
};

export const LoginForm = ({
  onSuccess,
  defaultMode = "signin",
}: LoginFormProps) => {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const loginSchema = useMemo(() => createLoginSchema(mode), [mode]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  useEffect(() => {
    setMode(defaultMode);
    setIsPasswordVisible(false);
    setServerError("");
    reset({ email: "", password: "", displayName: "" });
  }, [defaultMode, reset]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError("");

    try {
      if (mode === "signin") {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password, data.displayName?.trim());
      }
      reset({ email: "", password: "", displayName: "" });
      onSuccess?.();
    } catch (err) {
      if (err instanceof FirebaseError) {
        setServerError(getFirebaseErrorMessage(err));
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setIsPasswordVisible(false);
    setServerError("");
    clearErrors();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handlePasswordToggleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePasswordVisibility();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {mode === "signin" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          {mode === "signin"
            ? "Enter your email below to sign in to your account"
            : "Enter your email below to create your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isLoading}
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-sm font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {mode === "signup" && (
          <div className="grid gap-2">
            <Label htmlFor="displayName">Your display name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              disabled={isLoading}
              autoComplete="name"
              aria-invalid={!!errors.displayName}
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-destructive text-sm font-medium">
                {errors.displayName.message}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <InputGroup data-disabled={isLoading}>
            <InputGroupInput
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                aria-pressed={isPasswordVisible}
                onClick={togglePasswordVisibility}
                onKeyDown={handlePasswordToggleKeyDown}
                disabled={isLoading}
              >
                <HugeiconsIcon
                  icon={isPasswordVisible ? ViewOffIcon : EyeIcon}
                  size={16}
                />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.password && (
            <p className="text-destructive text-sm font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="text-destructive rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2" />}
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className={cn(
                "text-primary underline-offset-4 hover:underline font-medium",
                isLoading && "pointer-events-none opacity-50"
              )}
              disabled={isLoading}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className={cn(
                "text-primary underline-offset-4 hover:underline font-medium",
                isLoading && "pointer-events-none opacity-50"
              )}
              disabled={isLoading}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};
