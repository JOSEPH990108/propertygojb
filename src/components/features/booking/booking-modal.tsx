"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment } from "@/actions/appointments";
import {
  Check,
  Clock,
  CalendarDays,
  User,
  ArrowRight,
  Loader2,
  Briefcase,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Constants ---
const TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
];

const MOCK_USER = {
  name: "Alex Chen",
  email: "alex.chen@example.com"
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

export function BookingModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
}: BookingModalProps) {
  // State
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [focus, setFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    // Reset after a short delay to allow exit animation
    setTimeout(() => {
      setStep(1);
      setDate(new Date());
      setTime(null);
      setFocus("");
    }, 300);
  };

  // Handlers
  const handleNext = () => {
    if (!date || !time) {
      toast.error("Please select both a date and time.");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!date || !time) return;

    setIsSubmitting(true);
    try {
      const result = await bookAppointment({
        propertyId,
        propertyName,
        date,
        time,
        focus,
        contactName: MOCK_USER.name,
        contactEmail: MOCK_USER.email,
      });

      if (result.success) {
        toast.success("Appointment Confirmed", {
          description: result.message,
          duration: 5000,
        });
        handleClose();
      } else {
        toast.error("Booking Failed", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Date for Display
  const formattedDate = date ? date.toLocaleDateString("en-US", {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : "Select a date";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">

        {/* Header Section with Gradient & Title */}
        <div className="relative p-6 pb-2">
          {/* Subtle gold accent bg */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
                     {step}/2
                  </span>
                  <DialogTitle className="text-2xl font-serif text-white tracking-wide">
                    Private Tour
                  </DialogTitle>
               </div>
            </div>
            <DialogDescription className="text-zinc-400">
               {step === 1
                 ? `Select a date and time to visit ${propertyName}.`
                 : "Confirm your details to finalize the booking."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2 min-h-[400px]">
          <AnimatePresence mode="wait">

            {/* STEP 1: DATE & TIME */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Left: Calendar */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <CalendarDays className="w-3 h-3" /> Date
                      </label>
                      <div className="border border-zinc-800 rounded-lg p-2 bg-zinc-900/50">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          className="rounded-md"
                          classNames={{
                             head_cell: "text-zinc-500",
                             cell: "text-zinc-300 hover:text-white focus:text-white",
                             day: "hover:bg-zinc-800 rounded-md transition-colors",
                             day_selected: "bg-yellow-500 text-black hover:bg-yellow-600 hover:text-black font-bold",
                             day_today: "bg-zinc-800 text-white font-bold",
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        />
                      </div>
                   </div>

                   {/* Right: Time Slots */}
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <Clock className="w-3 h-3" /> Time
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                         {TIME_SLOTS.map((slot) => (
                           <button
                             key={slot}
                             onClick={() => setTime(slot)}
                             className={cn(
                               "px-3 py-2 text-sm rounded-md border transition-all duration-200 text-center",
                               time === slot
                                 ? "bg-yellow-500 text-black border-yellow-500 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                 : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                             )}
                           >
                             {slot}
                           </button>
                         ))}
                      </div>
                      {time && (
                         <p className="text-xs text-center text-yellow-500/80 mt-2 font-medium">
                            Selected: {formattedDate} at {time}
                         </p>
                      )}
                   </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end pt-4 border-t border-zinc-800">
                   <Button
                      onClick={handleNext}
                      disabled={!date || !time}
                      className="bg-zinc-100 text-black hover:bg-white px-8 font-bold"
                   >
                      Next Step <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
                   <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                      <Sparkles className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white mb-1">Appointment Summary</h4>
                      <p className="text-sm text-zinc-400">
                         {propertyName} <br/>
                         <span className="text-yellow-500">{formattedDate}</span> at <span className="text-yellow-500">{time}</span>
                      </p>
                   </div>
                </div>

                {/* Contact Form */}
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs text-zinc-500 uppercase font-bold">Name</label>
                         <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <Input
                               value={MOCK_USER.name}
                               readOnly
                               className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-400 cursor-not-allowed focus-visible:ring-0"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs text-zinc-500 uppercase font-bold">Email</label>
                         <Input
                             value={MOCK_USER.email}
                             readOnly
                             className="bg-zinc-900 border-zinc-800 text-zinc-400 cursor-not-allowed focus-visible:ring-0"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-2">
                         <Briefcase className="w-3 h-3" /> Focus Area (Optional)
                      </label>
                      <Textarea
                         placeholder="E.g. Investment potential, Amenities, Financing options..."
                         value={focus}
                         onChange={(e) => setFocus(e.target.value)}
                         className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 min-h-[100px] resize-none focus-visible:ring-1 focus-visible:ring-yellow-500/50"
                      />
                   </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                   <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-900"
                   >
                      Back
                   </Button>
                   <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 font-bold min-w-[140px]"
                   >
                      {isSubmitting ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                         <>Confirm <Check className="w-4 h-4 ml-2" /></>
                      )}
                   </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
