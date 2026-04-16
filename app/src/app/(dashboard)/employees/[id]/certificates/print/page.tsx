import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import {
    CertificatePrintClient,
    type CertificatePrintItem,
} from "@/components/employees/certificate-print-client";

const SIGNED_URL_TTL = 60 * 60 * 4;

function isPdfPath(path: string) {
    return /\.pdf$/i.test(path);
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EmployeeCertificatePrintPage({ params }: PageProps) {
    const { id: employeeId } = await params;
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        if (!auth.linkedEmployeeId || auth.linkedEmployeeId !== employeeId) {
            redirect(auth.linkedEmployeeId ? `/employees/${auth.linkedEmployeeId}` : "/me");
        }
    }

    const supabase = await createSupabaseServer();

    const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, name")
        .eq("id", employeeId)
        .is("deleted_at", null)
        .single();

    if (empError || !employee) {
        notFound();
    }

    const { data: quals } = await supabase
        .from("employee_qualifications")
        .select(`
            id,
            certificate_url,
            qualification_master(name)
        `)
        .eq("employee_id", employeeId)
        .not("certificate_url", "is", null);

    const items: CertificatePrintItem[] = [];

    for (const row of quals || []) {
        const path = row.certificate_url;
        if (!path) continue;

        const { data: signed, error: signError } = await supabase.storage
            .from("certificates")
            .createSignedUrl(path, SIGNED_URL_TTL);

        if (signError || !signed?.signedUrl) continue;

        const qualificationName =
            (row.qualification_master as { name: string | null } | null)?.name || "資格";

        items.push({
            id: row.id,
            qualificationName,
            signedUrl: signed.signedUrl,
            kind: isPdfPath(path) ? "pdf" : "image",
        });
    }

    return (
        <CertificatePrintClient
            employeeId={employee.id}
            employeeName={employee.name}
            items={items}
        />
    );
}
