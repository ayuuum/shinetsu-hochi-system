import {
    Activity,
    BriefcaseBusiness,
    ClipboardCheck,
    HeartPulse,
    LayoutDashboard,
    ScrollText,
    Tags,
    Truck,
    Upload,
    UserCog,
    UserCircle,
    Users,
    type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/auth-types";

export type AppNavSectionId = "overview" | "people" | "operations" | "safety" | "admin";

export type AppNavItem = {
    title: string;
    description: string;
    url: string;
    icon: LucideIcon;
    section: AppNavSectionId;
    keywords: string[];
    managerOnly?: boolean;
    /** admin ロールのみ表示 */
    adminOnly?: boolean;
    /** 技術者ロールではサイドバー・検索から除外 */
    hideForTechnician?: boolean;
    /** 技術者ロールのみ表示（例: マイプロフィール） */
    technicianOnly?: boolean;
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
        title: "マイプロフィール",
        description: "自分の社員情報・資格を確認",
        url: "/me",
        icon: UserCircle,
        section: "people",
        keywords: ["profile", "me", "自分", "マイページ"],
        technicianOnly: true,
    },
    {
        title: "社員一覧",
        description: "社員台帳と基本情報を確認",
        url: "/employees",
        icon: Users,
        section: "people",
        keywords: ["employee", "member", "staff", "person"],
        hideForTechnician: true,
    },
    {
        title: "資格・講習管理",
        description: "資格期限と講習履歴を確認",
        url: "/qualifications",
        icon: ScrollText,
        section: "people",
        keywords: ["license", "training", "certificate", "expiry"],
        hideForTechnician: true,
    },
    {
        title: "資格マスタ",
        description: "資格の種類（マスタ）を追加・編集",
        url: "/qualifications/masters",
        icon: Tags,
        section: "people",
        keywords: ["master", "qualification", "category", "license"],
        managerOnly: true,
    },
    {
        title: "工事経歴",
        description: "施工実績と担当履歴を確認",
        url: "/projects",
        icon: BriefcaseBusiness,
        section: "operations",
        keywords: ["project", "construction", "history", "career"],
        hideForTechnician: true,
    },
    {
        title: "車両・備品",
        description: "車検・保険と備品台帳（管理番号・購入情報）",
        url: "/vehicles",
        icon: Truck,
        section: "operations",
        keywords: ["vehicle", "car", "equipment", "insurance"],
        hideForTechnician: true,
    },
    {
        title: "健康診断",
        description: "受診履歴と結果を確認",
        url: "/health-checks",
        icon: HeartPulse,
        section: "safety",
        keywords: ["health", "checkup", "medical"],
        hideForTechnician: true,
    },
    {
        title: "アルコールチェック",
        description: "当日の検査記録を確認",
        url: "/alcohol-checks",
        icon: ClipboardCheck,
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
    {
        title: "ユーザー管理",
        description: "システムアカウントの招待・権限設定",
        url: "/admin/users",
        icon: UserCog,
        section: "admin",
        keywords: ["user", "account", "invite", "permission"],
        adminOnly: true,
    },
];

function navItemMatches(pathname: string, url: string) {
    if (url === "/") {
        return pathname === "/";
    }
    return pathname === url || pathname.startsWith(`${url}/`);
}

export function getBestMatchingNavUrl(pathname: string, candidateUrls: string[]) {
    const candidates = candidateUrls.filter((url) => navItemMatches(pathname, url));
    if (candidates.length === 0) {
        return null;
    }
    return candidates.reduce((a, b) => (a.length >= b.length ? a : b));
}

/** サイドバーでは `isAdminOrHr` を渡し、表示中メニューだけで最長一致させる */
export function isAppNavActive(
    pathname: string,
    url: string,
    isAdminOrHr?: boolean,
    role: UserRole | null = null,
    linkedEmployeeId: string | null = null
) {
    if (url === "/me" && role === "technician" && linkedEmployeeId) {
        if (pathname === "/me") return true;
        if (pathname === `/employees/${linkedEmployeeId}`) return true;
        if (pathname.startsWith(`/employees/${linkedEmployeeId}/`)) return true;
        return false;
    }

    const urls = (isAdminOrHr === undefined
        ? appNavItems
        : getVisibleAppNavItems(isAdminOrHr, role, linkedEmployeeId)
    ).map((item) => item.url);
    const best = getBestMatchingNavUrl(pathname, urls);
    return best === url;
}

export function getVisibleAppNavItems(
    isAdminOrHr: boolean,
    role: UserRole | null = null,
    linkedEmployeeId: string | null = null
) {
    return appNavItems.filter((item) => {
        if (item.adminOnly && role !== "admin") return false;
        if (item.managerOnly && !isAdminOrHr) return false;
        if (item.technicianOnly) {
            return role === "technician" && !!linkedEmployeeId;
        }
        if (role === "technician" && item.hideForTechnician) return false;
        return true;
    });
}

export function getGroupedAppNavigation(
    isAdminOrHr: boolean,
    role: UserRole | null = null,
    linkedEmployeeId: string | null = null
) {
    const visibleItems = getVisibleAppNavItems(isAdminOrHr, role, linkedEmployeeId);
    const order: AppNavSectionId[] = isAdminOrHr
        ? ["overview", "people", "operations", "safety", "admin"]
        : role === "technician"
            ? ["overview", "people", "safety"]
            : ["overview", "operations", "people", "safety"];

    return order
        .map((sectionId) => ({
            ...sectionMeta[sectionId],
            items: visibleItems.filter((item) => item.section === sectionId),
        }))
        .filter((section) => section.items.length > 0);
}

export function findAppNavItem(
    pathname: string,
    opts?: { role: UserRole; linkedEmployeeId: string | null }
) {
    if (opts?.role === "technician" && opts.linkedEmployeeId) {
        if (
            pathname === "/me"
            || pathname === `/employees/${opts.linkedEmployeeId}`
            || pathname.startsWith(`/employees/${opts.linkedEmployeeId}/`)
        ) {
            return appNavItems.find((item) => item.url === "/me") || appNavItems[0];
        }
    }

    const best = getBestMatchingNavUrl(pathname, appNavItems.map((item) => item.url));
    if (!best) {
        return appNavItems[0];
    }
    return appNavItems.find((item) => item.url === best) || appNavItems[0];
}

export function findAppNavItemByUrl(url: string) {
    return appNavItems.find((item) => item.url === url);
}

export function getAppNavSectionMeta(sectionId: AppNavSectionId) {
    return sectionMeta[sectionId];
}
