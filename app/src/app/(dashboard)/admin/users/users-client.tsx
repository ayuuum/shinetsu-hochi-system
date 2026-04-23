"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { InviteUserModal } from "./invite-user-modal";
import { updateUserRoleAction, deleteUserAction } from "@/app/actions/admin-user-actions";
import { formatDisplayDate } from "@/lib/date";
import { getUserRoleLabel } from "@/lib/display-labels";

type UserRoleValue = "admin" | "hr" | "technician" | null;

export type UserRow = {
    id: string;
    email: string | null;
    role: UserRoleValue;
    lastSignInAt: string | null;
};

interface UsersClientProps {
    users: UserRow[];
    currentUserId: string;
}

function RoleBadge({ role }: { role: UserRoleValue }) {
    if (role === "admin") return <Badge variant="default">{getUserRoleLabel(role)}</Badge>;
    if (role === "hr") return <Badge variant="secondary">{getUserRoleLabel(role)}</Badge>;
    if (role === "technician") return <Badge variant="outline">{getUserRoleLabel(role)}</Badge>;
    return <Badge variant="destructive">未設定</Badge>;
}

function RoleSelect({
    userId,
    currentRole,
    disabled,
    onChanged,
}: {
    userId: string;
    currentRole: UserRoleValue;
    disabled: boolean;
    onChanged: () => void;
}) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (val: string | null) => {
        if (!val) return;
        startTransition(async () => {
            const result = await updateUserRoleAction(userId, val as "admin" | "hr" | "technician");
            if (result.success) {
                toast.success("ロールを更新しました");
                onChanged();
            } else {
                toast.error(result.error);
            }
        });
    };

    const roleOptions = [
        { value: "admin", label: getUserRoleLabel("admin") },
        { value: "hr", label: getUserRoleLabel("hr") },
        { value: "technician", label: getUserRoleLabel("technician") },
    ];

    return (
        <Select
            items={roleOptions}
            value={currentRole ?? undefined}
            onValueChange={(val: string | null) => handleChange(val)}
            disabled={disabled || isPending}
        >
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="未設定">
                    {getUserRoleLabel(currentRole)}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="hr">人事</SelectItem>
                <SelectItem value="technician">技術者</SelectItem>
            </SelectContent>
        </Select>
    );
}

export function UsersClient({ users: initialUsers, currentUserId }: UsersClientProps) {
    const [users, setUsers] = useState<UserRow[]>(initialUsers);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

    // Refresh local state from server is handled by revalidatePath, but we optimistically
    // update role display via key trick — simpler approach: just reload from parent.
    // Since revalidatePath triggers SC re-render, we keep local state in sync after delete.
    const handleDeleted = (userId: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ユーザー管理</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        システムアカウントの招待・ロール設定・削除を行います。
                    </p>
                </div>
                <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    招待する
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>メールアドレス</TableHead>
                                <TableHead>ロール</TableHead>
                                <TableHead>最終ログイン</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                        ユーザーが見つかりません。
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.map((user) => {
                                const isSelf = user.id === currentUserId;
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <span className="font-medium">{user.email ?? "-"}</span>
                                            {isSelf && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    自分
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isSelf ? (
                                                <RoleBadge role={user.role} />
                                            ) : (
                                                <RoleSelect
                                                    userId={user.id}
                                                    currentRole={user.role}
                                                    disabled={isSelf}
                                                    onChanged={() => {
                                                        // revalidatePath will refresh SC; local badge stays
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDisplayDate(user.lastSignInAt)}
                                        </TableCell>
                                        <TableCell>
                                            {!isSelf && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />

            {deleteTarget && (
                <DeleteConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => {
                        if (!open) setDeleteTarget(null);
                    }}
                    title="ユーザーを削除"
                    description={`${deleteTarget.email ?? deleteTarget.id} のアカウントを削除します。`}
                    onConfirm={async () => {
                        const result = await deleteUserAction(deleteTarget.id);
                        if (result.success) {
                            toast.success("ユーザーを削除しました");
                            handleDeleted(deleteTarget.id);
                        } else {
                            toast.error(result.error);
                        }
                    }}
                />
            )}
        </div>
    );
}
