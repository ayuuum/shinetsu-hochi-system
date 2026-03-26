import { describe, it, expect } from "vitest";

function generateCSVRow(values: string[]): string {
    return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
}

function generateCSV(headers: string[], rows: string[][]): string {
    return "\uFEFF" + [headers.join(","), ...rows.map(r => generateCSVRow(r))].join("\n");
}

describe("CSV Export Logic", () => {
    it("generates BOM prefix for Excel compatibility", () => {
        const csv = generateCSV(["名前"], [["テスト"]]);
        expect(csv.startsWith("\uFEFF")).toBe(true);
    });

    it("escapes double quotes in values", () => {
        const row = generateCSVRow(['値に"引用符"あり']);
        expect(row).toBe('"値に""引用符""あり"');
    });

    it("handles empty values", () => {
        const row = generateCSVRow(["", "テスト", ""]);
        expect(row).toBe('"","テスト",""');
    });

    it("generates correct header row", () => {
        const csv = generateCSV(["社員番号", "氏名", "フリガナ"], []);
        expect(csv).toContain("社員番号,氏名,フリガナ");
    });

    it("generates multiple data rows", () => {
        const csv = generateCSV(
            ["番号", "名前"],
            [["SH-001", "山田太郎"], ["SH-002", "鈴木花子"]]
        );
        const lines = csv.split("\n");
        expect(lines.length).toBe(3); // header + 2 data rows
    });

    it("handles commas in values", () => {
        const row = generateCSVRow(["松本市, 長野県"]);
        expect(row).toBe('"松本市, 長野県"');
    });
});
