import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
    title: {
        template: "%s | 株式会社信越報知",
        default: "株式会社信越報知 社員・資格管理システム",
    },
    description: "株式会社信越報知 社員・資格・車両などの管理ツール",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={noto.className}>
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
