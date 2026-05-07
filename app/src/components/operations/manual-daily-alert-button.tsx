import { Button } from "@/components/ui/button";
import { BellOff } from "lucide-react";

export function ManualDailyAlertButton() {
    return (
        <Button disabled variant="outline" title="メール通知は運用対象外です">
            <BellOff className="mr-2 h-4 w-4" />
            メール通知は無効
        </Button>
    );
}
