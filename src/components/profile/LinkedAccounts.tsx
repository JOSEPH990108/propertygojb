// src\components\profile\LinkedAccounts.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Loader2, Check, X } from "lucide-react";
import { getAccountMethods, unlinkGoogleAccount } from "@/app/actions/auth-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LinkedAccounts() {
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [accountMethods, setAccountMethods] = useState<{
    google: boolean;
    hasPassword: boolean;
    phone: boolean;
  }>({ google: false, hasPassword: false, phone: false });
  const [isLoading, setIsLoading] = useState(true);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const fetchMethods = async () => {
    try {
      const res = await getAccountMethods();
      if (res.success && res.methods) {
        setAccountMethods(res.methods);
      }
    } catch (err) {
      console.error("Failed to fetch account methods", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const res = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/profile", // Redirect back to profile after linking
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to link Google account");
        setIsLinking(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsLinking(false);
    }
  };

  const handleDisconnectClick = () => {
    // Check if user has other methods
    const hasOtherMethods = accountMethods.hasPassword || accountMethods.phone;

    if (!hasOtherMethods) {
        toast.error("You cannot disconnect your only login method. Please add a password or verified phone number first, or delete your account.", {
            duration: 5000,
        });
        return;
    }

    setShowUnlinkModal(true);
  };

  const confirmUnlink = async () => {
    setIsUnlinking(true);
    try {
        const res = await unlinkGoogleAccount();
        if (res.success) {
            toast.success("Google account disconnected successfully");
            await fetchMethods(); // Refresh state
            setShowUnlinkModal(false);
        } else {
            toast.error(res.error || "Failed to disconnect Google account");
        }
    } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred");
    } finally {
        setIsUnlinking(false);
    }
  };

  const isGoogleLinked = accountMethods.google;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Linked Accounts</h3>

      {/* GOOGLE LINK */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
             <span className="font-bold text-muted-foreground">G</span>
           </div>
          <div>
            <p className="font-medium">Google</p>
            <p className="text-sm text-muted-foreground">
              {isGoogleLinked
                ? "Your Google account is connected."
                : "Link your Google account for easier login"}
            </p>
          </div>
        </div>

        {isLoading ? (
             <Button variant="ghost" disabled size="icon">
                <Loader2 className="h-4 w-4 animate-spin" />
             </Button>
        ) : (
            <Button
            variant={isGoogleLinked ? "secondary" : "outline"}
            onClick={isGoogleLinked ? handleDisconnectClick : handleLinkGoogle}
            disabled={isLinking || isUnlinking}
            className={
                isGoogleLinked
                ? "relative overflow-hidden group hover:bg-destructive hover:text-destructive-foreground transition-colors"
                : ""
            }
            >
            {isLinking ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
                </>
            ) : isUnlinking ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
                </>
            ) : isGoogleLinked ? (
                <>
                 {/* Default State: Connected */}
                 <span className="flex items-center group-hover:hidden">
                    <Check className="mr-2 h-4 w-4" />
                    Connected
                 </span>
                 {/* Hover State: Disconnect */}
                 <span className="hidden items-center group-hover:flex">
                    <X className="mr-2 h-4 w-4" />
                    Disconnect
                 </span>
                </>
            ) : (
                "Connect"
            )}
            </Button>
        )}
      </div>

      {/* Unlink Confirmation Modal */}
      <Dialog open={showUnlinkModal} onOpenChange={setShowUnlinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your Google account? You will need to use your phone number or password to log in next time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlinkModal(false)} disabled={isUnlinking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUnlink} disabled={isUnlinking}>
              {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
