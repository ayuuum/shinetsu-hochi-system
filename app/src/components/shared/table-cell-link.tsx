"use client";

import type { ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";

type TableCellLinkProps = LinkProps & {
    children: ReactNode;
    className?: string;
};

export function TableCellLink({ children, className, ...props }: TableCellLinkProps) {
    return (
        <Link
            {...props}
            className={cn(
                "block -m-2 rounded-md px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                className,
            )}
        >
            {children}
        </Link>
    );
}
