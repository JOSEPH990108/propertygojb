// src\components\custom\referral\ReferralHistory.tsx
'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReferralReward {
    id: string;
    status: string;
    triggerEvent: string;
    createdAt: string; // Serialized date
    referee: {
        name: string | null;
        image: string | null;
        email: string | null;
    } | null;
}

interface ReferralHistoryProps {
  history: ReferralReward[];
}

export function ReferralHistory({ history }: ReferralHistoryProps) {
  if (history.length === 0) {
      return (
          <div className="text-center py-10 text-muted-foreground">
              <p>No referrals yet. Start inviting friends!</p>
          </div>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
        <CardDescription>Track the status of your invites.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((item, index) => (
           <motion.div
             key={item.id}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.3, delay: index * 0.1 }}
             className="flex items-center justify-between p-4 border rounded-lg bg-card"
           >
              <div className="flex items-center space-x-4">
                 <Avatar>
                    <AvatarImage src={item.referee?.image || undefined} />
                    <AvatarFallback>{item.referee?.name?.charAt(0) || '?'}</AvatarFallback>
                 </Avatar>
                 <div>
                     <p className="font-medium">{item.referee?.name || 'Unknown User'}</p>
                     <p className="text-sm text-muted-foreground">
                         {new Date(item.createdAt).toLocaleDateString()}
                     </p>
                 </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                 <Badge
                    variant={
                        item.status === 'ELIGIBLE' ? 'default' :
                        item.status === 'REDEEMED' ? 'secondary' : 'outline'
                    }
                    className="capitalize"
                 >
                    {item.status.toLowerCase()}
                 </Badge>
                 <span className="text-xs text-muted-foreground">
                     {item.triggerEvent === 'ON_REGISTRATION' ? 'Registered' : 'Booked'}
                 </span>
              </div>
           </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
