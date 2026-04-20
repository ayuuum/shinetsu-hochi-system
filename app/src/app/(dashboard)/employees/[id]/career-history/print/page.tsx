import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { formatDisplayDate } from "@/lib/date";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EmployeeCareerHistoryPrintPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createSupabaseServer();

    const { data: employee } = await supabase
        .from("employees")
        .select("id, name, employee_number, branch")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

    if (!employee) {
        notFound();
    }

    const { data: records } = await supabase
        .from("construction_records")
        .select("construction_name, category, construction_date, role, location, notes")
        .eq("employee_id", id)
        .is("deleted_at", null)
        .order("construction_date", { ascending: false });

    return (
        <main className="mx-auto max-w-4xl bg-white p-8 text-black">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">施工実績書</h1>
                    <p className="mt-2 text-sm text-slate-600">{employee.name} / {employee.employee_number}</p>
                    <p className="text-sm text-slate-600">{employee.branch || "拠点未登録"}</p>
                </div>
                <p className="text-sm text-slate-500 print:hidden">ブラウザの印刷機能からPDF保存してください。</p>
            </div>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-100 text-left">
                        <th className="border px-3 py-2">施工日</th>
                        <th className="border px-3 py-2">工事名</th>
                        <th className="border px-3 py-2">設備種別</th>
                        <th className="border px-3 py-2">役割</th>
                        <th className="border px-3 py-2">場所</th>
                        <th className="border px-3 py-2">備考</th>
                    </tr>
                </thead>
                <tbody>
                    {(records || []).map((record) => (
                        <tr key={`${record.construction_name}-${record.construction_date}`} className="align-top">
                            <td className="border px-3 py-2 tabular-nums">{formatDisplayDate(record.construction_date)}</td>
                            <td className="border px-3 py-2 font-medium">{record.construction_name}</td>
                            <td className="border px-3 py-2">{record.category || "-"}</td>
                            <td className="border px-3 py-2">{record.role || "-"}</td>
                            <td className="border px-3 py-2">{record.location || "-"}</td>
                            <td className="border px-3 py-2 whitespace-pre-wrap">{record.notes || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}
