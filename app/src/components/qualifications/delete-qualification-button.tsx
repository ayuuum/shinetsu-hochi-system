"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { deleteQualificationAction } from "@/app/actions/admin-record-actions";

interface DeleteQualificationButtonProps {
    qualificationId: string;
    qualificationName: string;
}

export function DeleteQualificationButton({ qualificationId, qualificationName }: DeleteQualificationButtonProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="mr-1.5 h-4 w-4" />
                削除
            </Button>

            <DeleteConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="資格情報を削除"
                description={`「${qualificationName}」を削除します。`}
                onConfirm={async () => {
                    const result = await deleteQualificationAction(qualificationId);
                    if (result.success) {
                        toast.success("資格情報を削除しました");
                        router.push("/qualifications");
                        router.refresh();
                    } else {
                        toast.error(result.error);
                    }
                }}
            />
        </>
    );
}
