#!/usr/bin/env node
/**
 * Supabase 認証の確認とデモユーザーの作成。
 *
 * 事前: app/.env.local またはプロジェクトルートの .env.local に以下を設定
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY （create-demo のみ必須）
 *
 * 例（app ディレクトリで）:
 *   node --env-file=.env.local scripts/auth-cli.mjs verify ayumu@example.com 'secret'
 *   node --env-file=../../.env.local scripts/auth-cli.mjs verify ayumu@example.com 'secret'
 *
 *   node --env-file=.env.local scripts/auth-cli.mjs create-demo demo@client.example.com 'TempPass123!' technician
 *
 * パスワードを argv に渡したくない場合:
 *   VERIFY_EMAIL=... VERIFY_PASSWORD=... node --env-file=.env.local scripts/auth-cli.mjs verify
 */

import { createClient } from "@supabase/supabase-js";

const [,, cmd, ...rest] = process.argv;

function norm(value) {
    return (value ?? "").trim();
}

const url = norm(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = norm(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const serviceRoleKey = norm(process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify(email, password) {
    if (!url || !anonKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        process.exit(1);
    }
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error("Login failed:", error.message);
        process.exit(1);
    }
    console.log("OK: signed in as", data.user.email, "| user id:", data.user.id);
    await supabase.auth.signOut();
}

async function createDemo(email, password, role) {
    if (!url || !serviceRoleKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }
    if (!["admin", "hr", "technician"].includes(role)) {
        console.error("role must be admin, hr, or technician");
        process.exit(1);
    }
    const admin = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (createErr) {
        console.error("auth.admin.createUser failed:", createErr.message);
        process.exit(1);
    }
    const uid = created.user.id;
    const { error: roleErr } = await admin.from("user_roles").upsert(
        { id: uid, role },
        { onConflict: "id" },
    );
    if (roleErr) {
        console.error("user_roles upsert failed:", roleErr.message);
        process.exit(1);
    }
    console.log("OK: demo user ready");
    console.log("  email:", email);
    console.log("  role:", role);
    console.log("  user id:", uid);
}

function printUsage() {
    console.error(`Usage:
  verify:   node scripts/auth-cli.mjs verify <email> <password>
            or VERIFY_EMAIL=... VERIFY_PASSWORD=... node scripts/auth-cli.mjs verify

  create:   node scripts/auth-cli.mjs create-demo <email> <password> [admin|hr|technician]
            default role: technician`);
}

(async () => {
    try {
        if (cmd === "verify") {
            const email = rest[0] ?? norm(process.env.VERIFY_EMAIL);
            const password = rest[1] ?? process.env.VERIFY_PASSWORD ?? "";
            if (!email || !password) {
                printUsage();
                process.exit(1);
            }
            await verify(email, password);
            return;
        }
        if (cmd === "create-demo") {
            const email = rest[0] ?? norm(process.env.DEMO_EMAIL);
            const password = rest[1] ?? process.env.DEMO_PASSWORD ?? "";
            const role = rest[2] || norm(process.env.DEMO_ROLE) || "technician";
            if (!email || !password) {
                printUsage();
                process.exit(1);
            }
            await createDemo(email, password, role);
            return;
        }
        printUsage();
        process.exit(1);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
