# TODOS

## P0 — 試作版デリバリー前に必須

### [TODO-001] 認証 + RLS 実装 — DEFERRED
- 試作版では認証なし。本番運用時に実装予定（招待制 or 管理者作成）

### [TODO-002] ~~Server Component 統一~~ ✅ DONE
- employees/page.tsx, qualifications/page.tsx → SC化。フィルタUIはCC子コンポーネントに分離

### [TODO-003] ~~Vitest + ドメインロジックテスト~~ ✅ DONE
- Vitest導入、qualification-logic 14テスト + alert-utils 14テスト = 28テストパス

### [TODO-004] ~~グローバル検索 (Cmd+K)~~ ✅ DONE
- cmdk導入、社員・資格・車両の横断検索、200msデバウンス、Cmd+Kショートカット

### [TODO-005] ~~アラートロジック共通化 + alert→toast 移行~~ ✅ DONE
- lib/alert-utils.ts に統合。全5ファイルの alert() → sonner toast.error() に移行。Toaster をルートlayoutに配置

## P1 — 本番運用前

### [TODO-006] ~~メール通知の日次バッチ~~ ✅ DONE
- Vercel Cron (毎朝7:00 JST) → API Route → Resend API でメール送信
- 4段階アラート（CRITICAL/URGENT/WARNING/INFO）、WARNING以上でメール
- 環境変数: RESEND_API_KEY, ALERT_EMAIL_TO, CRON_SECRET

### [TODO-007] ~~CLAUDE.md 作成~~ ✅ DONE
- app/CLAUDE.md 作成。テストコマンド、devサーバー(--webpack)、shadcn v4 Base UI render prop規約、Supabase接続、ディレクトリ構成、コーディング規約を記載

### [TODO-008] ~~PRD Section 6 (API設計) 更新~~ ✅ DONE
- Section 6を「データ取得・API設計」に変更。SC直接クエリパターンに合わせて簡素化。API RouteはCron+エクスポートのみ。Section 8の通知技術もResend APIに更新
