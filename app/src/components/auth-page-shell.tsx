import { BrandLogo } from "@/components/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type AuthPageShellProps = {
    subtitle?: string;
    title?: string;
    description?: string;
    children: ReactNode;
};

export function AuthPageShell({
    subtitle = "社員・資格管理システム",
    title,
    description,
    children,
}: AuthPageShellProps) {
    const hasHeader = Boolean(title || description);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <h1 className="sr-only">株式会社信越報知 社員・資格管理システム</h1>
                    <BrandLogo priority className="mx-auto w-[240px] max-w-full" />
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
                <Card className="border border-border/50">
                    {hasHeader && (
                        <CardHeader className="pb-2">
                            {title && <CardTitle className="text-lg">{title}</CardTitle>}
                            {description && <CardDescription>{description}</CardDescription>}
                        </CardHeader>
                    )}
                    <CardContent className={hasHeader ? undefined : "pt-6"}>
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AuthPageLoading({ className = "h-48" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );
}
