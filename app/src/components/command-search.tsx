"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { supabase } from "@/lib/supabase";
import { Search, User, Award, Truck } from "lucide-react";

type SearchResult = {
    id: string;
    type: "employee" | "qualification" | "vehicle";
    title: string;
    subtitle: string;
    href: string;
};

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Cmd+K shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.length < 1) {
            setResults([]);
            return;
        }
        setLoading(true);
        const pattern = `%${q}%`;

        const [empRes, qualRes, vehRes] = await Promise.all([
            supabase
                .from("employees")
                .select("id, name, name_kana, employee_number, branch, job_title")
                .or(`name.ilike.${pattern},name_kana.ilike.${pattern},employee_number.ilike.${pattern}`)
                .limit(5),
            supabase
                .from("employee_qualifications")
                .select("id, employee_id, employees(name), qualification_master(name)")
                .or(`qualification_master.name.ilike.${pattern}`)
                .limit(5),
            supabase
                .from("vehicles")
                .select("id, plate_number, vehicle_name")
                .or(`plate_number.ilike.${pattern},vehicle_name.ilike.${pattern}`)
                .limit(3),
        ]);

        const items: SearchResult[] = [];

        empRes.data?.forEach((e) => {
            items.push({
                id: e.id,
                type: "employee",
                title: e.name,
                subtitle: [e.branch, e.job_title].filter(Boolean).join(" / ") || e.employee_number,
                href: `/employees/${e.id}`,
            });
        });

        qualRes.data?.forEach((q: any) => {
            items.push({
                id: q.id,
                type: "qualification",
                title: q.qualification_master?.name || "資格",
                subtitle: q.employees?.name || "",
                href: `/employees/${q.employee_id}`,
            });
        });

        vehRes.data?.forEach((v) => {
            items.push({
                id: v.id,
                type: "vehicle",
                title: v.plate_number,
                subtitle: v.vehicle_name || "",
                href: "/vehicles",
            });
        });

        setResults(items);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 200);
        return () => clearTimeout(timer);
    }, [query, search]);

    const select = (href: string) => {
        setOpen(false);
        setQuery("");
        router.push(href);
    };

    const iconMap = {
        employee: <User className="h-4 w-4 text-muted-foreground shrink-0" />,
        qualification: <Award className="h-4 w-4 text-muted-foreground shrink-0" />,
        vehicle: <Truck className="h-4 w-4 text-muted-foreground shrink-0" />,
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
                <Command
                    className="bg-popover border rounded-xl shadow-2xl overflow-hidden"
                    shouldFilter={false}
                >
                    <div className="flex items-center border-b px-4">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="社員名・資格名・車両番号で検索..."
                            className="flex-1 h-12 bg-transparent outline-none text-sm pl-3 placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <kbd className="text-[10px] text-muted-foreground/50 border rounded px-1.5 py-0.5">
                            ESC
                        </kbd>
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto p-2">
                        {loading && (
                            <Command.Loading>
                                <p className="text-sm text-muted-foreground text-center py-6">検索中...</p>
                            </Command.Loading>
                        )}
                        {!loading && query.length > 0 && results.length === 0 && (
                            <Command.Empty className="text-sm text-muted-foreground text-center py-6">
                                該当する結果がありません
                            </Command.Empty>
                        )}
                        {!loading && query.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                キーワードを入力して検索
                            </p>
                        )}
                        {results.map((r) => (
                            <Command.Item
                                key={`${r.type}-${r.id}`}
                                value={r.id}
                                onSelect={() => select(r.href)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent data-[selected=true]:bg-accent transition-colors"
                            >
                                {iconMap[r.type]}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{r.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                                </div>
                            </Command.Item>
                        ))}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
