import {
    Activity,
    BriefcaseBusiness,
    HeartPulse,
    LayoutDashboard,
    ScrollText,
    Truck,
    Upload,
    Users,
    Wine,
    type LucideIcon,
} from "lucide-react";

export type AppNavSectionId = "overview" | "people" | "operations" | "safety" | "admin";

export type AppNavItem = {
    title: string;
    description: string;
    url: string;
    icon: LucideIcon;
    section: AppNavSectionId;
    keywords: string[];
    managerOnly?: boolean;
};

type AppNavSectionMeta = {
    id: AppNavSectionId;
    title: string;
    description: string;
};

const sectionMeta: Record<AppNavSectionId, AppNavSectionMeta> = {
    overview: {
        id: "overview",
        title: "今日の状況",
        description: "今日の対応状況と重要な変化を確認",
    },
    people: {
        id: "people",
        title: "人員・資格",
        description: "社員・資格・案件の台帳を確認",
    },
    operations: {
        id: "operations",
        title: "現場運用",
        description: "現場の予定と実績を管理",
    },
    safety: {
        id: "safety",
        title: "安全・法令",
        description: "法令対応と安全記録を確認",
    },
    admin: {
        id: "admin",
        title: "管理",
        description: "管理者向けの一括処理",
    },
};

export const appNavItems: AppNavItem[] = [
    {
        title: "ダッシュボード",
        description: "今日の優先対応と全体状況を確認",
        url: "/",
        icon: LayoutDashboard,
        section: "overview",
        keywords: ["top", "home", "summary", "alert"],
    },
    {
        title: "社員一覧",
        description: "社員台帳と基本情報を確認",
        url: "/employees",
        icon: Users,
        section: "people",
        keywords: ["employee", "member", "staff", "person"],
    },
    {
        title: "資格・講習管理",
        description: "資格期限と講習履歴を確認",
        url: "/qualifications",
        icon: ScrollText,
        section: "people",
        keywords: ["license", "training", "certificate", "expiry"],
    },
    {
        title: "工事経歴",
        description: "施工実績と担当履歴を確認",
        url: "/projects",
        icon: BriefcaseBusiness,
        section: "operations",
        keywords: ["project", "construction", "history", "career"],
    },
    {
        title: "車両・備品",
        description: "車検・保険・備品情報を確認",
        url: "/vehicles",
        icon: Truck,
        section: "operations",
        keywords: ["vehicle", "car", "equipment", "insurance"],
    },
    {
        title: "健康診断",
        description: "受診履歴と結果を確認",
        url: "/health-checks",
        icon: HeartPulse,
        section: "safety",
        keywords: ["health", "checkup", "medical"],
    },
    {
        title: "アルコールチェック",
        description: "当日の検査記録を確認",
        url: "/alcohol-checks",
        icon: Wine,
        section: "safety",
        keywords: ["alcohol", "daily", "safety"],
    },
    {
        title: "データインポート",
        description: "CSV で社員データを一括登録",
        url: "/import",
        icon: Upload,
        section: "admin",
        keywords: ["csv", "import", "upload", "bulk"],
        managerOnly: true,
    },
    {
        title: "運用履歴",
        description: "インポートと通知ジョブの履歴を確認",
        url: "/operations-log",
        icon: Activity,
        section: "admin",
        keywords: ["history", "ops", "job", "import", "cron"],
        managerOnly: true,
    },
];

export function isAppNavActive(pathname: string, url: string) {
    if (url === "/") {
        return pathname === "/";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
}

export function getVisibleAppNavItems(isAdminOrHr: boolean) {
    return appNavItems.filter((item) => !item.managerOnly || isAdminOrHr);
}

export function getGroupedAppNavigation(isAdminOrHr: boolean) {
    const visibleItems = getVisibleAppNavItems(isAdminOrHr);
    const order: AppNavSectionId[] = isAdminOrHr
        ? ["overview", "people", "operations", "safety", "admin"]
        : ["overview", "operations", "people", "safety"];

    return order
        .map((sectionId) => ({
            ...sectionMeta[sectionId],
            items: visibleItems.filter((item) => item.section === sectionId),
        }))
        .filter((section) => section.items.length > 0);
}

export function findAppNavItem(pathname: string) {
    return appNavItems.find((item) => isAppNavActive(pathname, item.url)) || appNavItems[0];
}

export function findAppNavItemByUrl(url: string) {
    return appNavItems.find((item) => item.url === url);
}

export function getAppNavSectionMeta(sectionId: AppNavSectionId) {
    return sectionMeta[sectionId];
}
