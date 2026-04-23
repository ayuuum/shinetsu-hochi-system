"use client";

import type { ComponentProps } from "react";
import { useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IntentPrefetchProps = Pick<ComponentProps<typeof Link>, "prefetch" | "onMouseEnter" | "onFocus">;

export function useIntentPrefetch() {
    const router = useRouter();
    const prefetchedUrlsRef = useRef(new Set<string>());

    const prefetchHref = useCallback((href: string) => {
        if (prefetchedUrlsRef.current.has(href)) {
            return;
        }

        prefetchedUrlsRef.current.add(href);
        router.prefetch(href);
    }, [router]);

    const getIntentPrefetchProps = useCallback((href: string): IntentPrefetchProps => ({
        prefetch: false,
        onMouseEnter: () => prefetchHref(href),
        onFocus: () => prefetchHref(href),
    }), [prefetchHref]);

    return { getIntentPrefetchProps };
}
