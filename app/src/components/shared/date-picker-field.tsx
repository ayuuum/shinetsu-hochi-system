"use client";

import { useMemo, useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getTodayInTokyo } from "@/lib/date";

type DatePickerFieldProps = {
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
};

function parseYmd(value?: string | null) {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatYmd(date: Date) {
    return format(date, "yyyy-MM-dd");
}

export function DatePickerField({
    value,
    onChange,
    placeholder = "日付を選択",
    disabled = false,
    ariaLabel = "日付を選択",
    className,
}: DatePickerFieldProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = useMemo(() => parseYmd(value), [value]);
    const displayValue = selectedDate ? format(selectedDate, "yyyy年M月d日", { locale: ja }) : "";

    const handleSelect = (date: Date | undefined) => {
        if (!date) return;
        onChange(formatYmd(date));
        setOpen(false);
    };

    const handleToday = () => {
        onChange(getTodayInTokyo());
        setOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setOpen(false);
    };

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
            <PopoverPrimitive.Trigger
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                className={cn(
                    "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                    !displayValue && "text-muted-foreground",
                    className,
                )}
            >
                <span className="truncate">{displayValue || placeholder}</span>
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Positioner
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    className="isolate z-[80]"
                >
                    <PopoverPrimitive.Popup
                        data-slot="popover-content"
                        initialFocus={false}
                        className="w-[min(calc(100vw-2rem),320px)] rounded-2xl bg-popover p-3 text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
                    >
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            locale={ja}
                            captionLayout="dropdown"
                            className="mx-auto [--cell-size:--spacing(9)]"
                        />
                        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                            <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!value}>
                                <X className="mr-1 h-3.5 w-3.5" />
                                クリア
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleToday}>
                                今日
                            </Button>
                        </div>
                    </PopoverPrimitive.Popup>
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
