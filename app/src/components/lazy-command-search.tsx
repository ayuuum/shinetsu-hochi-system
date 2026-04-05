"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OPEN_COMMAND_SEARCH_EVENT } from "@/components/search-trigger";

const CommandSearch = dynamic(
    () => import("@/components/command-search").then((mod) => mod.CommandSearch),
    { ssr: false }
);

export function LazyCommandSearch() {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const requestOpen = () => {
            setMounted(true);
            setOpen(true);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                return;
            }

            if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setMounted(true);
                setOpen((current) => !current);
            }
        };

        document.addEventListener(OPEN_COMMAND_SEARCH_EVENT, requestOpen);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(OPEN_COMMAND_SEARCH_EVENT, requestOpen);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    if (!mounted) {
        return null;
    }

    return <CommandSearch open={open} onOpenChange={setOpen} />;
}
