export function getLoginErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (
        normalized.includes("fetch")
        || normalized.includes("network")
        || normalized.includes("invalid url")
        || normalized.includes("failed to construct")
    ) {
        return "認証サーバーに接続できません。時間をおいて再試行してください。";
    }

    if (
        normalized.includes("invalid login credentials")
        || normalized.includes("invalid credentials")
        || normalized.includes("email not confirmed")
    ) {
        return "メールアドレスまたはパスワードが正しくありません。";
    }

    return "ログインに失敗しました。メールアドレスとパスワードをご確認ください。";
}

export function getPasswordResetRequestErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes("rate") || normalized.includes("too many")) {
        return "しばらく時間をおいてから再度お試しください。";
    }

    if (
        normalized.includes("fetch")
        || normalized.includes("network")
        || normalized.includes("failed")
    ) {
        return "認証サーバーに接続できません。時間をおいて再試行してください。";
    }

    return "送信に失敗しました。メールアドレスをご確認ください。";
}

export function getPasswordUpdateErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (
        normalized.includes("session")
        || normalized.includes("jwt")
        || normalized.includes("expired")
        || normalized.includes("invalid")
        || normalized.includes("not found")
    ) {
        return "再設定リンクの有効期限が切れている可能性があります。ログイン画面からもう一度やり直してください。";
    }

    if (
        normalized.includes("password")
        && (
            normalized.includes("weak")
            || normalized.includes("short")
            || normalized.includes("characters")
            || normalized.includes("minimum")
        )
    ) {
        return "パスワードが条件を満たしていません。8文字以上で入力してください。";
    }

    if (
        normalized.includes("fetch")
        || normalized.includes("network")
        || normalized.includes("failed")
    ) {
        return "認証サーバーに接続できません。時間をおいて再試行してください。";
    }

    return "パスワードの更新に失敗しました。時間をおいて再度お試しください。";
}
