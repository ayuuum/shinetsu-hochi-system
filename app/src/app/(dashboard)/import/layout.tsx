import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth-server";

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
    const auth = await getAuthSnapshot();
    if (auth.role !== "admin" && auth.role !== "hr") {
        redirect("/");
    }
    return children;
}
