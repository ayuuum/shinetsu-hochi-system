import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            ok: false,
            disabled: true,
            message: "メール通知機能は運用対象外のため無効化されています。",
        },
        { status: 410 }
    );
}
