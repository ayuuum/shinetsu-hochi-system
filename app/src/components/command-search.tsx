"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowUpRight, Award, Search, Truck, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
    findAppNavItemByUrl,
    getVisibleAppNavItems,
} from "@/lib/app-navigation";

type SearchResult = {
    id: string;
    type: "employee" | "qualification" | "vehicle" | "action";
    title: string;
    subtitle: string;
    href: string;
};

type EmployeeSearchRow = Pick<
    Tables<"employees">,
    "id" | "name" | "name_kana" | "employee_number" | "branch" | "job_title"
>;

type QualificationSearchRow = Pick<Tables<"employee_qualifications">, "id" | "employee_id"> & {
    employees: Pick<Tables<"employees">, "name"> | null;
    qualification_master: Pick<Tables<"qualification_master">, "name"> | null;
};

type VehicleSearchRow = Pick<Tables<"vehicles">, "id" | "plate_number" | "vehicle_name">;

const RECENT_ITEMS_STORAGE_KEY = "shinetsu-hochi-command-recent";
const MAX_RECENT_ITEMS = 6;

export function CommandSearch({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr, role, linkedEmployeeId } = useAuth();

    const actionItems = useMemo(
        () =>
            getVisibleAppNavItems(isAdminOrHr, role, linkedEmployeeId)
                .filter((item) => item.url !== pathname)
                .map<SearchResult>((item) => ({
                    id: item.url,
                    type: "action",
                    title: item.title,
                    subtitle: item.description,
                    href: item.url,
                })),
        [isAdminOrHr, linkedEmployeeId, pathname, role]
    );

    const visibleRecentItems = recentItems.filter((item) => {
        if (item.type !== "action") return true;
        const navItem = findAppNavItemByUrl(item.href);
        if (!navItem) return false;
        if (navItem.managerOnly && !isAdminOrHr) return false;
        if (navItem.hideForTechnician && role === "technician") return false;
        if (navItem.technicianOnly && role !== "technician") return false;
        return true;
    });

    const filteredActionItems = query.trim().length === 0
        ? actionItems.slice(0, 6)
        : actionItems.filter((item) => {
            const navItem = findAppNavItemByUrl(item.href);
            if (!navItem) return false;
            if (navItem.managerOnly && !isAdminOrHr) return false;
            if (navItem.hideForTechnician && role === "technician") return false;
            if (navItem.technicianOnly && role !== "technician") return false;
            const haystack = [item.title, item.subtitle, ...(navItem.keywords || [])]
                .join(" ")
                .toLowerCase();
            return haystack.includes(query.trim().toLowerCase());
        });

    const persistRecentItems = useCallback((items: SearchResult[]) => {
        setRecentItems(items);
        window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify(items));
    }, []);

    const rememberSelection = useCallback((item: SearchResult) => {
        const nextItems = [
            item,
            ...visibleRecentItems.filter((existing) => !(existing.type === item.type && existing.href === item.href)),
        ].slice(0, MAX_RECENT_ITEMS);
        persistRecentItems(nextItems);
    }, [persistRecentItems, visibleRecentItems]);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as SearchResult[];
                if (Array.isArray(parsed)) {
                    setRecentItems(parsed);
                }
            }
        } catch (error) {
            console.error("Failed to restore command search history:", error);
        }
    }, []);

    useEffect(() => {
        if (open) return;

        setQuery("");
        setResults([]);
        setErrorMessage(null);
    }, [open]);

    const search = useCallback(async (value: string) => {
        const trimmed = value.trim();
        if (trimmed.length < 1) {
            setResults([]);
            setErrorMessage(null);
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        const pattern = `%${trimmed}%`;

        try {
            const [employeeResult, qualificationMasterResult, vehicleResult] = await Promise.all([
                supabase
                    .from("employees")
                    .select("id, name, name_kana, employee_number, branch, job_title")
                    .is("deleted_at", null)
                    .or(`name.ilike.${pattern},name_kana.ilike.${pattern},employee_number.ilike.${pattern}`)
                    .limit(5),
                supabase
                    .from("qualification_master")
                    .select("id, name")
                    .ilike("name", pattern)
                    .limit(5),
                supabase
                    .from("vehicles")
                    .select("id, plate_number, vehicle_name")
                    .is("deleted_at", null)
                    .or(`plate_number.ilike.${pattern},vehicle_name.ilike.${pattern}`)
                    .limit(5),
            ]);

            if (employeeResult.error) throw employeeResult.error;
            if (qualificationMasterResult.error) throw qualificationMasterResult.error;
            if (vehicleResult.error) throw vehicleResult.error;

            let qualificationRows: QualificationSearchRow[] = [];
            const qualificationIds = qualificationMasterResult.data?.map((item) => item.id) || [];

            if (qualificationIds.length > 0) {
                const { data, error } = await supabase
                    .from("employee_qualifications")
                    .select("id, employee_id, employees!inner(name), qualification_master(name)")
                    .is("employees.deleted_at", null)
                    .in("qualification_id", qualificationIds)
                    .limit(5);

                if (error) throw error;
                qualificationRows = (data || []) as QualificationSearchRow[];
            }

            const items: SearchResult[] = [];

            (employeeResult.data as EmployeeSearchRow[] | null)?.forEach((employee) => {
                items.push({
                    id: employee.id,
                    type: "employee",
                    title: employee.name,
                    subtitle: [employee.branch, employee.job_title].filter(Boolean).join(" / ") || employee.employee_number,
                    href: `/employees/${employee.id}`,
                });
            });

            qualificationRows.forEach((qualification) => {
                if (!qualification.employee_id) return;

                items.push({
                    id: qualification.id,
                    type: "qualification",
                    title: qualification.qualification_master?.name || "資格",
                    subtitle: qualification.employees?.name || "",
                    href: `/qualifications/${qualification.id}`,
                });
            });

            (vehicleResult.data as VehicleSearchRow[] | null)?.forEach((vehicle) => {
                items.push({
                    id: vehicle.id,
                    type: "vehicle",
                    title: vehicle.plate_number,
                    subtitle: vehicle.vehicle_name || "車両・備品",
                    href: `/vehicles?q=${encodeURIComponent(vehicle.plate_number)}`,
                });
            });

            setResults(
                items.filter(
                    (item, index, list) =>
                        list.findIndex((candidate) => candidate.type === item.type && candidate.id === item.id) === index
                )
            );
        } catch (error) {
            console.error("Command search failed:", error);
            setResults([]);
            setErrorMessage("検索に失敗しました。少し時間をおいて再試行してください。");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => void search(query), 200);
        return () => clearTimeout(timer);
    }, [query, search]);

    const select = (item: SearchResult) => {
        rememberSelection(item);
        onOpenChange(false);
        setQuery("");
        router.push(item.href);
    };

    const renderIcon = (item: SearchResult) => {
        if (item.type === "employee") {
            return <User className="h-4 w-4 text-muted-foreground shrink-0" />;
        }
        if (item.type === "qualification") {
            return <Award className="h-4 w-4 text-muted-foreground shrink-0" />;
        }
        if (item.type === "vehicle") {
            return <Truck className="h-4 w-4 text-muted-foreground shrink-0" />;
        }

        const navItem = findAppNavItemByUrl(item.href);
        const ActionIcon = navItem?.icon || ArrowUpRight;
        return <ActionIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
    };

    const renderItem = (item: SearchResult) => (
        <Command.Item
            key={`${item.type}-${item.id}`}
            value={`${item.type}-${item.id}-${item.title}`}
            onSelect={() => select(item)}
            className="flex items-center gap-3 rounded-[20px] border border-transparent px-3 py-3 text-sm transition-[background-color,border-color,color,transform] duration-150 hover:-translate-y-px hover:border-border/70 hover:bg-accent/80 data-[selected=true]:border-border/70 data-[selected=true]:bg-accent/80"
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[16px] border border-border/50 bg-background/75">
                {renderIcon(item)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        </Command.Item>
    );

    const showDefaultState = query.trim().length === 0;
    const showEmptyState = !loading && !showDefaultState && results.length === 0 && filteredActionItems.length === 0;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="検索を閉じる"
                className="fixed inset-0 bg-slate-950/38 backdrop-blur-[4px]"
                onClick={() => onOpenChange(false)}
            />
            <div className="fixed left-1/2 top-[8%] w-[min(42rem,calc(100vw-1rem))] -translate-x-1/2">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="検索"
                    className="overflow-hidden rounded-[24px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,252,0.95))] shadow-[0_1px_2px_rgba(38,42,46,0.04),0_24px_72px_rgba(15,23,42,0.18)] supports-[backdrop-filter]:backdrop-blur"
                >
                    <Command
                        className="bg-transparent"
                        shouldFilter={false}
                    >
                        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring/40">
                            <div className="flex size-10 items-center justify-center rounded-[18px] border border-primary/10 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                <Search className="h-4 w-4 shrink-0" />
                            </div>
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                aria-label="社員・資格・車両を検索"
                                placeholder="社員名・資格名・車両番号で検索…"
                                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                                autoFocus
                            />
                            <kbd className="rounded-full border border-border/70 bg-background/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                ESC
                            </kbd>
                        </div>
                        <Command.List className="max-h-[min(65vh,34rem)] overflow-y-auto p-2 [overscroll-behavior:contain]">
                            {loading && (
                                <Command.Loading>
                                    <p className="py-8 text-center text-sm text-muted-foreground">検索中…</p>
                                </Command.Loading>
                            )}

                            {showDefaultState && visibleRecentItems.length > 0 && (
                                <Command.Group
                                    heading="最近開いた項目"
                                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
                                >
                                    {visibleRecentItems.map(renderItem)}
                                </Command.Group>
                            )}

                            {showDefaultState && visibleRecentItems.length > 0 && actionItems.length > 0 && (
                                <Command.Separator className="my-2 h-px bg-border/70" />
                            )}

                            {showDefaultState && actionItems.length > 0 && (
                                <Command.Group
                                    heading="よく使う画面"
                                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
                                >
                                    {actionItems.map(renderItem)}
                                </Command.Group>
                            )}

                            {!showDefaultState && filteredActionItems.length > 0 && (
                                <Command.Group
                                    heading="画面に移動"
                                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
                                >
                                    {filteredActionItems.map(renderItem)}
                                </Command.Group>
                            )}

                            {!showDefaultState && filteredActionItems.length > 0 && results.length > 0 && (
                                <Command.Separator className="my-2 h-px bg-border/70" />
                            )}

                            {!showDefaultState && results.length > 0 && (
                                <Command.Group
                                    heading="検索結果"
                                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
                                >
                                    {results.map(renderItem)}
                                </Command.Group>
                            )}

                            {showEmptyState && (
                                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                                    {errorMessage || "該当する結果がありません。"}
                                </Command.Empty>
                            )}

                            {showDefaultState && visibleRecentItems.length === 0 && actionItems.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    キーワードを入力して検索
                                </p>
                            )}
                        </Command.List>
                        <div className="flex items-center justify-between border-t border-border/60 bg-background/45 px-4 py-2 text-[11px] text-muted-foreground">
                            <span>Enter で開く</span>
                            <span>最近開いた項目は自動で保存されます</span>
                        </div>
                    </Command>
                </div>
            </div>
        </div>
    );
}
