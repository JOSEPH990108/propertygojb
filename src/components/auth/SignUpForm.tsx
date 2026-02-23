// src\components\auth\SignUpForm.tsx
"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber, getCountryCallingCode, CountryCode } from "libphonenumber-js";
import { ChevronLeft, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
 

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountrySelect } from "@/components/custom/ui/CountrySelector";
import { authClient } from "@/lib/auth-client";
import { useGlobalLoaderStore } from "@/stores/global-loader-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

// ✅ IMPORT THE SERVER ACTION
import { updateProfileAfterSignup, verifyPhoneOtp } from "@/app/actions/auth-actions";
import { verifyReferralCode } from "@/app/actions/referral-actions";

// --- VALIDATION SCHEMA FOR PHONE STEP ---
const phoneSchema = z.object({
  country: z.string().min(1, "Country required"),
  phone: z.string().min(1, "Phone required"),
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

// --- VALIDATION SCHEMA FOR DETAILS STEP ---
const detailsSchema = z.object({
    name: z.string().min(1, "Full Name is required"),
});

// --- VALIDATION SCHEMA FOR REFERRAL STEP ---
const referralSchema = z.object({
    referralCode: z.string().optional(),
});


type PhoneStepData = z.infer<typeof phoneSchema>;
type DetailsStepData = z.infer<typeof detailsSchema>;
type ReferralStepData = z.infer<typeof referralSchema>;

interface SignUpFormProps {
  isModal?: boolean;
}

function SignUpFormContent({ isModal = false }: SignUpFormProps) {
  const [step, setStep] = useState<"PHONE" | "OTP" | "DETAILS" | "REFERRAL">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; message?: string } | null>(null);
  const [verifiedReferralCode, setVerifiedReferralCode] = useState<string | null>(null);

  // Global State for Terms and Remember Me
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isRememberMe, setIsRememberMe] = useState(true);

  // Store name temporarily between DETAILS and REFERRAL steps
  const [tempName, setTempName] = useState<string>("");

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
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
    },
  });

  // Form for Details Step
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    formState: { errors: errorsDetails },
  } = useForm<DetailsStepData>({
    resolver: zodResolver(detailsSchema),
    mode: "onChange",
    defaultValues: {
        name: "",
    }
  });

  // Form for Referral Step
  const {
    register: registerReferral,
    handleSubmit: handleSubmitReferral,
    watch: watchReferral,
    
  } = useForm<ReferralStepData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
        referralCode: "",
    }
  });

   const watchedReferralCode = watchReferral("referralCode");

   // Watch referral code to reset status on change
  useEffect(() => {
    if (verifiedReferralCode && watchedReferralCode !== verifiedReferralCode) {
        setReferralStatus(null);
        setVerifiedReferralCode(null);
    }
    else if (referralStatus && !watchedReferralCode) {
        setReferralStatus(null);
    }
  }, [watchedReferralCode, referralStatus, verifiedReferralCode]);


  const verifyReferral = async (code: string) => {
      if (!code) return;
      setIsLoading(true);
      try {
          const res = await verifyReferralCode(code);
          if (res.valid) {
              setReferralStatus({ valid: true, message: `Referred by ${res.referrerName}` });
              setVerifiedReferralCode(code);
          } else {
              setReferralStatus({ valid: false, message: res.message || "Invalid code" });
              setVerifiedReferralCode(null);
          }
      } catch (e) {
          setReferralStatus({ valid: false, message: "Error verifying code" });
      } finally {
          setIsLoading(false);
      }
  };


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
    if (!isTermsAccepted) {
      setError("You must accept the Terms & Policy to continue.");
      return;
    }
    setError(null);
    setIsLoading(true);
    show("Sending OTP...", "Creating your account");
    const fullPhone = getFullPhoneNumber();

    try {
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
    show("Verifying...", "Setting up profile");
    const fullPhone = getFullPhoneNumber();

    try {
      // Use Server Action to verify & handle session cookie (Remember Me)
      const res = await verifyPhoneOtp(fullPhone, otp, isRememberMe);

      if (!res.success) {
        setError(res.error || "Invalid OTP");
        setIsLoading(false);
        hide();
        return;
      }

      // Check if new user
      if (res.isNewUser) {
          setStep("DETAILS");
          hide();
      } else {
          await authClient.getSession();

          if (isModal) {
            window.location.reload();
          } else {
            show("Success!", "Redirecting...");
            window.location.href = callbackUrl;
          }
      }
      
    } catch (err) {
      console.error(err);
      setError("Verification failed.");
      hide();
    } finally {
        setIsLoading(false);
    }
  };

  // Step 3: Name Input -> Move to Referral
  const onNameSubmit = (data: DetailsStepData) => {
      setTempName(data.name);
      setStep("REFERRAL");
  };

  // Step 4: Referral Input -> Finalize
  const onReferralSubmit = async (data: ReferralStepData) => {
      setIsLoading(true);
      setError(null);
      show("Finalizing...", "Updating your profile");

      if (data.referralCode && !verifiedReferralCode) {
          const res = await verifyReferralCode(data.referralCode);
          if (!res.valid) {
              setError(res.message || "Invalid referral code");
              setIsLoading(false);
              hide();
              return;
          }
      }

      try {
        const updateRes = await updateProfileAfterSignup({
            name: tempName,
            referralCode: data.referralCode,
        });

        if (!updateRes.success) {
            setError(updateRes.error || "Failed to update profile");
            setIsLoading(false);
            hide();
            return;
        }

        await authClient.getSession();

        if (isModal) {
          window.location.reload();
        } else {
          show("All Set!", "Redirecting...");
          window.location.href = callbackUrl;
        }

      } catch (e) {
          setError("Failed to update profile.");
          setIsLoading(false);
          hide();
      }
  };

  const handleSkipReferral = async () => {
       await onReferralSubmit({ referralCode: "" });
  };

  const handleGoogleSignIn = async () => {
    if (!isTermsAccepted) {
      setError("You must accept the Terms & Policy to continue.");
      return;
    }
    await authClient.signIn.social({ 
      provider: "google",
      callbackURL: callbackUrl,
      // Note: Google Sign In session persistence is handled by the server's default configuration (usually persistent).
      // Custom session duration based on checkbox is not supported for social login in this flow.
    });
  };

  // --- RENDER OTP STEP ---
  if (step === "OTP") {
    return (
      <div className={cn("flex flex-col flex-1 w-full items-center justify-center min-h-[500px]", !isModal && "lg:w-1/2 overflow-y-auto no-scrollbar")}>
        <div className="w-full max-w-md mx-auto space-y-6 text-center px-4">
          <h1 className="text-2xl font-semibold">Verify Phone Number</h1>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code sent to <span className="font-medium text-foreground">{getFullPhoneNumber()}</span>
          </p>
          <div className="flex justify-center py-6">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => ( <InputOTPSlot key={i} index={i} /> ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</p>}
          
          <Button onClick={onVerifyOtp} className="w-full" disabled={isLoading || otp.length < 6}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? "Verifying..." : "Verify & Sign In"}
          </Button>
          
          <button onClick={() => setStep("PHONE")} className="text-sm text-muted-foreground hover:text-foreground underline">
            Wrong number? Back to Details
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER DETAILS (NAME) STEP ---
  if (step === "DETAILS") {
      return (
        <div className={cn("flex flex-col flex-1 w-full items-center justify-center min-h-[500px]", !isModal && "lg:w-1/2 overflow-y-auto no-scrollbar")}>
            <div className="w-full max-w-md mx-auto space-y-6 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">What's your name?</h1>
                    <p className="text-muted-foreground text-sm">Please provide your full name.</p>
                </div>

                <form onSubmit={handleSubmitDetails(onNameSubmit)} className="space-y-4">
                     <div className="space-y-1.5">
                        <Label>Full Name*</Label>
                        <Input {...registerDetails("name")} placeholder="John Doe" />
                        {errorsDetails.name && <p className="text-destructive text-xs">{errorsDetails.name.message}</p>}
                    </div>

                    <Button type="submit" className="w-full">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>
        </div>
      );
  }

  // --- RENDER REFERRAL STEP ---
  if (step === "REFERRAL") {
      return (
        <div className={cn("flex flex-col flex-1 w-full items-center justify-center min-h-[500px]", !isModal && "lg:w-1/2 overflow-y-auto no-scrollbar")}>
             <div className="w-full max-w-md mx-auto space-y-6 px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">Got a Referral Code?</h1>
                    <p className="text-muted-foreground text-sm">Enter it below to claim your rewards, or skip this step.</p>
                </div>

                <form onSubmit={handleSubmitReferral(onReferralSubmit)} className="space-y-4">
                     <div className="space-y-1.5">
                        <Label>Referral Code (Optional)</Label>
                        <div className="flex gap-2">
                             <Input
                                {...registerReferral("referralCode")}
                                placeholder="Enter code"
                                className={referralStatus?.valid ? "border-green-500 focus-visible:ring-green-500" : ""}
                             />
                             <Button
                                type="button"
                                variant="outline"
                                onClick={() => verifyReferral(watchReferral("referralCode") || "")}
                                disabled={isLoading || !watchReferral("referralCode")}
                             >
                                Apply
                             </Button>
                        </div>
                        {referralStatus && (
                            <div className={`flex items-center gap-1.5 text-xs ${referralStatus.valid ? "text-green-600" : "text-destructive"}`}>
                                {referralStatus.valid ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                                {referralStatus.message}
                            </div>
                        )}
                     </div>

                     {error && <p className="text-destructive text-sm bg-destructive/10 p-2 rounded text-center">{error}</p>}

                     <div className="space-y-2 pt-2">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                            {isLoading ? "Completing..." : "Complete Signup"}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={handleSkipReferral} disabled={isLoading}>
                            Skip for now
                        </Button>
                     </div>
                </form>
             </div>
        </div>
      );
  }

  // --- RENDER PHONE STEP (INITIAL) ---
  return (
    <div className={cn("flex flex-col flex-1 w-full", !isModal && "lg:w-1/2 overflow-y-auto no-scrollbar")}>
       <div className="w-full max-w-md sm:pt-10 mx-auto mb-5 px-4">
        {!isModal && (
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1"/> Back to main
          </Link>
        )}
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 pb-10">
        <div className="mb-8">
          <h1 className="mb-2 font-semibold text-foreground text-2xl">Sign Up</h1>
          <p className="text-sm text-muted-foreground">Create a passwordless account.</p>
        </div>

        <div className="space-y-5">

           <Button
                variant="outline"
                className="w-full gap-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGoogleSignIn}
                disabled={!isTermsAccepted}
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EB4335"/></svg>
             Sign up with Google
           </Button>

           <div className="relative py-2 text-center text-sm text-muted-foreground">
             <span className="bg-background px-2 relative z-10">Or with Phone</span>
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
           </div>

           <form onSubmit={handleSubmitPhone(onRequestOtp)}>
             <div className="space-y-4">

               <div className="space-y-1.5">
                  <Label>Phone Number*</Label>
                  <div className="flex gap-2">
                    <Controller name="country" control={controlPhone} render={({field}) => <CountrySelect className="h-11" value={field.value} onChange={field.onChange} />} />
                    <Input type="tel" className="flex-1 h-11" {...registerPhone("phone")} placeholder="Phone Number" disabled={!isTermsAccepted} />
                  </div>
                  {errorsPhone.phone && <p className="text-destructive text-xs">{errorsPhone.phone.message}</p>}
               </div>

                {/* TERMS AND CONDITIONS CHECKBOX (Moved here) */}
               <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                 <Checkbox
                    id="terms"
                    checked={isTermsAccepted}
                    onCheckedChange={(checked) => setIsTermsAccepted(checked as boolean)}
                    className="mt-0.5"
                 />
                 <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        I agree to the Terms of Service and Privacy Policy
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        You must accept our corporate terms and conditions to proceed with registration or login via any method.
                    </p>
                 </div>
               </div>

                {/* KEEP ME LOGGED IN CHECKBOX */}
               <div className="flex items-center space-x-2 py-2">
                 <Checkbox
                    id="remember"
                    checked={isRememberMe}
                    onCheckedChange={(checked) => setIsRememberMe(checked as boolean)}
                    disabled={!isTermsAccepted}
                 />
                 <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer font-normal">
                    Keep me logged in
                 </Label>
                </div>

               {error && <p className="text-destructive text-sm bg-destructive/10 p-2 rounded text-center">{error}</p>}

               <Button type="submit" className="w-full mt-2" disabled={isLoading || !isTermsAccepted}>
                 {isLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                 {isLoading ? "Sending OTP..." : "Continue"}
               </Button>
             </div>
           </form>
           
           <div className="text-center text-sm text-muted-foreground">
             Already have an account?{" "}
             {isModal ? (
               <button onClick={() => setAuthMode("signin")} className="text-primary font-medium hover:underline focus:outline-none">
                 Sign In
               </button>
             ) : (
               <Link href="/signin" className="text-primary font-medium">Sign In</Link>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpForm(props: SignUpFormProps) {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
      <SignUpFormContent {...props} />
    </Suspense>
  );
}
