# CLAUDE.md — 株式会社信越報知 社員・資格管理システム

## プロジェクト概要

消防・電気設備会社「株式会社信越報知」の社員・資格・車両管理システム。
認証（Supabase Auth + RLS）実装済み。

## スタック

- **フレームワーク:** Next.js 16 App Router (React 19)
- **UI:** shadcn/ui v4 (Base UI) + Tailwind CSS v4
- **DB:** Supabase (`@supabase/ssr`)
- **テスト:** Vitest 4
- **フォント:** Noto Sans JP (next/font/google)
- **通知:** sonner (toast)。メール通知は運用対象外
- **検索:** cmdk (Cmd+K コマンドパレット)

## コマンド

```bash
npm run dev        # 開発サーバー (--webpack フラグ付き ※Turbopack非対応)
npm run build      # プロダクションビルド
npm run test       # Vitest 実行 (44テスト)
npm run test:watch # Vitest ウォッチモード
npm run lint       # ESLint
```

## Supabase 接続

- URL: `NEXT_PUBLIC_SUPABASE_URL` (.env.local)
- Anon Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (.env.local)
- クライアント: `src/lib/supabase.ts` (ブラウザ用)
- サーバー: `src/lib/supabase-server.ts` (`createSupabaseServer()`)

## ディレクトリ構成

```
src/
├── middleware.ts                # 認証チェック → /login リダイレクト
├── app/
│   ├── layout.tsx              # 最小ルートレイアウト (html/body/Toaster)
│   ├── login/page.tsx          # ログインページ
│   ├── (dashboard)/
│   │   ├── layout.tsx          # 認証シェル (Sidebar + Header + CommandSearch)
│   │   ├── page.tsx            # ダッシュボード
│   │   ├── error.tsx           # グローバルエラー境界
│   │   ├── loading.tsx         # グローバルローディング
│   │   ├── employees/          # 社員一覧 + 詳細 (ページネーション対応)
│   │   ├── qualifications/     # 資格・講習管理
│   │   ├── vehicles/           # 車両・備品管理
│   │   ├── alcohol-checks/     # アルコールチェック
│   │   └── import/             # データインポート
│   └── api/
│       ├── cron/daily-alert/   # 旧メール通知API（無効化済み）
│       └── export/             # CSV エクスポート API
│           ├── employees/route.ts
│           └── alcohol-checks/route.ts
├── components/
│   ├── ui/                     # shadcn/ui v4 コンポーネント
│   ├── shared/                 # 共有コンポーネント (DeleteConfirmDialog, TableSkeleton)
│   ├── employees/              # 社員関連モーダル・クライアント (CRUD完備)
│   ├── vehicles/               # 車両関連 (追加・編集・削除)
│   ├── alcohol/                # アルコール関連 (追加・編集・削除)
│   ├── qualifications/         # 資格関連クライアント
│   ├── app-sidebar.tsx         # サイドバーナビ (認証連動)
│   ├── command-search.tsx      # Cmd+K 検索パレット
│   └── search-trigger.tsx      # 検索トリガーボタン
├── hooks/
│   ├── use-auth.ts             # useAuth() フック (user, role, signOut)
│   └── use-mobile.ts           # モバイル検知フック
├── lib/
│   ├── supabase.ts             # ブラウザ Supabase クライアント
│   ├── supabase-server.ts      # サーバー Supabase クライアント
│   ├── supabase-middleware.ts  # Middleware用 Supabase クライアント
│   ├── qualification-logic.ts  # 資格期限計算ロジック
│   ├── alert-utils.ts          # アラートレベル判定
│   └── __tests__/              # テストファイル (44テスト)
│       ├── qualification-logic.test.ts
│       ├── alert-utils.test.ts
│       ├── csv-export.test.ts
│       └── validation.test.ts
└── types/
    └── supabase.ts             # DB型定義
```

## 重要な規約

### shadcn/ui v4 — Base UI (render prop パターン)

shadcn v4 は **Base UI** ベース。Radix の `asChild` ではなく `render` prop を使う。

```tsx
// ✅ 正しい (Base UI render prop)
<Button render={<Link href="/foo" />}>テキスト</Button>

// ❌ 間違い (Radix asChild — v4では使えない)
<Button asChild><Link href="/foo">テキスト</Link></Button>
```

### Select の onValueChange

Base UI の Select は `(value: string | null, event) => void` 型。

```tsx
// ✅ null を受け取る
onValueChange={(val: string | null) => setFilter(val ?? "all")}

// ❌ string のみだと型エラー
onValueChange={(val: string) => setFilter(val)}
```

### Server Component / Client Component

- 一覧ページ (`employees/page.tsx`, `qualifications/page.tsx`) は **Server Component**
- データ取得は SC 内で `createSupabaseServer()` 経由
- フィルタ等のインタラクティブ UI は `*-client.tsx` (Client Component) に分離
- SC → CC にデータを props で渡す
- ミューテーション後は `router.refresh()` で SC を再取得

### エラー表示

`alert()` は使わない。`sonner` の `toast.error()` を使う。

```tsx
import { toast } from "sonner";
toast.error("保存に失敗しました");
```

### アラートレベル

| レベル | 残日数 | 用途 |
|--------|--------|------|
| danger/critical | < 0 | 期限切れ |
| urgent | ≤ 14日 | 緊急 |
| warning | ≤ 30日 | 注意 |
| info | ≤ 60日 | 情報 |
| ok | > 60日 | 正常 |

### 消防設備士 期限計算

- 年度は 4月1日起算（1〜3月は前年度扱い）
- 初回: 免状交付日以降の最初の4/1から2年後の3/31
- 更新後: 直前の講習修了日以降の最初の4/1から5年後の3/31
- ロジック: `src/lib/qualification-logic.ts`

## 認証・認可

- Supabase Auth (email/password)
- `user_roles` テーブル: admin / hr / technician
- Middleware (`src/middleware.ts`) でセッションチェック → 未認証は `/login` へリダイレクト
- RLS: SELECT = 全認証ユーザー, INSERT/UPDATE/DELETE = admin + hr のみ
- `useAuth()` フック: user, role, isAdmin, isAdminOrHr, signOut
- マイグレーション: `supabase/migrations/20260326_auth_roles.sql`

### Auth CLI（認証確認・共有用デモユーザー）

`app/.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定。ユーザー作成には `SUPABASE_SERVICE_ROLE_KEY` も必要。

通常のユーザー追加は、管理者画面の `/admin/users` から招待メール方式で行う。CLI作成は、初期パスワードを管理者が直接指定する例外運用。

```bash
cd app
# ログイン可否（Supabase Auth へ直接 signIn）
npm run auth:verify -- you@example.com 'your-password'

# 共有用アカウント（Auth にユーザーを作り user_roles にロールを付与）
# 第4引数: admin | hr | technician（省略時 technician）
npm run auth:create-demo -- demo@client.example.jp 'InitialPassword123!' hr
```

手動運用: Supabase ダッシュボードの Authentication でユーザーを追加し、Table Editor の `user_roles` に同じ UUID で `role` を 1 行挿入してもよい。

Supabase Auth の招待メール・パスワード再設定メールは `docs/supabase-auth-email-templates.md` の日本語テンプレートをDashboardへ反映する。

## 既知の制約

- **Turbopack 非対応:** Next.js 16 + `next/font/google` で Turbopack エラー。`--webpack` で回避中。

## 開発規約（過去の失敗から）

### マイグレーションのタイムスタンプ命名
ファイル名は `YYYYMMDDHHMMSS_` 形式で作成する。依存関係がある場合は番号で順序を保証する。
```
✅ 20260326100000_create_inspection_schedules.sql
✅ 20260326200000_auth_roles.sql（↑に依存）
❌ 20260326_auth_roles.sql（アルファベット順で順序が不定）
```

### CLI出力のリダイレクト
外部CLIの出力をファイルに書く場合は `2>/dev/null` でstderrを分離する。
```bash
✅ npx supabase gen types typescript --linked 2>/dev/null > src/types/supabase.ts
❌ npx supabase gen types typescript --linked > src/types/supabase.ts
```

### 環境変数の設定（Vercel等）
`echo` ではなく `printf` を使い、末尾改行の混入を防ぐ。
```bash
✅ printf 'value' | vercel env add VAR_NAME production
❌ echo "value" | vercel env add VAR_NAME production
```

## 環境変数

| 変数 | 用途 | 必須 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Yes |
