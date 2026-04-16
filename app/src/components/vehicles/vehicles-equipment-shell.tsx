"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VehiclesEquipmentShell({
    vehiclesTab,
    equipmentTab,
}: {
    vehiclesTab: ReactNode;
    equipmentTab: ReactNode;
}) {
    return (
        <Tabs defaultValue="vehicles" className="space-y-6">
            <TabsList className="h-11 w-full max-w-md justify-start gap-1 rounded-[14px] bg-muted/40 p-1">
                <TabsTrigger value="vehicles" className="rounded-[12px] px-4">
                    車両
                </TabsTrigger>
                <TabsTrigger value="equipment" className="rounded-[12px] px-4">
                    備品台帳
                </TabsTrigger>
            </TabsList>
            <TabsContent value="vehicles" className="mt-6 outline-none">
                {vehiclesTab}
            </TabsContent>
            <TabsContent value="equipment" className="mt-6 outline-none">
                {equipmentTab}
            </TabsContent>
        </Tabs>
    );
}
