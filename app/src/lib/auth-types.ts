export type UserRole = "admin" | "hr" | "technician" | null;

export type AuthUser = {
    id: string;
    email: string | null;
} | null;
