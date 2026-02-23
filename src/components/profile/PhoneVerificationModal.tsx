// src\components\profile\PhoneVerificationModal.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2, Phone } from "lucide-react";
import parsePhoneNumber from "libphonenumber-js";
import { CountrySelect } from "@/components/custom/ui/CountrySelector";

// Schema for Phone Input
const phoneSchema = z.object({
  country: z.string().min(1), // Store country code (e.g., "MY")
  phoneNumber: z.string().min(1, "Phone number is required"),
});

// Schema for OTP Input
const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export function PhoneVerificationModal({
  currentPhoneNumber,
  onSuccess,
}: {
  currentPhoneNumber?: string | null;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      country: "MY",
      phoneNumber: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSendOtp = async (values: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    try {
      // 1. Format phone number
      const parsedPhone = parsePhoneNumber(values.phoneNumber, values.country as any);
      if (!parsedPhone || !parsedPhone.isValid()) {
        phoneForm.setError("phoneNumber", { message: "Invalid phone number" });
        setIsLoading(false);
        return;
      }
      const e164Phone = parsedPhone.number;
      setTargetPhone(e164Phone);

      // 2. Send OTP via BetterAuth
      const { error } = await authClient.phoneNumber.sendOtp({
        phoneNumber: e164Phone,
      });

      if (error) {
        toast.error(error.message || "Failed to send OTP");
      } else {
        toast.success("OTP sent successfully");
        setStep("OTP");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    try {
      // 3. Verify OTP & Update Phone
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: targetPhone,
        code: values.otp,
        updatePhoneNumber: true,
      });

      if (error) {
        toast.error(error.message || "Invalid OTP or Phone already in use");
      } else {
        toast.success("Phone number verified and updated!");
        setOpen(false);
        setStep("PHONE");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Phone className="h-4 w-4" />
          {currentPhoneNumber ? "Change Phone" : "Add Phone"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "PHONE" ? "Enter Phone Number" : "Verify Phone Number"}
          </DialogTitle>
          <DialogDescription>
            {step === "PHONE"
              ? "Enter your mobile number to receive a verification code."
              : `Enter the 6-digit code sent to ${targetPhone}`}
          </DialogDescription>
        </DialogHeader>

        {step === "PHONE" && (
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(onSendOtp)}
              className="space-y-4"
            >
              <div className="flex gap-2">
                  <FormField
                    control={phoneForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="flex-shrink-0 w-[120px]">
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <CountrySelect
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={phoneForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Code
              </Button>
            </form>
          </Form>
        )}

        {step === "OTP" && (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(onVerifyOtp)}
              className="space-y-4"
            >
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("PHONE")}
                  disabled={isLoading}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
