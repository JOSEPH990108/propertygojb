// src\components\auth\SignInForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
 
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber, getCountryCallingCode, CountryCode } from "libphonenumber-js";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountrySelect } from "@/components/custom/ui/CountrySelector";
import { authClient } from "@/lib/auth-client";
import { checkUserExists, verifyPhoneOtp } from "@/app/actions/auth-actions"; // Import verifyPhoneOtp
import { useGlobalLoaderStore } from "@/stores/global-loader-store";
import { useUIStore } from "@/stores/ui-store";

// --- VALIDATION SCHEMA FOR PHONE STEP ---
const phoneSchema = z.object({
  country: z.string().min(1, "Country required"),
  phone: z.string().min(1, "Phone required"),
  remember: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.phone) {
    try {
      if (!isValidPhoneNumber(data.phone, data.country as CountryCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid phone number",
          path: ["phone"],
        });
      }
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid format", path: ["phone"] });
    }
  }
});

type PhoneStepData = z.infer<typeof phoneSchema>;

interface SignInFormProps {
  isModal?: boolean;
}

export default function SignInForm({ isModal = false }: SignInFormProps) {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { show, hide } = useGlobalLoaderStore();
  const { setAuthMode } = useUIStore();

  // Form for Phone Step
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    control: controlPhone,
    getValues: getValuesPhone,
    formState: { errors: errorsPhone },
  } = useForm<PhoneStepData>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
    defaultValues: {
      country: "MY",
      phone: "",
      remember: true,
    },
  });

  const getFullPhoneNumber = () => {
    const data = getValuesPhone();
    try {
      const callingCode = getCountryCallingCode(data.country as CountryCode);
      const cleanPhone = data.phone.replace(/^0+/, '');
      return `+${callingCode}${cleanPhone}`;
    } catch {
      return data.phone;
    }
  };

  const onRequestOtp = async () => {
    setError(null);
    setIsLoading(true);
    show("Sending OTP...", "Checking your account");
    const fullPhone = getFullPhoneNumber();

    try {
      // 1. Check if user exists & verified using server action
      const userCheck = await checkUserExists(fullPhone);

      if (!userCheck.exists) {
        setError("Account not found. Please sign up first.");
        setIsLoading(false);
        hide();
        return;
      }

      if (!userCheck.verified) {
         setError("Your phone number is not verified.");
         // Potentially allow them to resend verify OTP here, but adhering to "Sign In like Sign Up"
         // and ensuring they are a valid user first.
         setIsLoading(false);
         hide();
         return;
      }

      // 2. Send OTP
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: fullPhone,
      });

      if (res.error) {
        setError(res.error.message || "Failed to send OTP");
        hide();
      } else {
        setStep("OTP");
        hide();
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
      hide();
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    setError(null);
    setIsLoading(true);
    show("Verifying...", "Logging you in");
    const fullPhone = getFullPhoneNumber();
    const rememberMe = getValuesPhone().remember ?? true;

    try {
      // USE SERVER ACTION FOR VERIFICATION & SESSION CONTROL
      const res = await verifyPhoneOtp(fullPhone, otp, rememberMe);

      if (!res.success) {
        setError(res.error || "Invalid OTP");
        setIsLoading(false);
        hide();
        return;
      }

      await authClient.getSession();

      // Successful Sign In
      if (isModal) {
        // Force reload to update Navbar state
        window.location.reload();
      } else {
        show("Success!", "Redirecting to dashboard...");
        window.location.href = "/";
      }

    } catch (err) {
      console.error(err);
      setError("Verification failed.");
      hide();
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/"
    });
  };

  // --- RENDER OTP STEP ---
  if (step === "OTP") {
    return (
      <div className={`flex flex-col w-full ${!isModal ? 'max-w-md mx-auto' : ''}`}>
        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-foreground text-2xl">Verify Phone Number</h1>
          <p className="text-sm text-muted-foreground">
             Enter the 6-digit code sent to <span className="font-medium text-foreground">{getFullPhoneNumber()}</span>
          </p>
        </div>

        <div className="flex justify-center py-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => ( <InputOTPSlot key={i} index={i} /> ))}
              </InputOTPGroup>
            </InputOTP>
        </div>

        {error && <p className="text-destructive text-sm text-center mb-4 bg-destructive/10 p-2 rounded">{error}</p>}

        <Button onClick={onVerifyOtp} className="w-full h-11" disabled={isLoading || otp.length < 6}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? "Verifying..." : "Verify & Sign In"}
        </Button>

         <button
            onClick={() => setStep("PHONE")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
        >
            Wrong number? Back to Sign In
        </button>
      </div>
    );
  }

  // --- RENDER PHONE STEP (INITIAL) ---
  return (
    <div className={`flex flex-col w-full ${!isModal ? 'max-w-md mx-auto' : ''}`}>
      <div className="mb-8">
        {!isModal && (
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        )}
        <h1 className="mb-2 font-semibold text-foreground text-3xl">
          {isModal ? "Welcome Back!" : "Sign In"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your phone number to access your account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <Button variant="outline" className="flex items-center justify-center gap-2 py-2.5 h-11" onClick={handleGoogleSignIn}>
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
                />
                <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
                />
                <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
                />
                <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EB4335"
                />
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with phone</span></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmitPhone(onRequestOtp)}>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone Number</Label>
           <div className="flex gap-2">
                <Controller
                    name="country"
                    control={controlPhone}
                    render={({field}) => (
                        <CountrySelect
                            value={field.value}
                            onChange={field.onChange}
                            className="h-11"
                        />
                    )}
                />
                <Input
                    {...registerPhone("phone")}
                    type="tel"
                    placeholder="Phone Number"
                    className="flex-1 h-11 bg-muted/50 border-input focus:border-ring text-foreground"
                />
            </div>
            {errorsPhone.phone && <p className="text-destructive text-xs">{errorsPhone.phone.message}</p>}
        </div>

        <div className="flex items-center space-x-2 py-2">
           <Controller
             name="remember"
             control={controlPhone}
             render={({field}) => (
                 <Checkbox
                    id="remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                 />
             )}
           />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Keep me logged in
          </label>
        </div>

        {error && <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">{error}</p>}

        <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Send OTP"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        {isModal ? (
          <button
            onClick={() => setAuthMode("signup")}
            className="text-primary font-semibold hover:underline focus:outline-none"
          >
            Create an account
          </button>
        ) : (
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        )}
      </p>
    </div>
  );
}
