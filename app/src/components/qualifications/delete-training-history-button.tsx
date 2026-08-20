"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { deleteTrainingHistoryAction } from "@/app/actions/admin-record-actions";

export function DeleteTrainingHistoryButton({
    id,
    employeeQualificationId,
    trainingDate,
}: {
    id: string;
    employeeQualificationId: string;
    trainingDate: string;
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                aria-label="講習履歴を削除"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <DeleteConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="講習履歴の削除"
                description={`受講日 ${trainingDate} の講習履歴を削除します。資格の有効期限は自動では戻りません。`}
                onConfirm={async () => {
                    const result = await deleteTrainingHistoryAction({ id, employeeQualificationId });
                    if (result.success) {
                        toast.success("講習履歴を削除しました");
                        router.refresh();
                    } else {
                        toast.error(result.error);
                    }
                }}
            />
        </>
    );
}
