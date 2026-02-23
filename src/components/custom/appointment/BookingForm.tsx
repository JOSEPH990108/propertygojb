// src\components\custom\appointment\BookingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createAppointment } from "@/app/actions/appointment-actions";
import { verifyReferralCode } from "@/app/actions/referral-actions";
import { toast } from "sonner";

const formSchema = z.object({
  date: z.date(),
  notes: z.string().optional(),
  referralCode: z.string().optional(),
});

interface BookingFormProps {
  projectId: string;
}

export function BookingForm({ projectId }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReferralValid, setIsReferralValid] = useState<boolean | null>(null);
  const [referralMessage, setReferralMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      referralCode: "",
    },
  });

  // Auto-fill from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      form.setValue("referralCode", refCode);
      validateReferral(refCode);
    }
  }, [searchParams, form]);

  const validateReferral = async (code: string) => {
    if (!code) {
      setIsReferralValid(null);
      setReferralMessage("");
      return;
    }
    const result = await verifyReferralCode(code);
    setIsReferralValid(result.valid);
    setReferralMessage(result.message || (result.valid ? `Referred by ${result.referrerName}` : "Invalid code"));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const res = await createAppointment({
            projectId,
            scheduledAt: values.date,
            referralCode: values.referralCode,
            notes: values.notes
        });

        if (res.success) {
            toast.success("Appointment Booked!", { description: "An agent will confirm shortly." });
            router.push("/appointments");
        } else {
            toast.error("Booking Failed", { description: res.error });
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date & Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Code (Optional)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Enter code"
                    {...field}
                    onBlur={(e) => validateReferral(e.target.value)}
                  />
                </FormControl>
                {isReferralValid !== null && (
                    <div className="absolute right-3 top-2.5">
                        {isReferralValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                    </div>
                )}
              </div>
              {referralMessage && (
                  <p className={cn("text-sm mt-1", isReferralValid ? "text-green-600" : "text-red-500")}>
                      {referralMessage}
                  </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requests?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Booking..." : "Confirm Booking"}
        </Button>
      </form>
    </Form>
  );
}
