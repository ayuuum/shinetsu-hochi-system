"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { resetUserPasswordAction } from "@/app/actions/admin-user-actions";
import { generatePassword } from "@/lib/password";

interface ResetPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userEmail: string | null;
}

export function ResetPasswordModal({ open, onOpenChange, userId, userEmail }: ResetPasswordModalProps) {
    const [password, setPassword] = useState(() => generatePassword());
    const [done, setDone] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

    const resetState = () => {
        setPassword(generatePassword());
        setDone(null);
        setCopied(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetState();
        }
        onOpenChange(next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("パスワードは8文字以上にしてください。");
            return;
        }
        startTransition(async () => {
            const result = await resetUserPasswordAction(userId, password);
            if (result.success) {
                toast.success("パスワードを再設定しました");
                setDone(password);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleCopy = async () => {
        if (!done) return;
        try {
            await navigator.clipboard.writeText(
                `メールアドレス: ${userEmail ?? ""}\nパスワード: ${done}`,
            );
            setCopied(true);
            toast.success("ログイン情報をコピーしました");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("コピーに失敗しました。手動で控えてください。");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {done ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>パスワードを再設定しました</DialogTitle>
                            <DialogDescription>
                                新しいパスワードを本人に直接お伝えください。この画面を閉じると再表示できません。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">メールアドレス</p>
                                <p className="font-mono text-sm break-all">{userEmail ?? "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">新しいパスワード</p>
                                <p className="font-mono text-base font-semibold tracking-wide">{done}</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCopy}>
                                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                ログイン情報をコピー
                            </Button>
                            <Button type="button" onClick={() => handleOpenChange(false)}>
                                閉じる
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>パスワードを再設定</DialogTitle>
                            <DialogDescription>
                                {userEmail ?? "このユーザー"} の新しいパスワードを設定します。設定後に表示されるパスワードを本人にお伝えください。
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="reset-password">新しいパスワード</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="reset-password"
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isPending}
                                        required
                                        minLength={8}
                                        className="font-mono"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPassword(generatePassword())}
                                        disabled={isPending}
                                        title="パスワードを再生成"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">8文字以上。自動生成されたものをそのまま使えます。</p>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isPending}
                                >
                                    キャンセル
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    再設定する
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
