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
            <TabsList variant="line" className="h-auto border-b border-border/50 gap-0 pb-0 rounded-none w-full justify-start">
                <TabsTrigger value="vehicles" className="px-4 py-2.5 text-sm">
                    車両
                </TabsTrigger>
                <TabsTrigger value="equipment" className="px-4 py-2.5 text-sm">
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
