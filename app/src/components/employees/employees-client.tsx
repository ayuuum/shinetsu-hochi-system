"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tables } from "@/types/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Award, Download, X, ArrowUpDown } from "lucide-react";
import { AddEmployeeModal } from "@/components/employees/add-employee-modal";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";
import { formatDisplayDate } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";

export type EmployeeWithQualCount = Tables<"employees"> & {
    qualification_count: number;
    expiring_count: number;
};

interface EmployeesClientProps {
    initialEmployees: EmployeeWithQualCount[];
    qualMasters: Tables<"qualification_master">[];
    currentSearch: string;
    currentBranch: string;
    currentQualification: string;
    currentSort?: string;
    currentPage?: number;
    hasNextPage?: boolean;
}

function buildEmployeesHref(pathname: string, {
    search,
    branch,
    qualification,
    sort,
    page,
}: {
    search: string;
    branch: string;
    qualification: string;
    sort: string;
    page: number;
}) {
    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("q", search.trim());
    }
    if (branch) {
        params.set("branch", branch);
    }
    if (qualification) {
        params.set("qualification", qualification);
    }
    if (sort) {
        params.set("sort", sort);
    }
    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function EmployeesClient({
    initialEmployees,
    qualMasters,
    currentSearch,
    currentBranch,
    currentQualification,
    currentSort = "",
    currentPage = 1,
    hasNextPage = false,
}: EmployeesClientProps) {
    const [search, setSearch] = useState(currentSearch);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [mobileBranch, setMobileBranch] = useState(currentBranch);
    const [mobileQualification, setMobileQualification] = useState(currentQualification);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr } = useAuth();
    const qualificationOptions = qualMasters.map((master) => ({
        value: master.id,
        label: master.name,
    }));
    const qualificationLabelMap = new Map(qualMasters.map((master) => [master.id, master.name]));
    const activeFilters = [
        currentSearch
            ? {
                key: "search",
                label: `検索: ${currentSearch}`,
                onRemove: () => {
                    setSearch("");
                    startTransition(() => {
                        router.replace(buildEmployeesHref(pathname, {
                            search: "",
                            branch: currentBranch,
                            qualification: currentQualification,
                            sort: currentSort,
                            page: 1,
                        }), { scroll: false });
                    });
                },
            }
            : null,
        currentBranch
            ? {
                key: "branch",
                label: `拠点: ${currentBranch === "塩尻" ? "塩尻営業所" : currentBranch === "白馬" ? "白馬営業所" : currentBranch}`,
                onRemove: () => updateFilters({ branch: "", page: 1 }),
            }
            : null,
        currentQualification
            ? {
                key: "qualification",
                label: `資格: ${qualificationLabelMap.get(currentQualification) || currentQualification}`,
                onRemove: () => updateFilters({ qualification: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        if (isMobileFiltersOpen) return;
        setMobileBranch(currentBranch);
        setMobileQualification(currentQualification);
    }, [currentBranch, currentQualification, isMobileFiltersOpen]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;

            startTransition(() => {
                router.replace(buildEmployeesHref(pathname, {
                    search,
                    branch: currentBranch,
                    qualification: currentQualification,
                    sort: currentSort,
                    page: 1,
                }), { scroll: false });
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [currentBranch, currentQualification, currentSearch, pathname, router, search]);

    const updateFilters = (updates: Partial<{ branch: string; qualification: string; sort: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildEmployeesHref(pathname, {
                search,
                branch: updates.branch ?? currentBranch,
                qualification: updates.qualification ?? currentQualification,
                sort: updates.sort ?? currentSort,
                page: updates.page ?? 1,
            }), { scroll: false });
        });
    };

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildEmployeesHref(pathname, {
                search: "",
                branch: "",
                qualification: "",
                sort: currentSort,
                page: 1,
            }), { scroll: false });
        });
    };

    const handleMobileFiltersOpenChange = (open: boolean) => {
        if (open) {
            setMobileBranch(currentBranch);
            setMobileQualification(currentQualification);
        }
        setIsMobileFiltersOpen(open);
    };

    const applyMobileFilters = () => {
        setIsMobileFiltersOpen(false);
        startTransition(() => {
            router.replace(buildEmployeesHref(pathname, {
                search,
                branch: mobileBranch,
                qualification: mobileQualification,
                sort: currentSort,
                page: 1,
            }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <PageHeader
                title="社員台帳"
                description="全従業員の基本情報、所属、資格情報を一元管理します。"
                actions={(
                    <>
                        <Button variant="outline" onClick={() => {
                            const params = new URLSearchParams();
                            if (search.trim()) params.set("q", search.trim());
                            if (currentBranch) params.set("branch", currentBranch);
                            const qs = params.toString();
                            window.open(qs ? `/api/export/employees?${qs}` : "/api/export/employees", "_blank");
                        }}>
                            <Download className="mr-2 h-4 w-4" />
                            CSV出力
                        </Button>
                        {isAdminOrHr && <AddEmployeeModal />}
                    </>
                )}
            />

            <div className="space-y-3 md:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="社員名・番号・フリガナで検索"
                        placeholder="社員名・番号・フリガナで検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-8"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="検索をクリア"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <MobileFiltersSheet
                    title="社員を絞り込む"
                    description="拠点や資格で対象者を絞り込みます。"
                    summary="拠点・資格"
                    activeCount={activeFilters.length}
                    onClearAll={() => {
                        clearFilters();
                        setIsMobileFiltersOpen(false);
                    }}
                    open={isMobileFiltersOpen}
                    onOpenChange={handleMobileFiltersOpenChange}
                    footer={(
                        <Button type="button" className="w-full" onClick={applyMobileFilters}>
                            条件を適用
                        </Button>
                    )}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-medium">拠点</p>
                        <Select
                            value={mobileBranch || undefined}
                            onValueChange={(value) => setMobileBranch(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="すべての拠点" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべての拠点</SelectItem>
                                <SelectItem value="本社">本社</SelectItem>
                                <SelectItem value="塩尻">塩尻営業所</SelectItem>
                                <SelectItem value="白馬">白馬営業所</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">資格</p>
                        <Select
                            items={qualificationOptions}
                            value={mobileQualification || undefined}
                            onValueChange={(value) => setMobileQualification(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="すべての資格" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべての資格</SelectItem>
                                {qualMasters.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </MobileFiltersSheet>
            </div>

            <div className="hidden md:flex md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="社員名・番号・フリガナで検索"
                        placeholder="社員名・番号・フリガナで検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-8"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="検索をクリア"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <Select
                    value={currentBranch || undefined}
                    onValueChange={(value) => updateFilters({ branch: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="すべての拠点" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべての拠点</SelectItem>
                        <SelectItem value="本社">本社</SelectItem>
                        <SelectItem value="塩尻">塩尻営業所</SelectItem>
                        <SelectItem value="白馬">白馬営業所</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    items={qualificationOptions}
                    value={currentQualification || undefined}
                    onValueChange={(value) => updateFilters({ qualification: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-full md:w-[240px]">
                        <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="すべての資格" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべての資格</SelectItem>
                        {qualMasters.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={currentSort || undefined}
                    onValueChange={(value) => updateFilters({ sort: value && value !== "default" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                        <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="並び順" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">社員番号順</SelectItem>
                        <SelectItem value="hire_date_desc">入社日（新しい順）</SelectItem>
                        <SelectItem value="hire_date_asc">入社日（古い順）</SelectItem>
                        <SelectItem value="name_asc">氏名（五十音順）</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialEmployees.length === 0 ? (
                    <Card size="sm">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            該当する社員が見つかりません。
                        </CardContent>
                    </Card>
                ) : (
                    initialEmployees.map((emp) => (
                        <Link key={emp.id} href={`/employees/${emp.id}`} className="block">
                            <Card
                                size="sm"
                                className="transition-all duration-200 active:scale-[0.99] hover:shadow-md"
                            >
                                <CardContent className="space-y-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground/70 uppercase">
                                                {emp.employee_number}
                                            </p>
                                            <p className="mt-1.5 truncate text-base font-semibold text-foreground">{emp.name}</p>
                                            <p className="truncate text-sm text-muted-foreground">{emp.name_kana}</p>
                                        </div>
                                        {emp.branch ? <Badge variant="outline" className="text-[11px] font-medium">{emp.branch}</Badge> : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground/70">役職</p>
                                            <p className="text-sm font-medium text-foreground">{emp.job_title || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground/70">入社日</p>
                                            <p className="text-sm font-medium tabular-nums text-foreground">{formatDisplayDate(emp.hire_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Badge variant="secondary" className="text-[11px] font-medium">{emp.qualification_count}件の資格</Badge>
                                        {emp.expiring_count > 0 ? (
                                            <Badge variant="destructive" className="text-[11px] font-medium">
                                                期限間近 {emp.expiring_count}件
                                            </Badge>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-border/30 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)] md:block" aria-busy={isPending}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="sticky left-0 z-20 w-[120px] bg-muted/30 shadow-[inset_-1px_0_0_hsl(var(--border)/0.3)]">社員番号</TableHead>
                            <TableHead>氏名</TableHead>
                            <TableHead>フリガナ</TableHead>
                            <TableHead>拠点</TableHead>
                            <TableHead>役職</TableHead>
                            <TableHead>入社日</TableHead>
                            <TableHead className="text-center">保有資格</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium">
                                    該当する社員が見つかりません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialEmployees.map((emp) => (
                                <TableRow key={emp.id} className="group transition-all duration-200">
                                    <TableCell className="sticky left-0 z-10 bg-card font-mono text-muted-foreground shadow-[inset_-1px_0_0_hsl(var(--border)/0.3)] group-hover:bg-muted/40 transition-colors">
                                        <TableCellLink href={`/employees/${emp.id}`} className="font-mono text-muted-foreground hover:text-foreground transition-colors">
                                            {emp.employee_number}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                        <TableCellLink href={`/employees/${emp.id}`} className="font-semibold hover:text-primary transition-colors">
                                            {emp.name}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <TableCellLink href={`/employees/${emp.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {emp.name_kana}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-foreground/80">
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground transition-colors">
                                            {emp.branch || "-"}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-foreground/80">
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground transition-colors">
                                            {emp.job_title || "-"}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="tabular-nums text-foreground/80">
                                        <TableCellLink href={`/employees/${emp.id}`} className="tabular-nums hover:text-foreground transition-colors">
                                            {formatDisplayDate(emp.hire_date)}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground transition-colors">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Badge variant="secondary" className="text-[11px] font-medium">{emp.qualification_count}件</Badge>
                                                {emp.expiring_count > 0 && (
                                                    <Badge variant="destructive" className="text-[10px] font-medium">
                                                        {emp.expiring_count}件期限間近
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCellLink>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {(currentPage > 1 || hasNextPage) && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        className="min-w-[80px]"
                        render={<Link href={buildEmployeesHref(pathname, {
                            search: currentSearch,
                            branch: currentBranch,
                            qualification: currentQualification,
                            sort: currentSort,
                            page: currentPage - 1,
                        })} />}
                    >
                        前へ
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {currentPage} ページ
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasNextPage}
                        className="min-w-[80px]"
                        render={<Link href={buildEmployeesHref(pathname, {
                            search: currentSearch,
                            branch: currentBranch,
                            qualification: currentQualification,
                            sort: currentSort,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}
        </div>
    );
}
