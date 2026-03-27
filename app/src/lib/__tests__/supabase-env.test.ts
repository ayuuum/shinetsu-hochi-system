import { describe, expect, it } from "vitest";
import { normalizeSupabaseEnvValue } from "../supabase-env";

describe("normalizeSupabaseEnvValue", () => {
    it("removes literal escaped newlines from env values", () => {
        expect(normalizeSupabaseEnvValue("https://example.supabase.co\\n")).toBe(
            "https://example.supabase.co"
        );
    });

    it("trims actual whitespace around env values", () => {
        expect(normalizeSupabaseEnvValue("  anon-key  \n")).toBe("anon-key");
    });
});
