// src\components\custom\referral\ReferralDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { ReferralStats } from './ReferralStats';
import { ReferralLink } from './ReferralLink';
import { ReferralHistory } from './ReferralHistory';
import { getReferralStats, getReferralHistory } from '@/app/actions/referral-actions';
import { Loader2 } from 'lucide-react';

export default function ReferralDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ referralCode: string; referralsCount: number; rewardsCount: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
           getReferralStats(),
           getReferralHistory()
        ]);

        if (statsRes.success && statsRes.data) {
           setStats(statsRes.data as any); // Cast to handle strict null checks if needed
        }

        if (historyRes.success && historyRes.data) {
           setHistory(historyRes.data);
        }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
      return (
          <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
          </div>
      );
  }

  if (!stats) {
      return <div>Failed to load referral data.</div>;
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-6 md:grid-cols-2">
           <div className="space-y-6">
                <ReferralLink referralCode={stats.referralCode} />
                <ReferralStats referralsCount={stats.referralsCount} rewardsCount={stats.rewardsCount} />
           </div>

           <div className="h-full">
                {/* Could be a banner or more info here, for now keeping it clean */}
                <ReferralHistory history={history} />
           </div>
       </div>
    </div>
  );
}
