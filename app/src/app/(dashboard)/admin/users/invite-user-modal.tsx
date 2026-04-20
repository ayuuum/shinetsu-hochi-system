"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { inviteUserAction } from "@/app/actions/admin-user-actions";

interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type InviteRole = "admin" | "hr" | "technician";

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<InviteRole>("technician");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("メールアドレスを入力してください。");
            return;
        }

        startTransition(async () => {
            const result = await inviteUserAction(email.trim(), role);
            if (result.success) {
                toast.success("招待メールを送信しました");
                setEmail("");
                setRole("technician");
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ユーザーを招待</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-email">メールアドレス</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isPending}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>ロール</Label>
                        <Select
                            value={role}
                            onValueChange={(val: string | null) => {
                                if (val) setRole(val as InviteRole);
                            }}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">管理者</SelectItem>
                                <SelectItem value="hr">人事</SelectItem>
                                <SelectItem value="technician">技術者</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            招待を送信
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
