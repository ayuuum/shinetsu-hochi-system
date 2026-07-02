# 与曽井様への返信（2026年6月）

**対応日:** 2026-06-17  
**対応内容:** `yosoi.k@shinetsuhochi.com` のロールを `hr` → `admin` に変更済み

---

## 送信メール（コピー用）

```
件名：Re: システム展開・管理者権限のご依頼について

株式会社信越報知
与曽井 様

いつもお世話になっております。
株式会社Amberの松井です。

ご連絡ありがとうございます。
追加機能のご確認、ならびに社全体での展開を
進めていただけるとのこと、承知いたしました。

■ 管理者権限の復旧について
ご利用中のアカウント（yosoi.k@shinetsuhochi.com）の権限を
「管理者」に変更いたしました。

お手数ですが、一度ログアウトのうえ、
再度ログインしていただけますでしょうか。
反映後、左メニューに「ユーザー管理」が表示されます。

■ アカウント権限の操作について
権限の付与・変更は、管理者アカウントから操作いただけます。

【ユーザー管理画面】
ログイン後 → 左メニュー「管理」→「ユーザー管理」
URL: https://shinetsu-hochi-system.vercel.app/admin/users

こちらから以下が可能です。
・新規ユーザーの追加（メールアドレス・初期パスワードの設定）
・権限の変更（管理者 / 人事 / 技術者）
・パスワードの再設定
・技術者アカウントと社員台帳の紐づけ

※ユーザー管理は「管理者」権限のみご利用いただけます。
　社員・協力会社の登録・編集は「管理者」「人事」の
　両方で操作可能です。

■ 社員一覧・協力会社台帳の作成について
以下の画面より登録を進めていただけます。

・社員一覧：「人員・資格」→「社員一覧」
  https://shinetsu-hochi-system.vercel.app/employees

・協力会社台帳：「人員・資格」→「協力会社台帳」
  https://shinetsu-hochi-system.vercel.app/partners

・CSV一括登録：「管理」→「データインポート」
  https://shinetsu-hochi-system.vercel.app/import

・操作マニュアル（ブラウザ閲覧・印刷可）
  https://shinetsu-hochi-system.vercel.app/manual

Excel等の既存データをお持ちの場合は、
CSV形式に変換のうえ「データインポート」から
一括登録いただくことも可能です。

■ 展開の進め方（ご提案）
1. 管理者アカウントで社員・協力会社データの登録
2. 必要に応じて人事担当者用アカウントの作成（権限：人事）
3. 現場作業者向けに技術者アカウントの作成・社員台帳との紐づけ

データ移行やアカウント作成でご不明な点がございましたら、
オンラインでの操作説明も可能です。
お気軽にお申し付けください。

引き続きよろしくお願いいたします。

株式会社Amber
松井 歩武
```

---

## 社内メモ

### 実施済み

| 項目 | 内容 |
|------|------|
| 権限変更 | `yosoi.k@shinetsuhochi.com` → `admin` |
| 実施日時 | 2026-06-17 |
| 本番URL | https://shinetsu-hochi-system.vercel.app |

### 現在のユーザー一覧（本番）

| メール | ロール |
|--------|--------|
| ayumu.matsui@amber-inc.com | admin |
| yosoi.k@shinetsuhochi.com | admin |
| iinuma@shinetsu-hochi.co.jp | hr |
| test@gmail.com | technician |

### 今後のCLIでの権限変更

```bash
cd app
# .env.local に SUPABASE_SERVICE_ROLE_KEY が必要
npm run auth:set-role -- yosoi.k@shinetsuhochi.com admin
```

または Supabase CLI:

```bash
supabase db query --linked "UPDATE public.user_roles SET role = 'admin' WHERE id = '<user-uuid>';"
```

### 残タスク

- [ ] 上記メールを与曽井様へ送信
- [ ] 再ログイン後に「ユーザー管理」が見えるか確認（任意：クライアントに依頼）
- [ ] 本番用パスワードの変更を推奨（セキュリティ）
