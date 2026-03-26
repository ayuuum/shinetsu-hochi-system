"use client";

import { useState } from "react";
import { Tables } from "@/types/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export type EmployeeWithQualCount = Tables<"employees"> & {
    qualification_count: number;
    expiring_count: number;
};

interface EmployeesClientProps {
    initialEmployees: EmployeeWithQualCount[];
    qualMasters: Tables<"qualification_master">[];
    currentPage?: number;
    totalPages?: number;
}

export function EmployeesClient({ initialEmployees, qualMasters, currentPage = 1, totalPages = 1 }: EmployeesClientProps) {
    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState<string | null>(null);
    const [qualFilter, setQualFilter] = useState<string | null>(null);
    const [qualHolders, setQualHolders] = useState<Set<string>>(new Set());

    const fetchQualHolders = async (qualId: string) => {
        const { data } = await supabase
            .from("employee_qualifications")
            .select("employee_id")
            .eq("qualification_id", qualId);
        if (data) {
            setQualHolders(new Set(data.map(d => d.employee_id!)));
        }
    };

    const handleQualFilterChange = (val: string | null) => {
        setQualFilter(val);
        if (val && val !== "all") {
            fetchQualHolders(val);
        } else {
            setQualHolders(new Set());
        }
    };

    const filtered = initialEmployees.filter((emp) => {
        const matchesSearch =
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            (emp.name_kana?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            emp.employee_number.toLowerCase().includes(search.toLowerCase());
        const matchesBranch = !branchFilter || branchFilter === "all" || emp.branch === branchFilter;
        const matchesQual = !qualFilter || qualFilter === "all" || qualHolders.has(emp.id);
        return matchesSearch && matchesBranch && matchesQual;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">社員台帳</h1>
                    <p className="text-muted-foreground mt-2">全従業員の基本情報、所属、資格情報を一元管理します。</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open("/api/export/employees", "_blank")}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV出力
                    </Button>
                    <AddEmployeeModal />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="社員名・番号・フリガナで検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={branchFilter ?? undefined} onValueChange={(val: string | null) => setBranchFilter(val)}>
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
                <Select value={qualFilter ?? undefined} onValueChange={(val: string | null) => handleQualFilterChange(val)}>
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

            <div className="border rounded-xl bg-card overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[120px]">社員番号</TableHead>
                            <TableHead>氏名</TableHead>
                            <TableHead>フリガナ</TableHead>
                            <TableHead>拠点</TableHead>
                            <TableHead>役職</TableHead>
                            <TableHead>入社日</TableHead>
                            <TableHead className="text-center">保有資格</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium">
                                    該当する社員が見つかりません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((emp) => (
                                <TableRow key={emp.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono text-sm text-muted-foreground">{emp.employee_number}</TableCell>
                                    <TableCell className="font-bold">
                                        <Link href={`/employees/${emp.id}`} className="hover:text-primary hover:underline transition-all">
                                            {emp.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{emp.name_kana}</TableCell>
                                    <TableCell>{emp.branch || "-"}</TableCell>
                                    <TableCell>{emp.job_title || "-"}</TableCell>
                                    <TableCell className="text-sm">{emp.hire_date || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Badge variant="secondary">{emp.qualification_count}件</Badge>
                                            {emp.expiring_count > 0 && (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    {emp.expiring_count}件期限間近
                                                </Badge>
                                            )}
                                        </div>
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
                        render={<Link href={`/employees?page=${currentPage - 1}`} />}
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
                        render={<Link href={`/employees?page=${currentPage + 1}`} />}
                    >
                        次へ
                    </Button>
                </div>
            )}
        </div>
    );
}
