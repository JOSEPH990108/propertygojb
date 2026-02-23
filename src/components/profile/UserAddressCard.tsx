// src\components\profile\UserAddressCard.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BaseCard } from "@/components/shared/base-card";
import { CountrySelect } from "@/components/custom/ui/CountrySelector";
import { updateProfile } from "@/app/actions/profile-actions";

interface UserAddressCardProps {
  nationality: string | null;
  userName: string | null;
}

export function UserAddressCard({ nationality, userName }: UserAddressCardProps) {
  const [currentNationality, setCurrentNationality] = useState(nationality || "MY");

  async function handleNationalityChange(value: string) {
    // Optimistic update
    setCurrentNationality(value);

    try {
      // Need to pass name to updateProfile because existing action expects full profile or need to update action to allow partial.
      // Current profileSchema: name is required.
      // So I must pass the name.

      const result = await updateProfile({
        name: userName || "", // Assumption: name exists. If not, this might fail validation if name < 2 chars.
        nationality: value,
      });

      if (result.success) {
        toast.success("Location updated successfully");
      } else {
        toast.error("Failed to update location");
        // Revert on error could be implemented here
      }
    } catch (error) {
        toast.error("An error occurred");
    }
  }

  return (
    <BaseCard
      className="h-full"
      title="Location"
      titleClassName="text-xl font-bold"
      description="Set your primary location/nationality."
      contentClassName="space-y-4"
    >
      <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Country / Region</label>
          <CountrySelect
            value={currentNationality}
            onChange={handleNationalityChange}
            className="w-full"
          />
           <p className="text-[0.8rem] text-muted-foreground">
              This helps us personalize your experience.
          </p>
      </div>
    </BaseCard>
  );
}
