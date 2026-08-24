import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 366;
const LOGO_HEIGHT = 59;
const MARK_SIZE = 64;

type BrandLogoProps = {
    alt?: string;
    className?: string;
    priority?: boolean;
    variant?: "full" | "mark";
};

export function BrandLogo({
    alt = "株式会社信越報知",
    className,
    priority = false,
    variant = "full",
}: BrandLogoProps) {
    if (variant === "mark") {
        return (
            <Image
                src="/shinetsu-hochi-mark.svg"
                alt={alt}
                width={MARK_SIZE}
                height={MARK_SIZE}
                priority={priority}
                unoptimized
                className={cn("block h-full w-full", className)}
            />
        );
    }

    return (
        <Image
            src="/shinetsu-hochi-logo.svg"
            alt={alt}
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority={priority}
            unoptimized
            className={cn("block h-auto w-full", className)}
        />
    );
}
