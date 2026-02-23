// src\components\custom\referral\ReferralLink.tsx
'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReferralLinkProps {
  referralCode: string;
}

export function ReferralLink({ referralCode }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
    >
        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <CardTitle>Your Invite Code</CardTitle>
            <CardDescription>Share this code with friends to earn rewards.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
                <div className="flex items-center justify-center rounded-md border border-input bg-background px-3 py-3 text-2xl font-mono tracking-widest font-bold shadow-sm">
                    {referralCode}
                </div>
            </div>
            <Button type="button" size="icon" className="h-14 w-14" onClick={handleCopy}>
                {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                <span className="sr-only">Copy</span>
            </Button>
            </div>
        </CardContent>
        </Card>
    </motion.div>
  );
}
