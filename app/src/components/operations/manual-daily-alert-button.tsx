"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runDailyAlertJobAction } from "@/app/actions/admin-ops-actions";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export function ManualDailyAlertButton() {
    const router = useRouter();
    const [running, setRunning] = useState(false);

    const handleClick = async () => {
        setRunning(true);
        const result = await runDailyAlertJobAction();
        setRunning(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(
            result.emailSent
                ? `日次通知を実行しました。対象 ${result.emailTargetCount}件`
                : `日次通知を実行しました。対象 ${result.emailTargetCount}件、メール送信は未実施です`
        );
        router.refresh();
    };

    return (
        <Button onClick={handleClick} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            日次通知を手動実行
        </Button>
    );
}
