// src\components\profile\ReferralCodeCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyReferralCode, applyReferralOnSignup } from "@/app/actions/referral-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const referralSchema = z.object({
  referralCode: z.string().min(1, "Please enter a code"),
});

type ReferralData = z.infer<typeof referralSchema>;

interface ReferralCodeCardProps {
    userId: string;
}

export function ReferralCodeCard({ userId }: ReferralCodeCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; message?: string } | null>(null);
  const [verifiedReferralCode, setVerifiedReferralCode] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    
  } = useForm<ReferralData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralCode: "",
    },
  });

  const watchedReferralCode = watch("referralCode");

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

  const onSubmit = async (data: ReferralData) => {
    setIsLoading(true);

    // Ensure verified
    if (!verifiedReferralCode) {
         const res = await verifyReferralCode(data.referralCode);
         if (!res.valid) {
             toast.error(res.message || "Invalid referral code");
             setIsLoading(false);
             return;
         }
         // Set verified code if successful so we can use it
         setVerifiedReferralCode(data.referralCode);
    }

    try {
        // Reuse applyReferralOnSignup as it handles the logic for linking
        const res = await applyReferralOnSignup(userId, data.referralCode);

        if (res.success) {
            toast.success("Referral code applied successfully!");
            router.refresh(); // To hide the card
        } else {
            toast.error(res.error || "Failed to apply referral code");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Referral Code</CardTitle>
        <CardDescription>
          Did someone refer you? Enter their code to link your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
                <Label>Referral Code</Label>
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
                {errors.referralCode && <p className="text-destructive text-xs">{errors.referralCode.message}</p>}
            </div>

            <Button type="submit" disabled={isLoading || !referralStatus?.valid}>
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                Save Referral
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
