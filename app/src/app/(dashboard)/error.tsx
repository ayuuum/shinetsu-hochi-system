"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                    <div>
                        <h2 className="text-xl font-bold">エラーが発生しました</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            {error.message || "予期しないエラーが発生しました。しばらくしてからもう一度お試しください。"}
                        </p>
                    </div>
                    <Button onClick={reset}>再試行</Button>
                </CardContent>
            </Card>
        </div>
    );
}
