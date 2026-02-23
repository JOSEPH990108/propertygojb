// src\components\auth\OnboardingModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalLoaderStore } from "@/stores/global-loader-store";
import { updateProfileAfterSignup, getOnboardingStatus } from "@/app/actions/auth-actions";
import { verifyReferralCode } from "@/app/actions/referral-actions";

const referralSchema = z.object({
  referralCode: z.string().optional(),
});

type ReferralStepData = z.infer<typeof referralSchema>;

export default function OnboardingModal() {
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; message?: string } | null>(null);
  const [verifiedReferralCode, setVerifiedReferralCode] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  const pathname = usePathname();
  const router = useRouter();
  const { show, hide } = useGlobalLoaderStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { },
  } = useForm<ReferralStepData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralCode: "",
    },
  });

  const watchedReferralCode = watch("referralCode");

  // Check if onboarding is needed via Server Action to ensure we have up-to-date DB status
  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
        // Fetch status
        getOnboardingStatus().then((res) => {
            // Only show modal if user is not completed AND has a name (Google flow).
            // Phone flow users start with no name in DB and fill it in SignUpForm.
            // This prevents the modal from overlapping the Phone SignUp flow.
            if (res.success && res.completed === false && res.userName) {
                 setUserName(res.userName);
                 setIsOpen(true);
            } else {
                 setIsOpen(false);
            }
        });
    } else {
       setIsOpen(false);
    }
  }, [session, isPending, pathname]);

  // Reset status when input changes
  useEffect(() => {
    if (verifiedReferralCode && watchedReferralCode !== verifiedReferralCode) {
      setReferralStatus(null);
      setVerifiedReferralCode(null);
    } else if (referralStatus && !watchedReferralCode) {
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

  const onSubmit = async (data: ReferralStepData) => {
    setIsLoading(true);
    setError(null);
    show("Finalizing...", "Setting up your account");

    // Verify if entered but not applied
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
        name: userName, // Use the fetched name from DB
        referralCode: data.referralCode,
      });

      if (!updateRes.success) {
        setError(updateRes.error || "Failed to update profile");
        setIsLoading(false);
        hide();
        return;
      }

      setIsOpen(false);
      hide();
      router.refresh();
    } catch (e) {
      setError("Failed to complete setup.");
      setIsLoading(false);
      hide();
    }
  };

  const handleSkip = async () => {
      await onSubmit({ referralCode: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>One Last Thing!</DialogTitle>
          <DialogDescription>
            Do you have a referral code? Enter it below to claim your rewards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-1.5">
            <Label>Referral Code (Optional)</Label>
            <div className="flex gap-2">
                <Input
                    {...register("referralCode")}
                    placeholder="Enter code"
                    className={referralStatus?.valid ? "border-green-500 focus-visible:ring-green-500" : ""}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => verifyReferral(watch("referralCode") || "")}
                    disabled={isLoading || !watch("referralCode")}
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
                    {isLoading ? "Completing..." : "Complete Setup"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleSkip} disabled={isLoading}>
                    Skip for now
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
