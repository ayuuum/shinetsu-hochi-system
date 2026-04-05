"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDiscard: () => void;
}

export function UnsavedChangesDialog({
    open,
    onOpenChange,
    onDiscard,
}: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>入力内容を破棄しますか</DialogTitle>
                    <DialogDescription>
                        保存していない入力内容があります。このまま閉じると変更は失われます。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        編集を続ける
                    </Button>
                    <Button variant="destructive" onClick={onDiscard}>
                        破棄して閉じる
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
