import { describe, expect, it } from "vitest";
import { buildDailyAlerts, type QualificationAlertRow } from "@/lib/jobs/daily-alert";

function createQualificationRow(overrides: Partial<QualificationAlertRow> = {}): QualificationAlertRow {
    return {
        expiry_date: "2026-04-20",
        status: "未着手",
        employees: {
            name: "山田 太郎",
            branch: "長野",
        },
        qualification_master: {
            name: "消防設備士甲種4類",
        },
        ...overrides,
    };
}

describe("buildDailyAlerts", () => {
    it("classifies rows by remaining days and derives the email targets", () => {
        const now = new Date("2026-04-18T00:00:00+09:00");
        const rows = [
            createQualificationRow({ expiry_date: "2026-04-10" }),
            createQualificationRow({ expiry_date: "2026-04-25" }),
            createQualificationRow({ expiry_date: "2026-05-10" }),
            createQualificationRow({ expiry_date: "2026-06-01" }),
            createQualificationRow({ expiry_date: "2026-07-25" }),
        ];

        const result = buildDailyAlerts(rows, now);

        expect(result.alerts).toHaveLength(4);
        expect(result.emailAlerts).toHaveLength(3);
        expect(result.breakdown).toEqual({
            critical: 1,
            urgent: 1,
            warning: 1,
            info: 1,
        });
    });

    it("skips rows without expiry dates and falls back for missing relation values", () => {
        const now = new Date("2026-04-18T00:00:00+09:00");
        const rows = [
            createQualificationRow({
                expiry_date: null,
            }),
            createQualificationRow({
                expiry_date: "2026-05-01",
                employees: null,
                qualification_master: null,
                status: null,
            }),
        ];

        const result = buildDailyAlerts(rows, now);

        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0]).toMatchObject({
            employeeName: "不明",
            branch: null,
            qualificationName: "不明",
            status: null,
        });
    });
});
