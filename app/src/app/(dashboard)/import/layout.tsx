import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth-server";

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect("/me");
    }
    return children;
}
