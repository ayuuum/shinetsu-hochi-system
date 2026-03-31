"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, ShieldCheck, Clock, ShieldAlert, Pencil } from "lucide-react";
import { differenceInDays } from "date-fns";
import Link from "next/link";
import { getAlertLevel, type AlertLevel } from "@/lib/alert-utils";
import { EditQualificationModal } from "@/components/qualifications/edit-qualification-modal";

export type QualificationRow = Tables<"employee_qualifications"> & {
    employees: { id: string; name: string; branch: string | null } | null;
    qualification_master: { name: string; category: string | null } | null;
};

const levelConfig: Record<AlertLevel, { label: string; badge: string; color: string }> = {
    danger: { label: "期限切れ", badge: "bg-red-100 text-red-700 hover:bg-red-100", color: "text-red-600" },
    urgent: { label: "14日以内", badge: "bg-orange-100 text-orange-700 hover:bg-orange-100", color: "text-orange-600" },
    warning: { label: "30日以内", badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", color: "text-yellow-600" },
    info: { label: "60日以内", badge: "bg-blue-100 text-blue-700 hover:bg-blue-100", color: "text-blue-600" },
    ok: { label: "正常", badge: "bg-green-100 text-green-700 hover:bg-green-100", color: "text-green-600" },
};

interface QualificationsClientProps {
    initialQualifications: QualificationRow[];
    categories: string[];
}

export function QualificationsClient({ initialQualifications, categories }: QualificationsClientProps) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<QualificationRow | null>(null);
    const router = useRouter();

    const filtered = initialQualifications.filter((q) => {
        const level = getAlertLevel(q.expiry_date);
        const matchesSearch =
            q.employees?.name?.toLowerCase().includes(search.toLowerCase()) ||
            q.qualification_master?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !categoryFilter || categoryFilter === "all" || q.qualification_master?.category === categoryFilter;
        const matchesLevel = !levelFilter || levelFilter === "all" || level === levelFilter;
        return matchesSearch && matchesCategory && matchesLevel;
    });

    const counts = initialQualifications.reduce((acc, q) => {
        const level = getAlertLevel(q.expiry_date);
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<AlertLevel, number>);

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">資格・講習管理</h1>
                <p className="text-muted-foreground mt-2">全従業員の資格・免状の期限と更新予定を一元管理します。</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLevelFilter(levelFilter === "danger" ? "all" : "danger")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100"><AlertCircle className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{counts.danger || 0}</p>
                            <p className="text-xs text-muted-foreground">期限切れ</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLevelFilter(levelFilter === "urgent" ? "all" : "urgent")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100"><ShieldAlert className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">{counts.urgent || 0}</p>
                            <p className="text-xs text-muted-foreground">14日以内</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLevelFilter(levelFilter === "warning" ? "all" : "warning")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{counts.warning || 0}</p>
                            <p className="text-xs text-muted-foreground">30日以内</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLevelFilter(levelFilter === "ok" ? "all" : "ok")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100"><ShieldCheck className="h-5 w-5 text-green-600" /></div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{counts.ok || 0}</p>
                            <p className="text-xs text-muted-foreground">正常</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="社員名・資格名で検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={categoryFilter ?? undefined} onValueChange={(val: string | null) => setCategoryFilter(val)}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="すべてのカテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべてのカテゴリ</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={levelFilter ?? undefined} onValueChange={(val: string | null) => setLevelFilter(val)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="すべてのステータス" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="danger">期限切れ</SelectItem>
                        <SelectItem value="urgent">14日以内</SelectItem>
                        <SelectItem value="warning">30日以内</SelectItem>
                        <SelectItem value="info">60日以内</SelectItem>
                        <SelectItem value="ok">正常</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-xl bg-card overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>社員名</TableHead>
                            <TableHead>拠点</TableHead>
                            <TableHead>資格名</TableHead>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>取得日</TableHead>
                            <TableHead>有効期限</TableHead>
                            <TableHead>ステータス</TableHead>
                            <TableHead>申込状況</TableHead>
                            <TableHead className="w-[80px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    該当する資格データがありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((q) => {
                                const level = getAlertLevel(q.expiry_date);
                                const config = levelConfig[level];
                                const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;
                                return (
                                    <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold">
                                            <Link href={`/employees/${q.employees?.id}`} className="hover:text-primary hover:underline">
                                                {q.employees?.name || "-"}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm">{q.employees?.branch || "-"}</TableCell>
                                        <TableCell className="text-sm font-medium">
                                            <Link href={`/qualifications/${q.id}`} className="hover:text-primary hover:underline">
                                                {q.qualification_master?.name || "-"}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">{q.qualification_master?.category || "-"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{q.acquired_date || "-"}</TableCell>
                                        <TableCell className={`text-sm font-medium ${config.color}`}>
                                            {q.expiry_date || "期限なし"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={config.badge}>
                                                {days !== null
                                                    ? days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残${days}日`
                                                    : "−"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{q.status || "未着手"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => setEditingItem(q)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <EditQualificationModal
                    qualification={editingItem}
                    open={!!editingItem}
                    onOpenChange={(open) => {
                        if (!open) setEditingItem(null);
                    }}
                />
            )}
        </div>
    );
}
