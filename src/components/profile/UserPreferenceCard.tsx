// src\components\profile\UserPreferenceCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePreferences } from "@/app/actions/profile-actions";
import { toast } from "sonner";
import { Moon, Sun, Monitor } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserPreferenceCardProps {
  preferences: {
    language: string | null;
    currency: string | null;
    notificationSettings: {
        email: boolean;
        whatsapp: boolean;
    } | null;
  }
}

export function UserPreferenceCard({ preferences }: UserPreferenceCardProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [language, setLanguage] = useState(preferences.language || "en");
  const [currency, setCurrency] = useState(preferences.currency || "MYR");
  const [notifications, setNotifications] = useState(preferences.notificationSettings || { email: true, whatsapp: true });

  const handleUpdate = async (key: string, value: any) => {
      let newPrefs: any = {
          language,
          currency,
          notificationSettings: notifications,
      };

      if (key === 'language') {
          newPrefs.language = value;
          setLanguage(value);
      } else if (key === 'currency') {
          newPrefs.currency = value;
          setCurrency(value);
      } else if (key === 'notifications') {
          newPrefs.notificationSettings = value;
          setNotifications(value);
      } else if (key === 'theme') {
          // Theme is handled by useTheme but we also save it to DB
          newPrefs.theme = value;
      }

      // Save to DB
      const result = await updatePreferences(newPrefs);
      if (!result.success) {
          toast.error("Failed to save preference");
      }
  };

  const handleThemeChange = (newTheme: string) => {
      setTheme(newTheme);
      handleUpdate('theme', newTheme);
  };

  const handleNotificationChange = (type: 'email' | 'whatsapp', checked: boolean) => {
      const newSettings = { ...notifications, [type]: checked };
      handleUpdate('notifications', newSettings);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Preferences</CardTitle>
        <CardDescription>
          Customize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appearance */}
        <div className="space-y-2">
            <Label className="text-base">Appearance</Label>
             {!mounted ? (
               <div className="animate-pulse bg-muted h-9 w-full rounded-lg" />
             ) : (
               <Tabs value={theme} onValueChange={handleThemeChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="light">
                          <Sun className="mr-2 h-4 w-4" />
                          Light
                      </TabsTrigger>
                      <TabsTrigger value="dark">
                          <Moon className="mr-2 h-4 w-4" />
                          Dark
                      </TabsTrigger>
                      <TabsTrigger value="system">
                          <Monitor className="mr-2 h-4 w-4" />
                          System
                      </TabsTrigger>
                  </TabsList>
               </Tabs>
             )}
        </div>

        {/* Regional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={(v) => handleUpdate('language', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ms">Bahasa Melayu</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => handleUpdate('currency', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MYR">MYR (RM)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="SGD">SGD ($)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
             <Label className="text-base">Notifications</Label>
             <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                    <Label className="font-normal" htmlFor="email-notif">Email Notifications</Label>
                    <span className="text-xs text-muted-foreground">Receive updates via email.</span>
                </div>
                <Switch
                    id="email-notif"
                    checked={notifications.email}
                    onCheckedChange={(c) => handleNotificationChange('email', c)}
                />
             </div>
             <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                    <Label className="font-normal" htmlFor="whatsapp-notif">WhatsApp Notifications</Label>
                    <span className="text-xs text-muted-foreground">Receive updates via WhatsApp.</span>
                </div>
                <Switch
                    id="whatsapp-notif"
                    checked={notifications.whatsapp}
                    onCheckedChange={(c) => handleNotificationChange('whatsapp', c)}
                />
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
