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
import { Search, MapPin, Award, Download } from "lucide-react";
import { AddEmployeeModal } from "@/components/employees/add-employee-modal";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";

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
    currentPage?: number;
    totalPages?: number;
}

function buildEmployeesHref(pathname: string, {
    search,
    branch,
    qualification,
    page,
}: {
    search: string;
    branch: string;
    qualification: string;
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
    currentPage = 1,
    totalPages = 1,
}: EmployeesClientProps) {
    const [search, setSearch] = useState(currentSearch);
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
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;

            startTransition(() => {
                router.replace(buildEmployeesHref(pathname, {
                    search,
                    branch: currentBranch,
                    qualification: currentQualification,
                    page: 1,
                }), { scroll: false });
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [currentBranch, currentQualification, currentSearch, pathname, router, search]);

    const updateFilters = (updates: Partial<{ branch: string; qualification: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildEmployeesHref(pathname, {
                search,
                branch: updates.branch ?? currentBranch,
                qualification: updates.qualification ?? currentQualification,
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
                page: 1,
            }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">社員台帳</h1>
                    <p className="text-muted-foreground mt-2">全従業員の基本情報、所属、資格情報を一元管理します。</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => window.open("/api/export/employees", "_blank")}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV出力
                    </Button>
                    {isAdminOrHr && <AddEmployeeModal />}
                </div>
            </div>

            <div className="space-y-3 md:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="社員名・番号・フリガナで検索"
                        placeholder="社員名・番号・フリガナで検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <MobileFiltersSheet
                    title="社員を絞り込む"
                    description="拠点や資格で対象者を絞り込みます。"
                    activeCount={activeFilters.length}
                    onClearAll={clearFilters}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-medium">拠点</p>
                        <Select
                            value={currentBranch || undefined}
                            onValueChange={(value) => updateFilters({ branch: value && value !== "all" ? value : "", page: 1 })}
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
                            value={currentQualification || undefined}
                            onValueChange={(value) => updateFilters({ qualification: value && value !== "all" ? value : "", page: 1 })}
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
                        className="pl-9"
                    />
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
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialEmployees.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            該当する社員が見つかりません。
                        </CardContent>
                    </Card>
                ) : (
                    initialEmployees.map((emp) => (
                        <Link key={emp.id} href={`/employees/${emp.id}`} className="block">
                            <Card
                                size="sm"
                                className="border-border/60 transition-[transform,box-shadow,border-color] duration-200 active:scale-[0.99]"
                            >
                                <CardContent className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
                                                {emp.employee_number}
                                            </p>
                                            <p className="mt-1 truncate text-base font-semibold">{emp.name}</p>
                                            <p className="truncate text-sm text-muted-foreground">{emp.name_kana}</p>
                                        </div>
                                        {emp.branch ? <Badge variant="outline">{emp.branch}</Badge> : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">役職</p>
                                            <p className="font-medium">{emp.job_title || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">入社日</p>
                                            <p className="font-medium">{emp.hire_date || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">{emp.qualification_count}件の資格</Badge>
                                        {emp.expiring_count > 0 ? (
                                            <Badge variant="destructive">
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

            <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block" aria-busy={isPending}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 z-20 w-[120px] bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))]">社員番号</TableHead>
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
                                <TableRow key={emp.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="sticky left-0 z-10 bg-card font-mono text-sm text-muted-foreground shadow-[inset_-1px_0_0_hsl(var(--border))] group-hover:bg-muted/30">
                                        <TableCellLink href={`/employees/${emp.id}`} className="font-mono text-sm text-muted-foreground hover:text-foreground">
                                            {emp.employee_number}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        <TableCellLink href={`/employees/${emp.id}`} className="font-bold hover:underline">
                                            {emp.name}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <TableCellLink href={`/employees/${emp.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                                            {emp.name_kana}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell>
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground">
                                            {emp.branch || "-"}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell>
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground">
                                            {emp.job_title || "-"}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <TableCellLink href={`/employees/${emp.id}`} className="text-sm hover:text-foreground">
                                            {emp.hire_date || "-"}
                                        </TableCellLink>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <TableCellLink href={`/employees/${emp.id}`} className="hover:text-foreground">
                                            <div className="flex items-center justify-center gap-1">
                                                <Badge variant="secondary">{emp.qualification_count}件</Badge>
                                                {emp.expiring_count > 0 && (
                                                    <Badge variant="destructive" className="text-[10px]">
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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        render={<Link href={buildEmployeesHref(pathname, {
                            search: currentSearch,
                            branch: currentBranch,
                            qualification: currentQualification,
                            page: currentPage - 1,
                        })} />}
                    >
                        前へ
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        render={<Link href={buildEmployeesHref(pathname, {
                            search: currentSearch,
                            branch: currentBranch,
                            qualification: currentQualification,
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
