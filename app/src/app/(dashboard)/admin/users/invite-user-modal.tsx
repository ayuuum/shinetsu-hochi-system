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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { createUserWithPasswordAction } from "@/app/actions/admin-user-actions";
import { generatePassword } from "@/lib/password";
import { getUserRoleLabel } from "@/lib/display-labels";
import type { EmployeeOption } from "./users-client";

interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: EmployeeOption[];
}

type InviteRole = "admin" | "hr" | "technician";

type CreatedCredentials = { email: string; password: string };

export function InviteUserModal({ open, onOpenChange, employees }: InviteUserModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(() => generatePassword());
    const [role, setRole] = useState<InviteRole>("technician");
    const [employeeId, setEmployeeId] = useState<string>("__none__");
    const [isPending, startTransition] = useTransition();
    const [created, setCreated] = useState<CreatedCredentials | null>(null);
    const [copied, setCopied] = useState(false);
    const selectedEmployee = employees.find((employee) => employee.id === employeeId);
    const roleOptions = [
        { value: "admin", label: getUserRoleLabel("admin") },
        { value: "hr", label: getUserRoleLabel("hr") },
        { value: "technician", label: getUserRoleLabel("technician") },
    ];

    const resetForm = () => {
        setEmail("");
        setPassword(generatePassword());
        setRole("technician");
        setEmployeeId("__none__");
        setCreated(null);
        setCopied(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }
        onOpenChange(next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("メールアドレスを入力してください。");
            return;
        }
        if (password.length < 8) {
            toast.error("パスワードは8文字以上にしてください。");
            return;
        }

        startTransition(async () => {
            const result = await createUserWithPasswordAction(
                email.trim(),
                password,
                role,
                role === "technician" && employeeId !== "__none__" ? employeeId : null,
            );
            if (result.success) {
                toast.success("ユーザーを作成しました");
                setCreated({ email: email.trim(), password });
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleCopy = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(
                `メールアドレス: ${created.email}\nパスワード: ${created.password}`,
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
                {created ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>ユーザーを作成しました</DialogTitle>
                            <DialogDescription>
                                以下のログイン情報を本人に直接お伝えください。この画面を閉じるとパスワードは再表示できません。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">メールアドレス</p>
                                <p className="font-mono text-sm break-all">{created.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">初期パスワード</p>
                                <p className="font-mono text-base font-semibold tracking-wide">{created.password}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            本人は初回ログイン後、ログイン画面の「パスワードを忘れた場合」または各自で変更できます。
                        </p>
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
                            <DialogTitle>ユーザーを追加</DialogTitle>
                            <DialogDescription>
                                メールアドレスと初期パスワードを設定してアカウントを作成します。作成後に表示されるログイン情報を本人にお伝えください。
                            </DialogDescription>
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
                                <Label htmlFor="invite-password">初期パスワード</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="invite-password"
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
                            <div className="space-y-1.5">
                                <Label>ロール</Label>
                                <Select
                                    items={roleOptions}
                                    value={role}
                                    onValueChange={(val: string | null) => {
                                        if (val) setRole(val as InviteRole);
                                    }}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue>{getUserRoleLabel(role)}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">管理者</SelectItem>
                                        <SelectItem value="hr">人事</SelectItem>
                                        <SelectItem value="technician">技術者</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {role === "technician" && (
                                <div className="space-y-1.5">
                                    <Label>社員紐づけ</Label>
                                    <Select
                                        items={[
                                            { value: "__none__", label: "あとで設定する" },
                                            ...employees.map((employee) => ({
                                                value: employee.id,
                                                label: `${employee.name}${employee.branch ? `（${employee.branch}）` : ""}`,
                                            })),
                                        ]}
                                        value={employeeId}
                                        onValueChange={(val: string | null) => {
                                            if (val) setEmployeeId(val);
                                        }}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue>
                                                {selectedEmployee
                                                    ? `${selectedEmployee.name}${selectedEmployee.branch ? `（${selectedEmployee.branch}）` : ""}`
                                                    : "あとで設定する"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">あとで設定する</SelectItem>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                    {employee.name}{employee.branch ? `（${employee.branch}）` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        作業者の「自分の情報」ページで表示する社員情報です。未設定の場合はログイン後に案内が表示されます。
                                    </p>
                                </div>
                            )}
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
                                    作成する
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
