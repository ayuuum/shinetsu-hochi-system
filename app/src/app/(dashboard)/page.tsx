import { redirect } from "next/navigation";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export default async function Home() {
    const auth = await getFastAuthSnapshot();

    if (!auth.user) {
        redirect("/login");
    }

    if (auth.role === "technician") {
        redirect("/today");
    }

    redirect("/dashboard");
}
