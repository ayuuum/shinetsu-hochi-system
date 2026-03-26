"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
}: DeleteConfirmDialogProps) {
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        await onConfirm();
        setDeleting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
                        キャンセル
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
                        {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        削除する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
