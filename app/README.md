## Shinetsu Hochi System

消防設備会社向けの社員・資格・車両・施工実績・健康診断・アルコールチェック管理アプリです。

### 主な機能

- 管理者・人事・作業者のロール別ホーム
- 社員台帳、資格・講習、車両・備品、施工実績、健康診断、年間予定表の管理
- 作業者向けの今日の作業ページとアルコールチェック記録
- 社員CSVインポート、各台帳のCSVエクスポート
- 画面内ダッシュボードアラート
- 印刷/PDF保存向けの公開マニュアル `/manual`

業務アラートのメール通知は運用対象外です。招待・パスワード再設定など Supabase Auth の認証メールのみ使用します。

### 開発

```bash
npm install
npm run dev
```

開発サーバーは webpack 固定です。Next.js 16 の Turbopack build はこの環境では停止することがあるため、本番ビルドも webpack に固定しています。

```bash
npm run build
npm run start
```

### テスト

```bash
npm run test
npm run test:e2e
npm run test:e2e:perf
```

作業者ログインの E2E は任意です。実行する場合は次の環境変数を設定します。

```bash
E2E_TECHNICIAN_EMAIL=...
E2E_TECHNICIAN_PASSWORD=...
```

### 運用メモ

- Supabase Auth の招待メール・再設定メールは `docs/supabase-auth-email-templates.md` の日本語テンプレートを Dashboard に設定してください。
- 作業者アカウントはユーザー管理画面で社員情報に紐づけてください。未紐づけの場合、作業者の `/me` は社員詳細へ遷移できません。
- 既存Excelデータは `.xlsx` を直接取り込まず、CSVに保存して社員インポート画面から取り込みます。
