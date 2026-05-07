# Supabase Auth メールテンプレート

このファイルは、Supabase Dashboard の Authentication メールテンプレートへ貼り付けるための文面です。

業務アラートのメール通知は使いませんが、ログインに必要な招待メール・パスワード再設定メールは使います。

## 設定場所

1. Supabase Dashboard を開きます。
2. 対象プロジェクトを選択します。
3. `Authentication` → `Email Templates` を開きます。
4. `Invite user` と `Reset password` を下記の日本語テンプレートに置き換えます。
5. `Authentication` → `URL Configuration` でリダイレクトURLを確認します。

## Redirect URL

本番環境:

```text
https://<本番ドメイン>/auth/callback
```

ローカル検証:

```text
http://localhost:3000/auth/callback
```

`Site URL` は本番ドメインに設定してください。ローカルURLは `Redirect URLs` に追加します。

## Invite user

件名:

```text
【信越報知システム】アカウント招待のお知らせ
```

本文:

```html
<p>信越報知システムのアカウントが作成されました。</p>

<p>下のボタンからパスワードを設定し、ログインを開始してください。</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;background:#24382c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
    パスワードを設定する
  </a>
</p>

<p>ボタンが開けない場合は、以下のURLをブラウザに貼り付けてください。</p>

<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

<p>このメールに心当たりがない場合は、管理者へご連絡ください。</p>
```

## Reset password

件名:

```text
【信越報知システム】パスワード再設定のご案内
```

本文:

```html
<p>信越報知システムのパスワード再設定を受け付けました。</p>

<p>下のボタンから新しいパスワードを設定してください。</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 18px;background:#24382c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
    パスワードを再設定する
  </a>
</p>

<p>ボタンが開けない場合は、以下のURLをブラウザに貼り付けてください。</p>

<p><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>

<p>リンクの有効期限が切れている場合は、ログイン画面の「パスワードを忘れた場合」から再度お試しください。</p>

<p>この操作に心当たりがない場合は、このメールを破棄してください。</p>
```

## 運用メモ

- 通常の新規ユーザー登録は、アプリの `ユーザー管理` から招待します。
- CLIでのユーザー作成は、初期パスワードを管理者が直接指定したい場合の例外運用です。
- 認証メールと業務アラートメールは別物です。業務アラートメールは使いません。
