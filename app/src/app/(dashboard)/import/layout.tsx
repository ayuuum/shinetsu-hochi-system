import { redirect } from "next/navigation";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
    const auth = await getFastAuthSnapshot();
    if (auth.role !== "admin" && auth.role !== "hr") {
        redirect("/");
    }
    return children;
}
