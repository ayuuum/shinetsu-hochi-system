import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TableSkeletonLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-9 w-[180px] rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-[20px] border p-4 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-10" />
                    </div>
                ))}
            </div>

            <Card className="border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-[280px]" />
                        <Skeleton className="h-9 w-[120px]" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-3 w-16" /></TableHead>
                                <TableHead><Skeleton className="h-3 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-3 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-3 w-12" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-md shrink-0" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
