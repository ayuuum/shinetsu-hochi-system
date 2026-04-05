import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 366;
const LOGO_HEIGHT = 59;

type BrandLogoProps = {
    alt?: string;
    className?: string;
    priority?: boolean;
    variant?: "full" | "mark";
};

export function BrandLogo({
    alt = "信越報知",
    className,
    priority = false,
    variant = "full",
}: BrandLogoProps) {
    if (variant === "mark") {
        return (
            <div className={cn("overflow-hidden", className)}>
                <Image
                    src="/shinetsu-hochi-logo.svg"
                    alt={alt}
                    width={LOGO_WIDTH}
                    height={LOGO_HEIGHT}
                    priority={priority}
                    unoptimized
                    className="block h-full w-auto max-w-none"
                />
            </div>
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
