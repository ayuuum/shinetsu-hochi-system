export function TableScrollHint({ className = "" }: { className?: string }) {
    return (
        <p className={`px-1 text-xs text-muted-foreground md:hidden ${className}`}>
            表は左右にスクロールできます。
        </p>
    );
}
