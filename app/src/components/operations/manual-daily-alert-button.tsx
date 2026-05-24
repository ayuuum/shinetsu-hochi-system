"use client";

import { Button } from "@/components/ui/button";
import { runDailyAlertJobAction } from "@/app/actions/admin-ops-actions";
import { Bell, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ManualDailyAlertButton() {
    const [isPending, setIsPending] = useState(false);

    const handleRun = async () => {
        setIsPending(true);
        const result = await runDailyAlertJobAction();
        setIsPending(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(result.emailSent ? "資格期限通知を送信しました" : "通知ジョブを実行しました");
    };

    return (
        <Button variant="outline" onClick={handleRun} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            資格期限通知を実行
        </Button>
    );
}
