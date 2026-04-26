"use client";

export function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-[#24382c] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b2c22]"
        >
            印刷 / PDF保存
        </button>
    );
}
