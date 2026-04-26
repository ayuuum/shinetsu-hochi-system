import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
    title: "操作マニュアル",
    description: "信越報知システムの配布用操作マニュアル",
};

const workerSteps = [
    "ログイン後、今日の作業ページを確認します。",
    "アルコールチェックから出勤時・退勤時の記録を入力します。",
    "マイプロフィールで自分の資格期限と基本情報を確認します。",
    "内容に誤りがある場合は管理者または人事担当者へ連絡します。",
];

const adminSections = [
    ["ダッシュボード", "資格期限、車両期限、アルコールチェックの未記録・不適正、今月の予定を確認します。"],
    ["社員台帳", "社員の登録・編集、資格、施工実績、健康診断、家族、保険、IT情報を管理します。"],
    ["資格・講習管理", "資格期限、講習履歴、証書画像、期限状態を確認・更新します。"],
    ["工事経歴", "施工実績を登録し、社員ごとの担当履歴やExcel出力を確認します。"],
    ["車両・備品", "車検、保険期限、修理履歴、事故履歴、備品台帳を管理します。"],
    ["健康診断管理", "受診履歴、健診種別、結果、医療機関を管理します。"],
    ["アルコールチェック", "日付・拠点・社員・判定で絞り込み、月次記録率を確認します。"],
    ["データインポート", "既存ExcelをCSVに変換し、社員データを一括登録します。"],
    ["ユーザー管理", "ログインユーザーの招待、権限変更、社員情報との紐づけを行います。"],
];

const csvColumns = [
    "社員番号",
    "氏名",
    "フリガナ",
    "生年月日",
    "性別",
    "電話番号",
    "メール",
    "住所",
    "入社日",
    "拠点",
    "雇用形態",
    "職種",
    "役職",
    "雇用保険番号",
    "保険証番号",
    "厚生年金番号",
];

export default function ManualPage() {
    return (
        <main className="min-h-screen bg-[#f4f1ea] text-[#1f2a24] print:bg-white">
            <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12 print:max-w-none print:p-0">
                <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
                    <Link href="/login" className="text-sm font-semibold text-[#32543d] underline underline-offset-4">
                        ログイン画面へ
                    </Link>
                    <PrintButton />
                </div>

                <article className="rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(31,42,36,0.12)] md:p-10 print:rounded-none print:p-0 print:shadow-none">
                    <header className="border-b border-[#d9d2c5] pb-8">
                        <p className="text-sm font-bold tracking-[0.24em] text-[#6f7b57]">SHINETSU HOCHI SYSTEM</p>
                        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">操作マニュアル</h1>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5e665b]">
                            この資料は、信越報知システムを利用する作業者、管理者、人事担当者向けの配布用マニュアルです。
                            ブラウザの印刷機能からPDFとして保存できます。
                        </p>
                        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#f4f1ea] p-4">
                                <dt className="font-bold text-[#6f7b57]">ログイン</dt>
                                <dd className="mt-1">全員共通</dd>
                            </div>
                            <div className="rounded-2xl bg-[#f4f1ea] p-4">
                                <dt className="font-bold text-[#6f7b57]">作業者</dt>
                                <dd className="mt-1">今日の作業・本人情報</dd>
                            </div>
                            <div className="rounded-2xl bg-[#f4f1ea] p-4">
                                <dt className="font-bold text-[#6f7b57]">管理者・人事</dt>
                                <dd className="mt-1">台帳管理・期限確認</dd>
                            </div>
                        </dl>
                    </header>

                    <section className="manual-section">
                        <h2>1. ログイン</h2>
                        <ol>
                            <li>ログイン画面を開きます。</li>
                            <li>メールアドレスとパスワードを入力します。</li>
                            <li>ログイン後、権限に応じて入口が自動で切り替わります。</li>
                        </ol>
                        <p>
                            作業者は「今日の作業」、管理者・人事は「ダッシュボード」へ移動します。
                            パスワードを忘れた場合は、ログイン画面の再設定機能を使用してください。
                        </p>
                    </section>

                    <section className="manual-section">
                        <h2>2. 作業者向けの使い方</h2>
                        <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
                            {workerSteps.map((step, index) => (
                                <div key={step} className="rounded-2xl border border-[#ded7ca] p-4">
                                    <p className="text-sm font-bold text-[#6f7b57]">STEP {index + 1}</p>
                                    <p className="mt-2 leading-7">{step}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="manual-section">
                        <h2>3. 管理者・人事向けの主な画面</h2>
                        <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
                            {adminSections.map(([title, description]) => (
                                <div key={title} className="rounded-2xl border border-[#ded7ca] p-4">
                                    <h3 className="text-lg font-black">{title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-[#5e665b]">{description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="manual-section">
                        <h2>4. 社員CSV移行手順</h2>
                        <ol>
                            <li>既存Excelを開き、必要な社員情報を整理します。</li>
                            <li>システムのデータインポート画面からテンプレートCSVをダウンロードします。</li>
                            <li>テンプレートの列に合わせてデータを貼り付けます。</li>
                            <li>ExcelからCSV形式で保存します。Excelファイルを直接アップロードしないでください。</li>
                            <li>CSVをアップロードし、事前チェック結果を確認します。</li>
                            <li>エラーがある場合は、エラーCSVを出力して修正します。</li>
                            <li>問題のない行だけを一括登録します。</li>
                        </ol>
                        <div className="mt-5 rounded-2xl bg-[#f4f1ea] p-4">
                            <h3 className="font-black">CSV対応列</h3>
                            <p className="mt-2 text-sm leading-7">
                                {csvColumns.join("、")}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-[#5e665b]">
                                必須列は、社員番号、氏名、フリガナ、生年月日、入社日、拠点です。
                                日付は YYYY-MM-DD または YYYY/M/D 形式にしてください。1回に取り込める上限は1,500行です。
                            </p>
                        </div>
                    </section>

                    <section className="manual-section">
                        <h2>5. 出力と印刷</h2>
                        <p>
                            社員台帳、資格、施工実績、アルコールチェックなどは画面ごとにCSV、Excel、印刷用ページを利用できます。
                            施工実績書の正式テンプレート対応は、既存様式の確認後に別途対応します。
                        </p>
                    </section>

                    <section className="manual-section">
                        <h2>6. 困ったとき</h2>
                        <ul>
                            <li>ログインできない場合は、メールアドレスとパスワードを確認し、必要に応じてパスワード再設定を行います。</li>
                            <li>メニューが表示されない場合は、権限が不足している可能性があります。</li>
                            <li>作業者の自分の情報が表示されない場合は、ユーザー管理で社員情報との紐づけを確認します。</li>
                            <li>期限や件数が想定と違う場合は、検索条件や絞り込み条件を解除して再確認します。</li>
                        </ul>
                    </section>

                    <footer className="mt-12 border-t border-[#d9d2c5] pt-5 text-sm text-[#5e665b]">
                        メールによる期限通知は運用対象外です。期限切れや期限間近の情報は、ダッシュボードと各一覧画面で確認してください。
                    </footer>
                </article>
            </div>
        </main>
    );
}
