"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { scanAppointment } from "@/app/actions/appointment-actions";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AgentScanner() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; rewardStatus?: string } | null>(null);

  const handleScan = async () => {
    if (!token) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await scanAppointment(token);
      if (res.success) {
        setResult({
            success: true,
            message: res.message,
            rewardStatus: res.rewardStatus
        });
        toast.success("Check-in Verified");
      } else {
        setResult({ success: false, message: res.error });
        toast.error("Scan Failed", { description: res.error });
      }
    } catch (error) {
      setResult({ success: false, message: "System error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Visitor Check-in</CardTitle>
        <CardDescription>Scan QR code or enter token manually.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="QR Token (UUID)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button onClick={handleScan} disabled={isLoading || !token}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </div>

        {result && (
            <div className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {result.success ? (
                    <>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <span className="font-semibold text-lg">VERIFIED</span>
                        <span className="text-sm">{result.message}</span>
                        {result.rewardStatus && (
                            <div className="mt-2 text-xs bg-white px-2 py-1 rounded border border-green-200">
                                Reward Status: <strong>{result.rewardStatus}</strong>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <XCircle className="h-8 w-8 text-red-600" />
                        <span className="font-semibold text-lg">INVALID</span>
                        <span className="text-sm">{result.message}</span>
                    </>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
