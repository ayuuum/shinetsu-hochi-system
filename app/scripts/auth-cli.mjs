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
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const [,, cmd, ...rest] = process.argv;

function norm(value) {
    return (value ?? "").trim();
}

function getRuntimeEnv() {
    return {
        url: norm(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anonKey: norm(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        serviceRoleKey: norm(process.env.SUPABASE_SERVICE_ROLE_KEY),
    };
}

async function verify(email, password) {
    const { url, anonKey } = getRuntimeEnv();
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

async function findUserByEmail(admin, emailNorm) {
    let page = 1;
    for (;;) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
            throw new Error(error.message);
        }
        const found = data.users.find((u) => (u.email ?? "").toLowerCase() === emailNorm);
        if (found) {
            return found;
        }
        if (data.users.length < 1000) {
            return null;
        }
        page += 1;
    }
}

async function createDemo(email, password, role) {
    const { url, serviceRoleKey } = getRuntimeEnv();
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

/** ローカル用 test@gmail.com / test1234（admin）。既存ならパスワード更新 + user_roles upsert */
async function ensureTestUser(overrideEnv = null) {
    const env = overrideEnv ?? getRuntimeEnv();
    const { url, serviceRoleKey } = env;
    if (!url || !serviceRoleKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }
    const testEmail = "test@gmail.com";
    const testPassword = "test1234";
    const role = "admin";
    const admin = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    let userId;
    try {
        const existing = await findUserByEmail(admin, testEmail.toLowerCase());
        if (!existing) {
            const { data: created, error: createErr } = await admin.auth.admin.createUser({
                email: testEmail,
                password: testPassword,
                email_confirm: true,
            });
            if (createErr) {
                console.error("auth.admin.createUser failed:", createErr.message);
                process.exit(1);
            }
            userId = created.user.id;
        } else {
            userId = existing.id;
            const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
                password: testPassword,
                email_confirm: true,
            });
            if (updateErr) {
                console.error("auth.admin.updateUserById failed:", updateErr.message);
                process.exit(1);
            }
        }
        const { error: roleErr } = await admin.from("user_roles").upsert(
            { id: userId, role },
            { onConflict: "id" },
        );
        if (roleErr) {
            console.error("user_roles upsert failed:", roleErr.message);
            process.exit(1);
        }
    } catch (e) {
        console.error(e.message || e);
        process.exit(1);
    }
    console.log("OK: test user ready (test@gmail.com / test1234, role admin)");
    console.log("  user id:", userId);
}

async function setupTestUser() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    let hasEnvFile = true;
    try {
        await access(envPath);
    } catch {
        hasEnvFile = false;
    }

    let env = getRuntimeEnv();
    if (!hasEnvFile || !env.url || !env.anonKey || !env.serviceRoleKey) {
        const rl = createInterface({ input, output });
        try {
            const url = env.url || norm(await rl.question("Supabase URL (https://xxxx.supabase.co): "));
            const anonKey = env.anonKey || norm(await rl.question("Anon key: "));
            const serviceRoleKey = env.serviceRoleKey || norm(await rl.question("Service role key: "));

            if (!url || !anonKey || !serviceRoleKey) {
                console.error("3つの値すべてが必要です。");
                process.exit(1);
            }

            const content = [
                `NEXT_PUBLIC_SUPABASE_URL=${url}`,
                `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
                `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
                "",
            ].join("\n");
            await writeFile(envPath, content, "utf8");
            console.log("OK: .env.local を作成しました");
            env = { url, anonKey, serviceRoleKey };
        } finally {
            rl.close();
        }
    }

    await ensureTestUser(env);
}

function printUsage() {
    console.error(`Usage:
  verify:   node scripts/auth-cli.mjs verify <email> <password>
            or VERIFY_EMAIL=... VERIFY_PASSWORD=... node scripts/auth-cli.mjs verify

  create:   node scripts/auth-cli.mjs create-demo <email> <password> [admin|hr|technician]
            default role: technician

  ensure-test: node scripts/auth-cli.mjs ensure-test
            test@gmail.com / test1234（admin）を作成または更新（本番・共有環境でも実行可）

  setup-test: node scripts/auth-cli.mjs setup-test
            .env.local が無ければ対話入力で自動作成し、そのまま test ユーザーを用意`);
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
        if (cmd === "ensure-test") {
            await ensureTestUser();
            return;
        }
        if (cmd === "setup-test") {
            await setupTestUser();
            return;
        }
        printUsage();
        process.exit(1);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
