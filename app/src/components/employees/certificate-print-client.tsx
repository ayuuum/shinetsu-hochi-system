"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer } from "lucide-react";
import { getTodayInTokyo } from "@/lib/date";

export type CertificatePrintItem = {
    id: string;
    qualificationName: string;
    signedUrl: string;
    kind: "image" | "pdf";
};

export function CertificatePrintClient({
    employeeId,
    employeeName,
    items,
}: {
    employeeId: string;
    employeeName: string;
    items: CertificatePrintItem[];
}) {
    const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(items.map((i) => i.id)));
    const clearAll = () => setSelected(new Set());

    const selectedItems = useMemo(
        () => items.filter((i) => selected.has(i.id)),
        [items, selected],
    );

    const today = getTodayInTokyo();

    if (items.length === 0) {
        return (
            <div className="space-y-4 animate-in fade-in duration-200">
                <Button variant="ghost" size="sm" className="w-fit" render={<Link href={`/employees/${employeeId}?tab=qualifications`} />}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    社員詳細へ戻る
                </Button>
                <p className="text-sm text-muted-foreground">
                    証書画像が登録されている資格がありません。社員詳細の資格から画像をアップロードしてください。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="print:hidden space-y-4">
                <Button variant="ghost" size="sm" className="w-fit" render={<Link href={`/employees/${employeeId}?tab=qualifications`} />}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    社員詳細へ戻る
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">提出用・証書シート（A4印刷）</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {employeeName} — 印刷プレビューで配置を確認し、「印刷」から PDF 保存できます。画像（JPEG/PNG 等）は1ページに最大4枚のグリッドで並べます。PDF
                        ファイルは印刷レイアウトに載せず、一覧にリンクのみ表示します。
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                        すべて選択
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                        すべて解除
                    </Button>
                    <Button type="button" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        印刷 / PDF保存
                    </Button>
                </div>
                <ul className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3 text-sm">
                            <Checkbox
                                id={`cert-${item.id}`}
                                checked={selected.has(item.id)}
                                onCheckedChange={() => toggle(item.id)}
                            />
                            <label htmlFor={`cert-${item.id}`} className="cursor-pointer leading-tight">
                                <span className="font-medium">{item.qualificationName}</span>
                                <span className="ml-2 text-muted-foreground">({item.kind === "pdf" ? "PDF" : "画像"})</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 印刷対象: @page A4 はグローバルスタイルで指定 */}
            <div className="certificate-print-root rounded-lg border border-border/60 bg-white p-4 print:border-0 print:p-0 print:shadow-none">
                <header className="mb-4 border-b border-border/50 pb-3 print:mb-3">
                    <p className="text-xs text-muted-foreground print:text-foreground">証書提出用（社内生成）</p>
                    <p className="text-lg font-semibold">{employeeName}</p>
                    <p className="text-sm text-muted-foreground">出力日: {today}</p>
                </header>

                {selectedItems.length === 0 ? (
                    <p className="print:hidden text-sm text-muted-foreground">印刷する資格を1件以上選択してください。</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-3">
                        {selectedItems.map((item) =>
                            item.kind === "image" ? (
                                <figure
                                    key={item.id}
                                    className="flex flex-col overflow-hidden rounded-md border border-border/60 print:break-inside-avoid"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL, dynamic per session */}
                                    <img
                                        src={item.signedUrl}
                                        alt={item.qualificationName}
                                        className="max-h-[min(42vh,280px)] w-full object-contain bg-muted/30 print:max-h-[100mm]"
                                    />
                                    <figcaption className="border-t border-border/40 bg-muted/20 px-2 py-1.5 text-center text-xs font-medium print:text-[10pt]">
                                        {item.qualificationName}
                                    </figcaption>
                                </figure>
                            ) : (
                                <div
                                    key={item.id}
                                    className="flex flex-col justify-center rounded-md border border-dashed border-border/60 p-4 text-sm print:break-inside-avoid"
                                >
                                    <p className="font-medium">{item.qualificationName}</p>
                                    <p className="mt-1 text-muted-foreground">PDF（印刷レイアウト非対応）</p>
                                    <a
                                        href={item.signedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 text-primary underline print:hidden"
                                    >
                                        PDFを別タブで開く
                                    </a>
                                    <p className="mt-2 hidden text-xs print:block">別途 PDF を印刷して添付してください。</p>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
