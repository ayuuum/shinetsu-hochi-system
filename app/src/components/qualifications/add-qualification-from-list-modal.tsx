"use client";

// Wrapper modal that adds an employee selector on top of AddQualificationModal.
// Used from the qualifications list page where employeeId is not pre-determined.

import { useState } from "react";
import {
    Dialog,
    DialogContent,
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
import { Button } from "@/components/ui/button";
import { Plus, Award } from "lucide-react";
import { AddQualificationModal } from "@/components/employees/add-qualification-modal";

type Employee = { id: string; name: string; branch: string | null };

interface AddQualificationFromListModalProps {
    employees: Employee[];
    onSuccess?: () => void;
}

export function AddQualificationFromListModal({
    employees,
    onSuccess,
}: AddQualificationFromListModalProps) {
    const [open, setOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setSelectedEmployeeId("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button size="sm">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        資格を追加
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        資格を追加 — 社員を選択
                    </DialogTitle>
                </DialogHeader>

                {/* Employee selector */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">対象社員</p>
                    <Select
                        value={selectedEmployeeId || undefined}
                        onValueChange={(val: string | null) =>
                            setSelectedEmployeeId(val ?? "")
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="社員を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                    {emp.name}
                                    {emp.branch ? ` (${emp.branch})` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Show the standard AddQualificationModal inline once employee is selected */}
                {selectedEmployeeId ? (
                    <div className="mt-2">
                        <p className="mb-3 text-sm text-muted-foreground">
                            社員を選択しました。下のボタンから資格追加モーダルを開いてください。
                        </p>
                        <AddQualificationModal
                            employeeId={selectedEmployeeId}
                            onSuccess={() => {
                                setOpen(false);
                                setSelectedEmployeeId("");
                                onSuccess?.();
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        社員を選択すると資格追加ボタンが表示されます。
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
