// 業務アラートのメール通知は運用対象外です。
// 既にデプロイ済みの Edge Function が手動実行されてもメール送信しないよう、
// 410 Gone を返す安全装置として残しています。

Deno.serve(() => new Response(
    JSON.stringify({
        ok: false,
        disabled: true,
        message: "メール通知機能は運用対象外のため無効化されています。期限はアプリ内ダッシュボードで確認してください。",
    }),
    {
        status: 410,
        headers: { "Content-Type": "application/json" },
    },
));
