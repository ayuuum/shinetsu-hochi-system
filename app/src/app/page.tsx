import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Users, Truck, Bell } from "lucide-react";

export default function Home() {
    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
                <p className="text-muted-foreground mt-2">現在、システムは正常に稼働しています。アラートを確認してください。</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">登録従業員数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">32名</div>
                        <p className="text-xs text-muted-foreground">+2 (今月)</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">期限切れ（要対応）</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">1件</div>
                        <p className="text-xs text-muted-foreground">田中 太郎 / 消防設備士</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">期限間近（30日以内）</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4件</div>
                        <p className="text-xs text-muted-foreground">鈴木、佐藤 他</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">車両車検・保険</CardTitle>
                        <Truck className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2件</div>
                        <p className="text-xs text-muted-foreground">松本 000 あ 12-34</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>直近の講習・更新スケジュール</CardTitle>
                        <CardDescription>今後60日以内に更新が必要な資格一覧です。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { name: "田中 太郎", qualification: "甲種第4類消防設備士 講習", date: "2026/04/15", status: "期限切れ", color: "text-destructive bg-destructive/10" },
                                { name: "鈴木 一郎", qualification: "第一種電気工事士 定期講習", date: "2026/05/20", status: "残り14日", color: "text-orange-600 bg-orange-100" },
                                { name: "山田 次郎", qualification: "消防設備士 免状写真更新", date: "2026/06/01", status: "残り30日", color: "text-orange-600 bg-orange-100" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold leading-none">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.qualification}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-sm font-medium">{item.date}</p>
                                        <span className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold rounded-full ${item.color}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>最新のシステム通知</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Bell className="w-5 h-5 text-primary shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">システムメンテナンスのお知らせ</p>
                                    <p className="text-xs text-muted-foreground mt-1">本日20:00〜21:00まで、バックアップ作業のため一時的にアクセスが不安定になる可能性があります。</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                                <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">新規社員の登録完了</p>
                                    <p className="text-xs text-muted-foreground mt-1">佐藤 恵子 様（パート・塩尻営業所）が登録されました。</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
