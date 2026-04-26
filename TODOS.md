# TODOS

## PERF — 目標秒数到達のための実行TODO（2026-04-24）

### 性能ルール
- 新規一覧では `count: "exact"` を使わず、`PAGE_SIZE + 1` と `hasNextPage` を使う
- 表示していないタブやセクションのデータを初回に fetch しない
- 変化の少ないマスタ・一覧候補は `unstable_cache` を優先する
- `ilike` を使う一覧はアプリ実装だけで閉じず、index 方針までセットで検討する
- 重い dashboard / summary page は section 単位 `Suspense` を前提にする

### 目標秒数

| 画面 | 目標 |
|---|---|
| 全ページ共通遷移の体感開始 | **0.3秒以内** |
| ダッシュボード骨組み表示 | **0.4秒以内** |
| ダッシュボード主要カード表示 | **0.8秒以内** |
| ダッシュボード全表示 | **1.5秒以内** |
| 一覧ページ（社員 / 資格 / 車両 / アルコール / スケジュール） | **0.8秒以内** |
| 重い一覧ページ（工事 / 健康診断） | **1.2秒以内** |
| 詳細ページ | **1.0秒以内** |
| 重い詳細ページ | **1.5秒以内** |

### 計測ルール
- Chrome DevTools の Network + Performance で、ログイン済み状態からサイドバー遷移を計測する
- 各ページとも `1回目` と `2回目` を分けて記録する
- 計測値は `.context/plans/` 配下に日付つきメモで残す
- まず `2秒超のページをゼロにする`、次に `主要一覧を1秒前後へ寄せる`

## P0 — 全体遷移を1秒台に落とす

### [TODO-009] 共通 auth read path を軽量化
- 目的: 全ページ遷移の共通待ちを削減する
- 現状ボトルネック:
  - `app/src/app/(dashboard)/layout.tsx`
  - `app/src/lib/auth-server.ts`
  - `app/src/proxy.ts`
- 対応:
  - 表示用の `getFastAuthSnapshot()` を追加し、`auth.getUser()` をやめて `getSession()` + `user_roles` キャッシュに寄せる
  - mutation / 権限判定は strict path を維持する
  - `admin-user-actions.ts` / `setup-actions.ts` で `user-roles` invalidation を追加する
- 完了条件:
  - ダッシュボード配下のページ遷移で auth 待ちが主因にならない
  - 共通遷移の体感開始が **0.3秒以内** に近づく

### [TODO-010] ダッシュボードをカード単位でストリーミング
- 目的: `/` の白待ちをなくす
- 現状ボトルネック:
  - `app/src/app/(dashboard)/page.tsx`
  - `app/src/components/dashboard/dashboard-content.tsx`
- 対応:
  - `DashboardContent` の一括 `Promise.all` を分解する
  - hero / focus cards / task list / month schedule を別 server component に切る
  - `<Suspense>` をカード単位で張る
- 完了条件:
  - ダッシュボード骨組みが **0.4秒以内**
  - 主要カードが **0.8秒以内**
  - 全表示が **1.5秒以内**

### [TODO-011] 残り一覧ページの `count: "exact"` を撤去
- 目的: 一覧遷移の総件数計算待ちを消す
- 対象:
  - `app/src/app/(dashboard)/employees/page.tsx`
  - `app/src/app/(dashboard)/qualifications/page.tsx`
  - `app/src/app/(dashboard)/vehicles/page.tsx`
  - `app/src/app/(dashboard)/alcohol-checks/page.tsx`
- 対応:
  - `PAGE_SIZE + 1` 取得へ変更
  - `hasNextPage` でページネーション判定
  - 総ページ数表示をやめて `nページ` 表示へ統一
- 完了条件:
  - 社員 / 資格 / 車両 / アルコールの一覧が **0.8秒以内**
  - `2秒超` の一覧ページがゼロになる

### [TODO-012] 社員詳細を「表示タブだけ取得」に変更
- 目的: `/employees/[id]` の過剰取得を止める
- 現状ボトルネック:
  - `app/src/app/(dashboard)/employees/[id]/page.tsx`
- 対応:
  - 基本情報とタブ別データを分離する
  - `construction`, `health`, `it`, `seminars`, `qualifications` は表示時のみ取得
  - signed URL 生成は必要タブだけに限定する
- 完了条件:
  - 通常の社員詳細が **1.0秒以内**
  - 重い社員詳細でも **1.5秒以内**

## P1 — 重複取得と詳細ページの無駄を潰す

### [TODO-013] 資格詳細の重複 auth / role 取得を除去
- 目的: `/qualifications/[id]` の無駄な認証往復を消す
- 対象:
  - `app/src/app/(dashboard)/qualifications/[id]/page.tsx`
- 対応:
  - 既存の `getAuthSnapshot()` 結果を再利用し、ページ内の `auth.getUser()` + `user_roles` 再取得をやめる
  - certificate image の signed URL は並列化する
- 完了条件:
  - 資格詳細が **0.9秒以内**

### [TODO-014] 車両詳細 / 運用履歴 / 他詳細ページの取得量を監査
- 目的: detail 系に残る重いページを潰す
- 対象:
  - `app/src/app/(dashboard)/vehicles/[id]/page.tsx`
  - `app/src/app/(dashboard)/operations-log/page.tsx`
  - 印刷系ページ
- 対応:
  - 必要列のみに `select` を絞る
  - 画面に見えない集計や補助データは初回取得から外す
  - 取得の並列化と不要 await を見直す
- 完了条件:
  - detail 系の `2秒超` をゼロにする

## P2 — 計測と再発防止

### [TODO-015] 実測ベースラインを残す
- 目的: 「速くなった気がする」ではなく数字で追う
- 対応:
  - 以下のページの `初回 / 2回目` の計測結果を記録する
    - `/`
    - `/employees`
    - `/qualifications`
    - `/projects`
    - `/vehicles`
    - `/health-checks`
    - `/alcohol-checks`
    - `/schedule`
    - `/employees/[id]`
- 完了条件:
  - `.context/plans/perf-baseline-YYYY-MM-DD.md` が存在する
  - 修正前後の比較表が残っている

### [TODO-016] ページごとの性能ゲートを定義
- 目的: 後から遅く戻るのを防ぐ
- 対応:
  - `requirements.md` / `detailed_prd.md` の性能目標を現実的な目標秒数へ揃える
  - PR チェックリストに「新規一覧で exact count を使わない」「詳細で未表示タブを先読みしない」を追加する
- 完了条件:
  - 性能ルールがドキュメント化されている

### [TODO-017] build 問題を性能タスクから分離
- 目的: runtime の遅さと build 障害を混同しない
- 対応:
  - `next/font/google` の失敗を別 issue / 別 TODO に切り出す
  - 性能改善の検証は `tsc` と実ブラウザ計測を主に使う
- 完了条件:
  - build 問題が別トラックで管理される

## 進め方の順序

1. `[TODO-009]` auth 軽量化
2. `[TODO-010]` ダッシュボード分割
3. `[TODO-011]` exact count 撤去
4. `[TODO-012]` 社員詳細タブ別取得
5. `[TODO-013]` 資格詳細重複 auth 解消
6. `[TODO-015]` 実測比較

## 完了判定

- `2秒超` のページがゼロ
- 主要一覧が `0.8秒〜1.0秒` に収まる
- ダッシュボードの主要表示が `0.8秒以内`
- 重い詳細ページでも `1.5秒以内`

## Issue 化用バックログ

### PERF-001 共通 auth read path を軽量化する
- 対応TODO: `[TODO-009]`
- 優先度: `P0`
- 見積り: `M`
- 依存: なし
- ゴール:
  - `getFastAuthSnapshot()` を追加する
  - 表示系は fast path、mutation / 認可は strict path に分離する
  - `user_roles` 変更時の invalidation を入れる
- 対象ファイル:
  - `app/src/lib/auth-server.ts`
  - `app/src/app/(dashboard)/layout.tsx`
  - `app/src/app/actions/admin-user-actions.ts`
  - `app/src/app/actions/setup-actions.ts`
- 完了条件:
  - レイアウトで `auth.getUser()` を毎回呼ばない
  - role 変更後に表示権限が次回遷移で反映される

### PERF-002 ダッシュボードをカード単位でストリーミングする
- 対応TODO: `[TODO-010]`
- 優先度: `P0`
- 見積り: `M`
- 依存: `PERF-001`
- ゴール:
  - ダッシュボードの一括 `Promise.all` を解体する
  - hero / focus / task / schedule を別コンポーネントに分ける
  - 各カードに skeleton を付ける
- 対象ファイル:
  - `app/src/app/(dashboard)/page.tsx`
  - `app/src/components/dashboard/dashboard-content.tsx`
  - `app/src/components/dashboard/*`
- 完了条件:
  - 骨組みが `0.4秒以内`
  - 主要カードが `0.8秒以内`

### PERF-003 社員一覧を `hasNextPage` ベースに切り替える
- 対応TODO: `[TODO-011]`
- 優先度: `P0`
- 見積り: `S`
- 依存: なし
- ゴール:
  - `count: "exact"` をやめる
  - `PAGE_SIZE + 1` 取得へ変更する
  - `EmployeesClient` を `hasNextPage` 化する
- 対象ファイル:
  - `app/src/app/(dashboard)/employees/page.tsx`
  - `app/src/components/employees/employees-client.tsx`
- 完了条件:
  - `/employees` が `0.8秒以内`

### PERF-004 資格一覧を `hasNextPage` ベースに切り替える
- 対応TODO: `[TODO-011]`
- 優先度: `P0`
- 見積り: `M`
- 依存: なし
- ゴール:
  - 一覧本体の `count: "exact"` をやめる
  - badge counts は維持する
  - `QualificationsClient` を `hasNextPage` 化する
- 対象ファイル:
  - `app/src/app/(dashboard)/qualifications/page.tsx`
  - `app/src/components/qualifications/qualifications-client.tsx`
- 完了条件:
  - `/qualifications` が `0.8秒以内`

### PERF-005 車両一覧と備品一覧を `hasNextPage` ベースに切り替える
- 対応TODO: `[TODO-011]`
- 優先度: `P0`
- 見積り: `M`
- 依存: なし
- ゴール:
  - 車両一覧と備品一覧の両方から `count: "exact"` を外す
  - `VehiclesClient` と `EquipmentClient` の両方を `hasNextPage` 化する
- 対象ファイル:
  - `app/src/app/(dashboard)/vehicles/page.tsx`
  - `app/src/components/vehicles/vehicles-client.tsx`
  - `app/src/components/equipment/equipment-client.tsx`
- 完了条件:
  - `/vehicles` が `0.9秒以内`

### PERF-006 アルコールチェック一覧を `hasNextPage` ベースに切り替える
- 対応TODO: `[TODO-011]`
- 優先度: `P0`
- 見積り: `S`
- 依存: なし
- ゴール:
  - 一覧クエリの `count: "exact"` をやめる
  - `AlcoholClient` を `hasNextPage` 化する
- 対象ファイル:
  - `app/src/app/(dashboard)/alcohol-checks/page.tsx`
  - `app/src/components/alcohol/alcohol-client.tsx`
- 完了条件:
  - `/alcohol-checks` が `0.9秒以内`

### PERF-007 社員詳細を表示タブだけ取得する
- 対応TODO: `[TODO-012]`
- 優先度: `P0`
- 見積り: `L`
- 依存: `PERF-001`
- ゴール:
  - ベース情報とタブ別データを分離する
  - signed URL 生成を必要タブだけに限定する
- 対象ファイル:
  - `app/src/app/(dashboard)/employees/[id]/page.tsx`
  - `app/src/components/employees/employee-detail-client.tsx`
  - `app/src/lib/employee-detail.ts`
- 完了条件:
  - 通常の社員詳細が `1.0秒以内`
  - 重い社員詳細でも `1.5秒以内`

### PERF-008 資格詳細の重複 auth / role 取得を除去する
- 対応TODO: `[TODO-013]`
- 優先度: `P1`
- 見積り: `S`
- 依存: `PERF-001`
- ゴール:
  - ページ内の `auth.getUser()` + `user_roles` 再取得を削除する
  - 証書画像の signed URL 生成を並列化する
- 対象ファイル:
  - `app/src/app/(dashboard)/qualifications/[id]/page.tsx`
- 完了条件:
  - `/qualifications/[id]` が `0.9秒以内`

### PERF-009 detail 系ページの取得量を監査して軽量化する
- 対応TODO: `[TODO-014]`
- 優先度: `P1`
- 見積り: `M`
- 依存: `PERF-001`
- ゴール:
  - 車両詳細、運用履歴、印刷系ページの `select` と補助クエリを見直す
  - 不要データや表示外データを初回取得から外す
- 対象ファイル:
  - `app/src/app/(dashboard)/vehicles/[id]/page.tsx`
  - `app/src/app/(dashboard)/operations-log/page.tsx`
  - `app/src/app/(dashboard)/employees/[id]/**/*.tsx`
- 完了条件:
  - detail 系の `2秒超` がゼロ

### PERF-010 実測ベースラインを記録する
- 対応TODO: `[TODO-015]`
- 優先度: `P2`
- 見積り: `S`
- 依存: なし
- ゴール:
  - 修正前 / 修正後の計測フォーマットを固定する
  - `.context/plans/` に計測結果を残す
- 成果物:
  - `.context/plans/perf-baseline-YYYY-MM-DD.md`
- 完了条件:
  - 初回 / 2回目の比較表が存在する

### PERF-011 性能ルールをドキュメント化する
- 対応TODO: `[TODO-016]`
- 優先度: `P2`
- 見積り: `S`
- 依存: `PERF-003` から `PERF-009`
- ゴール:
  - 性能目標を `requirements.md` / `detailed_prd.md` に反映する
  - PRレビュー用ルールを明文化する
- 完了条件:
  - 「新規一覧で exact count を使わない」などのルールが残る

### PERF-012 build 問題を性能改善トラックから分離する
- 対応TODO: `[TODO-017]`
- 優先度: `P2`
- 見積り: `XS`
- 依存: なし
- ゴール:
  - `next/font/google` 由来の build 障害を別 issue として扱う
  - runtime performance の検証手順と切り分ける
- 完了条件:
  - build 障害と runtime 性能改善の管理が分離される

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

### [TODO-006] ~~メール通知の日次バッチ~~ ✅ SUPERSEDED
- 方針変更によりメール通知は運用対象外
- 期限確認はダッシュボード・一覧の画面内アラートで行う
- Cron/手動実行/API経由のメール送信は無効化済み

### [TODO-007] ~~CLAUDE.md 作成~~ ✅ DONE
- app/CLAUDE.md 作成。テストコマンド、devサーバー(--webpack)、shadcn v4 Base UI render prop規約、Supabase接続、ディレクトリ構成、コーディング規約を記載

### [TODO-008] ~~PRD Section 6 (API設計) 更新~~ ✅ DONE
- Section 6を「データ取得・API設計」に変更。SC直接クエリパターンに合わせて簡素化。メール通知は運用対象外に更新
