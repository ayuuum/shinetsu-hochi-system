export const HEALTH_CHECK_RESULT_OPTIONS = [
    { value: "true", label: "異常なし" },
    { value: "false", label: "要再検査" },
] as const;

const HEALTH_CHECK_LIST_RESULT_LABELS = {
    normal: "異常なし",
    abnormal: "要再検査",
} as const;

const QUALIFICATION_LEVEL_LABELS = {
    danger: "期限切れ",
    urgent: "14日以内",
    warning: "30日以内",
    info: "60日以内",
    ok: "正常",
} as const;

const USER_ROLE_LABELS = {
    admin: "管理者",
    hr: "人事",
    technician: "技術者",
} as const;

export const VEHICLE_SORT_LABELS = {
    plate: "ナンバー順",
    inspection: "車検満了日順",
    liability: "自賠責満期順",
    voluntary: "任意保険満期順",
} as const;

export const VEHICLE_EXPIRY_FILTER_LABELS = {
    all: "すべて",
    expired: "期限切れ",
    soon: "30日以内",
} as const;

export function getHealthCheckResultLabel(value: boolean | null | undefined) {
    if (value === true) return "異常なし";
    if (value === false) return "要再検査";
    return "-";
}

export function getHealthCheckResultValueLabel(value: string | null | undefined) {
    return HEALTH_CHECK_RESULT_OPTIONS.find((option) => option.value === value)?.label ?? "結果を選択";
}

export function normalizeHealthCheckListResultValue(value: string | null | undefined) {
    if (!value) return "";
    if (value === "normal" || value === "true") return "normal";
    if (value === "abnormal" || value === "false") return "abnormal";
    return "";
}

export function getHealthCheckListResultLabel(value: string | null | undefined) {
    const normalized = normalizeHealthCheckListResultValue(value);
    if (!normalized) return "すべての結果";
    return HEALTH_CHECK_LIST_RESULT_LABELS[normalized];
}

export function getQualificationLevelLabel(value: string | null | undefined) {
    if (!value) return "すべて";
    return QUALIFICATION_LEVEL_LABELS[value as keyof typeof QUALIFICATION_LEVEL_LABELS] ?? "-";
}

export function getUserRoleLabel(value: string | null | undefined) {
    if (!value) return "未設定";
    return USER_ROLE_LABELS[value as keyof typeof USER_ROLE_LABELS] ?? "未設定";
}

export function getVehicleSortLabel(value: string | null | undefined) {
    if (!value) return VEHICLE_SORT_LABELS.plate;
    return VEHICLE_SORT_LABELS[value as keyof typeof VEHICLE_SORT_LABELS] ?? VEHICLE_SORT_LABELS.plate;
}

export function getVehicleExpiryFilterLabel(value: string | null | undefined) {
    const normalized = value || "all";
    return VEHICLE_EXPIRY_FILTER_LABELS[normalized as keyof typeof VEHICLE_EXPIRY_FILTER_LABELS] ?? VEHICLE_EXPIRY_FILTER_LABELS.all;
}
