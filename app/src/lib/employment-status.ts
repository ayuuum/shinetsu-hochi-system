import { getTodayInTokyo } from "@/lib/date";

export type EmploymentStatus = "active" | "retired" | "all";

export const EMPLOYMENT_STATUS_OPTIONS = [
    { value: "active", label: "在職" },
    { value: "retired", label: "退職" },
    { value: "all", label: "すべて" },
] as const;

export function parseEmploymentStatus(value?: string | null): EmploymentStatus {
    if (value === "retired" || value === "all") {
        return value;
    }
    return "active";
}

export function getEmploymentStatusLabel(value: EmploymentStatus): string {
    if (value === "retired") return "退職";
    if (value === "all") return "すべて";
    return "在職";
}

/** PostgREST filter helpers for employees.termination_date */
export function employmentStatusOrFilter(
    status: EmploymentStatus,
    columnPrefix = "",
    today = getTodayInTokyo(),
): string | null {
    const column = `${columnPrefix}termination_date`;
    if (status === "active") {
        return `${column}.is.null,${column}.gte.${today}`;
    }
    return null;
}

export function isRetiredEmploymentStatus(status: EmploymentStatus): boolean {
    return status === "retired";
}
