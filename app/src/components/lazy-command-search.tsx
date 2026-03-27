"use client";

import dynamic from "next/dynamic";

const CommandSearch = dynamic(
    () => import("@/components/command-search").then((mod) => mod.CommandSearch),
    { ssr: false }
);

export function LazyCommandSearch() {
    return <CommandSearch />;
}
