// src\components\auth\LoginModal.tsx
"use client";


import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import Image from "next/image";
import { useUIStore } from "@/stores/ui-store";

export default function LoginModal() {
  const { isLoginOpen, setLoginOpen, dismissModal, authMode } = useUIStore();

  return (
    <Dialog.Root open={isLoginOpen} onOpenChange={(open) => {
      if (!open) dismissModal(); // Handle clicks outside or ESC key
      else setLoginOpen(true);
    }}>
      <AnimatePresence>
        {isLoginOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <div className="fixed inset-0 z-101 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative flex w-full max-w-[850px] overflow-hidden rounded-2xl bg-card shadow-2xl min-h-[500px]"
                >
                  {/* Accessibility: Fixes the 'DialogTitle' error */}
                  <Dialog.Title className="sr-only">
                    {authMode === "signin" ? "Login to your account" : "Create an account"}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    {authMode === "signin"
                      ? "Enter your credentials to access your properties."
                      : "Fill in the details to create your new account."}
                  </Dialog.Description>

                  <div className="flex-1 p-8 sm:p-12 overflow-y-auto no-scrollbar max-h-[90vh]">
                    {authMode === "signin" ? (
                      <SignInForm isModal={true} />
                    ) : (
                      <SignUpForm isModal={true} />
                    )}
                  </div>

                  <div className="relative hidden w-1/2 lg:block">
                    <Image
                      src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1000&q=80"
                      alt="Login"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-brand-950/20" />
                  </div>

                  <button 
                    onClick={dismissModal} // Specifically uses dismissModal logic
                    className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors z-10"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
