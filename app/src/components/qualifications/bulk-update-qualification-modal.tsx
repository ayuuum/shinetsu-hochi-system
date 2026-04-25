"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateQualificationsAction } from "@/app/actions/admin-record-actions";

type QualificationMaster = { id: string; name: string; category: string | null };
type Employee = { id: string; name: string; branch: string | null };

interface BulkUpdateQualificationModalProps {
    qualificationMasters: QualificationMaster[];
    employees: Employee[];
}

export function BulkUpdateQualificationModal({
    qualificationMasters,
    employees,
}: BulkUpdateQualificationModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [qualificationId, setQualificationId] = useState("");
    const [acquiredDate, setAcquiredDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const selectedQual = qualificationMasters.find((q) => q.id === qualificationId);

    const toggleEmployee = (id: string) => {
        setSelectedEmployeeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedEmployeeIds.size === employees.length) {
            setSelectedEmployeeIds(new Set());
        } else {
            setSelectedEmployeeIds(new Set(employees.map((e) => e.id)));
        }
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setQualificationId("");
            setAcquiredDate("");
            setExpiryDate("");
            setSelectedEmployeeIds(new Set());
        }
        setOpen(next);
    };

    const handleSubmit = async () => {
        setConfirmOpen(false);
        setIsSubmitting(true);
        try {
            const result = await bulkUpdateQualificationsAction({
                qualificationId,
                employeeIds: Array.from(selectedEmployeeIds),
                acquiredDate: acquiredDate || null,
                expiryDate: expiryDate || null,
            });

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            toast.success(`${result.updatedCount}名の資格情報を更新しました`);
            setOpen(false);
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = qualificationId && selectedEmployeeIds.size > 0;

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger
                    render={
                        <Button variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            一括更新
                        </Button>
                    }
                />
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-primary" />
                            資格の一括更新
                        </DialogTitle>
                        <DialogDescription>
                            複数社員の同一資格を一括で取得日・有効期限を更新します。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Qualification selector */}
                        <div className="space-y-2">
                            <Label>資格を選択</Label>
                            <Select
                                value={qualificationId || undefined}
                                onValueChange={(val: string | null) => setQualificationId(val ?? "")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="資格名を選択してください" />
                                </SelectTrigger>
                                <SelectContent>
                                    {qualificationMasters.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>
                                            {q.name}
                                            {q.category ? ` (${q.category})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>取得日</Label>
                                <Input
                                    type="date"
                                    value={acquiredDate}
                                    onChange={(e) => setAcquiredDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>有効期限</Label>
                                <Input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Employee checkboxes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>対象社員を選択</Label>
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {selectedEmployeeIds.size === employees.length ? "全解除" : "全選択"}
                                </button>
                            </div>
                            <div className="rounded-lg border border-border divide-y divide-border/60 max-h-48 overflow-y-auto">
                                {employees.map((emp) => (
                                    <label
                                        key={emp.id}
                                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedEmployeeIds.has(emp.id)}
                                            onCheckedChange={() => toggleEmployee(emp.id)}
                                        />
                                        <span className="text-sm flex-1 select-none">
                                            {emp.name}
                                            {emp.branch && (
                                                <span className="ml-1.5 text-xs text-muted-foreground">{emp.branch}</span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {selectedEmployeeIds.size > 0 && (
                                <p className="text-xs text-muted-foreground">{selectedEmployeeIds.size}名を選択中</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            キャンセル
                        </Button>
                        <Button
                            disabled={!canSubmit || isSubmitting}
                            onClick={() => setConfirmOpen(true)}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {selectedEmployeeIds.size > 0
                                ? `${selectedEmployeeIds.size}名を一括更新`
                                : "一括更新"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm dialog */}
            <Dialog open={confirmOpen} onOpenChange={(o) => !isSubmitting && setConfirmOpen(o)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>一括更新の確認</DialogTitle>
                        <DialogDescription className="pt-2 space-y-1">
                            <span className="block">
                                <strong>{selectedQual?.name}</strong> を{" "}
                                <strong>{selectedEmployeeIds.size}名</strong> に一括更新します。
                            </span>
                            <span className="block text-xs">
                                既存の記録は上書きされます。この操作は取り消せません。
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            更新する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
