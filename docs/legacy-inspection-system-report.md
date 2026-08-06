# 保守点検業務支援システム（レガシー）調査レポート

**調査日**: 2026年8月6日  
**調査対象**: `/Users/ayumu/Downloads/shinetsuhochi.zip` 展開先 `legacy-src/shinetsuhochi/`  
**調査方法**: ソースコード・DBバックアップ・CSV・帳票テンプレート（`.tlf`）の静的解析（ローカル起動は未実施）

---

## 1. エグゼクティブサマリー

| 項目 | 内容 |
|------|------|
| システム名 | 保守点検業務支援システム（信越報知、2014年頃開発） |
| 技術スタック | Ruby on Rails 4.1.4 / MySQL / ThinReports / jQuery 1.x |
| 業務領域 | 消防設備等の点検契約管理・予定/実績・補修・帳票出力 |
| 本番年度（バックアップより） | 2026/05/01〜2027/04/30（5月開始年度） |
| 現行リポジトリとの関係 | **別システム**。本リポジトリの Next.js + Supabase（社員・資格管理）とは独立 |

**完成度評価（コードベース調査）**

| 観点 | 達成度 | 備考 |
|------|--------|------|
| 画面・機能網羅 | **100%** | 全33コントローラを読解 |
| DBスキーマ・データ規模 | **95%** | backup SQL + CSV から確認。schema.rb は古い |
| 帳票レイアウト | **90%** | `.tlf` フィールド定義まで確認。実PDF目視は未実施 |
| バリデーション | **95%** | JS + サーバー両方。一部はコントローラ内インライン |
| 再実装PRDたたき台 | **85%** | 運用・非機能（性能・セキュリティ監査）は別途 |

---

## 2. システム構成

### 2.1 ディレクトリ概要

```
legacy-src/shinetsuhochi/
├── app/controllers/     # 33画面コントローラ
├── app/models/          # ActiveRecordモデル（m_* マスタ, t_* トランザクション）
├── app/views/           # ERB + ThinReports .tlf
├── app/extras/common_util.rb  # 共通ロジック（年度・PDF・バックアップ等）
├── db/backup/           # MySQLダンプ（本番相当）
├── db/csv/              # テーブルCSVエクスポート
├── public/pdf/          # 生成PDFキャッシュ（約2GB）
└── app/backrestore/     # backup.sh / restore.sh / autobackup.sh
```

### 2.2 認証・ロール

| ロール | urole | ログイン | セッションキー |
|--------|-------|----------|----------------|
| 管理者 | 0 (`MPWD_UROLE_ADMIN`) | `admin_login` | `session[:user_id]` |
| 点検担当者 | 1 (`MPWD_UROLE_TENKEN`) | `tenken_login` | `session[:user_id_tenekn]` |
| システム | 2 (`MPWD_UROLE_SYSTEM`) | `system_login` → restore | なし（restoreへ直接遷移） |

- ID/パスワード: **4桁数字**（社内担当者は1000以上）
- 外注・個人・会社種別の担当者は **ID/パスワード不要**（帳票・選択肢にのみ使用）

### 2.3 年度ロジック

- 年度は **5月開始**（`m_inits.nendokaishiM = 5`、バックアップ上 `nendokaishiYMD = 2026/05/01`）
- `CommonUtil.konnendo`: `m_inits.tounenY` を現年度として使用
- `nendo_check`（点検担当者ログイン時）: 年度終了日を過ぎると `m_inits` の前/当/次年度を自動繰り上げ
- 点検予定月セレクト: 年度開始月から12ヶ月ローテーション（`get_kaishiM_selectbox_html`）

---

## 3. データモデル

### 3.1 主要テーブルと件数（2026/07 backup）

| テーブル | 件数 | 役割 |
|----------|------|------|
| `m_orderingpatries` | 943 | 発注者マスタ |
| `m_housinginfos` | 1,855 | 物件マスタ（点検区分・停止フラグ等） |
| `t_housinginfos` | 7,490 | 物件スナップショット（年度別） |
| `t_check_infos` | 12,409 | 点検契約情報（担当者・金額・次年度点検Y） |
| `t_chktrackrec_infos` | 12,407 | 点検実績（ステータス・完了日・備考） |
| `t_repair_infos` | 4,270 | 補修情報 |
| `m_checkpeople` | 67 | 点検担当者 |
| `m_pwd` | — | ログインユーザ（管理者・担当者・システム） |
| `m_inits` | 1 | 初期設定（ステータス名・年度・開始月） |
| `m_kinds` | — | 種別マスタ（担当者種別・設備・点検種別等） |
| `m_sysstatus` | 1 | メンテナンスフラグ（0=メンテ中） |

### 3.2 エンティティ関係（概念）

```
m_orderingpatries (発注者)
        │
        ▼
m_housinginfos (物件M) ── tenkenKbn, teishiFlg, saishusakuseiY
        │
        ├── t_housinginfos (物件T・年度別)
        ├── t_check_infos (点検契約・年度×種別×回数)
        │         │
        │         └── t_chktrackrec_infos (点検実績)
        │                   │
        │                   └── t_repair_infos (補修・hoshukanrenumuで紐付)
        └── m_checkpeople (担当者)
                  └── m_pwd (社内のみログイン)
```

### 3.3 種別定数（`application_controller.rb`）

**点検種別（tenkenshubetu）**

| コード | 名称 | 設備種別 | 備考 |
|--------|------|----------|------|
| 11 | 消防設備(総合) | 1 防火設備 | 2回選択時12(機器)を自動生成 |
| 12 | 消防設備(機器) | 1 | 11の2回目。UI上は11と同一行 |
| 21 | 防火対象物 | 2 | 防火対象物点検回数フィールドあり |
| 31-36 | ITV/電話/音響/連結送水管/地下タンク/その他 | 3 | 1回or2回 |

**点検区分（tenkenKbn）**: 1=毎年, 2=2年に1回, 3=3年に1回, 4=スポット  
**請求方法**: 1=一括, 2=分割, 3=随時

**点検ステータス（tenkenstatus）**: 1〜5（名称は `m_inits.tenkenmei1〜5` でカスタマイズ）  
**補修ステータス（hoshuStatus）**: 0〜6（名称は `m_inits.hoshustatusmei1〜6`）

---

## 4. 画面一覧と権限マトリクス

凡例: ●=利用可 ○=限定利用 ×=不可

| # | コントローラ | 画面名 | 管理者 | 点検担当 | システム | 備考 |
|---|-------------|--------|--------|----------|----------|------|
| 1 | `index` | トップ（入口） | ● | ● | ● | |
| 2 | `admin_login` | 管理者ログイン | ● | × | × | |
| 3 | `tenken_login` | 点検担当者ログイン | × | ● | × | `nendo_check` あり |
| 4 | `system_login` | システムログイン | ●* | × | ● | 管理者メニューから。restoreへ |
| 5 | `admin_menu` | 管理者メニュー | ● | × | × | 次年度更新バッチ |
| 6 | `yotei_admin` | 点検予定/実績一覧（管理） | ● | × | × | 全機能 |
| 7 | `yotei` | 点検予定/実績一覧（担当） | × | ● | × | **自分担当分のみ** |
| 8 | `jiseki_toroku` | 実績登録ポップアップ | ● | ● | × | |
| 9 | `jiseki_toroku_kanryo` | 実績登録完了 | ● | ● | × | |
| 10 | `buken_toroku` | 物件登録 | ● | × | × | |
| 11 | `buken_toroku_kanryo` | 物件登録完了 | ● | × | × | |
| 12 | `buken_kensaku` | 物件検索 | ● | × | × | 変更/削除/再利用/参照 |
| 13 | `buken_kensaku_pop` | 物件検索（ポップアップ） | ● | × | × | 実績登録等から |
| 14 | `buken_henko_sakujo` | 物件変更・停止 | ● | × | × | |
| 15 | `buken_henko_kanryo` | 物件変更/削除/停止完了 | ● | × | × | MD5改ざん防止 |
| 16 | `buken_joho_shosai` | 物件詳細参照 | ● | × | × | 帳票出力含む |
| 17 | `hachusha_kensaku` | 発注者検索 | ● | × | × | |
| 18 | `tenken_toroku` | 点検担当者登録 | ● | × | × | |
| 19 | `tenken_toroku_kanryo` | 担当者登録完了 | ● | × | × | |
| 20 | `tenken_henko_sakujo` | 担当者変更・削除 | ● | × | × | 論理削除(sakujyoFlg) |
| 21 | `tenken_henko_kanryo` | 担当者変更完了 | ● | × | × | |
| 22 | `tenken_sakujo_kanryo` | 担当者削除完了 | ● | × | × | |
| 23 | `initialization` | 初期設定 | ● | × | × | ST名称・年度 |
| 24 | `admin_pass` | 管理者PW変更 | ● | × | × | |
| 25 | `monthlist` | 月別件数一覧 | ● | × | × | PDF |
| 26 | `hachulist` | 発注者別一覧 | ● | × | × | PDF |
| 27 | `tantolist` | 担当者別一覧 | ● | × | × | PDF |
| 28 | `setsubilist` | 設備種別一覧 | ● | × | × | PDF |
| 29 | `hoshurireki` | 補修履歴 | ●/○ | ●/○ | × | login_checkコメントアウト |
| 30 | `restore` | リストア選択 | ● | × | ● | system_login経由 |
| 31 | `maintenance` | メンテナンス/リストア実行 | ● | × | ● | sstatus=0中 |
| 32 | `maintenance` (index) | メンテナンス表示 | 全員 | 全員 | 全員 | `mainte_check` でリダイレクト |

\* 管理者は通常 `admin_login` 経由。restore は `system_login` で別認証。

### 4.1 管理者 vs 点検担当者の機能差（yotei）

| 機能 | yotei_admin | yotei |
|------|-------------|-------|
| 検索条件 | 8項目フル | 担当者は**ログインユーザ固定** |
| 初期表示 | 全件 | **当月予定 + 自分担当** |
| ステータス一括変更 | ● | ×（読取中心） |
| 実績登録 | ● | ● |
| 帳票出力 | ● | ●（検索結果ベース） |
| レイアウト | `menu` | `normal3` |

---

## 5. コア業務フロー

### 5.1 物件登録（`buken_toroku`）

**INSERT連鎖（新規）**

1. `m_orderingpatries` — 発注者（新規 or 既存）
2. `m_housinginfos` — 物件M（tenkenkaishiY, tenkenKbn, teishiFlg=0）
3. `t_housinginfos` — 当年度スナップショット
4. `t_check_infos` — 選択種別×回数分
5. `t_chktrackrec_infos` — 各契約行に対応する実績行（status=1）

**消防設備の特殊ルール**

- 種別11を「総合･機器(2回)」選択 → 11(1回目) + 12(2回目) の2レコード
- 消防設備のみ担当者10名・外注費10枠。他種別は3名

**再利用（`buken_kensaku` → 再利用）**

- 条件: `m_housinginfos.teishiFlg = 1`（停止物件のみ）
- `buken_toroku/index/:bukenCode/:hachushaCode` へ遷移し、停止物件を新年度契約として再登録

### 5.2 物件変更・停止・削除（`buken_henko_sakujo` / `buken_henko_kanryo`）

| 操作 | 処理概要 |
|------|----------|
| 発注者変更 | M更新 or 新規M + T物件/T点検のhachushaCode付替 |
| 物件情報変更 | M/T物件更新 + `jinendotenkenY` 再計算（スポット=当年度、他=nendo+tenkenKbn） |
| 点検情報変更 | 選択種別 DELETE → INSERT（実績は track_id 有無で UPDATE/INSERT） |
| 点検情報追加 | 指定年度に未登録種別のみ INSERT |
| 点検情報削除 | 選択種別の t_check + t_chktrackrec 削除 |
| 点検停止 | 指定年度以降の t_check/t_chktrackrec 削除 + M.teishiFlg=1, tenkenteishiY=nendo |
| 物件削除 | MD5検証後、発注者孤立判定 → カスケード DELETE（実績・補修含む） |

### 5.3 点検予定/実績一覧（`yotei_admin`）

**検索8項目**

1. 年度（前/当/翌/3年連続）
2. 点検予定月
3. 点検実施月（完了日の月）
4. 点検担当者
5. 物件名（部分一致）
6. 設備種別（必須）
7. 点検ステータス（複数）
8. 補修ステータス（複数）

**一覧1行キー**: `bukenCode_nendo_setubishubetu_tenkenshubetu_edaban`（実績登録・更新に使用）

**一括更新ルール**

- 点検ST: 3/4/5 のみ変更可。順序逆転不可（MESSAGE_46）
- 補修ST: 2/4/5/6 のみ変更可。順序逆転不可（MESSAGE_47）

**来年度表示**: 当年度+1のデータが無い場合、SQLを切替えて翌年度予定を算出

### 5.4 実績登録・補修（`jiseki_toroku`）

- ポップアップ（`window.open`）で1行選択後に起動
- 登録項目: 点検完了日、契約金額、外注費、人工、点検ST、補修有無、補修ST/完了日/内容
- `hoshukanrenumu`: 補修行の連番。0=補修なし、>0= t_repair_infos へ JOIN
- 検索条件と不一致の行は commit 後に DOM から除去（MESSAGE_91）
- ST=完了以外で完了日入力 → 自動クリア（MESSAGE_89/90）

### 5.5 次年度更新バッチ（`admin_menu`）

**トリガー**: 管理者メニュー「次年度データ作成」→ MD5(`konnendo`) 付きURLで `index/:hash`

**処理順**

1. `CommonUtil.autobackup` — 自動バックアップ
2. `update_by_year(jinenY)` — 翌年度データ INSERT
   - 対象: `jinendotenkenY = 翌年度` かつ `teishiFlg=0` かつ `tenkenKbn < 4`（スポット除外）
   - t_housinginfos / t_chktrackrec_infos / t_check_infos（種別21は別SQL）
   - m_housinginfos.saishusakuseiY 更新
3. `delete_old_data` — **`nendo < konnendo - 2`** の t_check / t_chktrackrec を物理削除

> 注意: 確認ダイアログは「(konnendo-2)年度より前を削除」と表示。実装は `nendo < konnendo - 2` なので **3年分保持**（当・前・前前）

### 5.6 バックアップ・リストア

| 操作 | 実装 |
|------|------|
| 自動バックアップ | cron → `autobackup.sh` |
| 手動バックアップ | `backup.sh` → `db/backup/YYYY/MM/YYYYMMDDHHmm.sql` |
| リストア | restore画面 → maintenance → backup → restore.sh |
| メンテ中 | `m_sysstatus.sstatus=0` → 全画面 `maintenance` へ |

---

## 6. 帳票（ThinReports 8種）

| # | テンプレート | コントローラ | 用紙 | 主なフィールド |
|---|-------------|-------------|------|----------------|
| 1 | `yotei_admin/report_yotei.tlf` | yotei_admin, yotei | A4横 | 年度/検索条件/発注者/物件/種別/担当/ST/完了日/補修/備考 |
| 2 | `monthlist/monthlist.tlf` | monthlist | A4 | 月別件数集計 |
| 3 | `hachulist/hachulist.tlf` | hachulist | A4 | 発注者別一覧 |
| 4 | `tantolist/tantoshalist.tlf` | tantolist | A4 | 担当者別一覧 |
| 5 | `setsubilist/setsubilist.tlf` | setsubilist | A4 | 設備種別一覧 |
| 6 | `buken_joho_shosai/buken_sansho.tlf` | buken_joho_shosai | A4 | 物件参照票 |
| 7 | `buken_joho_shosai/tenken_hoshu.tlf` | buken_joho_shosai | A4 | 点検・補修一覧（物件詳細） |
| 8 | `hoshurireki/hoshurireki.tlf` | hoshurireki | A4 | 補修履歴 |

**report_yotei 詳細レイアウト**（`.tlf` 解析）

- ヘッダ: タイトル「点検予定実績一覧」、出力日、ページ番号
- 検索条件表示: txtNendo, txtKensakuBukenmei, txtKensakuYoteituki, txtJishituki, txtKensakutantoshamei
- 明細列: txtHachushamei, txtBukenmei, txtTenkenshubetu, txtTenkenyoteituki, txtTantoshamei, txtTenkenstatus, txtTenkenkanryo, txtHoshustatus, txtHoshukanryo, txtHoshurireki, txtBikou
- フォント: IPAMincho
- PDF出力: `CommonUtil.open_pdf` → `public/pdf/{type}{uid}{timestamp}.pdf`

---

## 7. バリデーション一覧

### 7.1 物件登録 JS（`buken_toroku/index.html.erb`）

種別チェック ON 時に `select_check_2/3/4` で検証:

| ルール | 消防設備(2) | 3担当者種別(3) | その他(4) |
|--------|------------|----------------|-----------|
| 点検予定月必須 | ● | ● | ● |
| 契約金額必須 | ● | ● | ● |
| 1回目のみ時2回目予定月不可 | ● | — | ● |
| 担当者1名以上 or メイン担当必須 | ●(10枠) | ●(3枠) | ●(3枠) |
| 外注種別(◆)の外注費必須 | ● | ● | ● |
| 1回のみ時2回目外注費不可 | ● | — | — |

### 7.2 サーバー（`CommonUtil.buken_toroku_henshu_check`）

- 選択担当者の先頭桁 `sakujyoFlg=1`（削除済）ならエラー MESSAGE_19

### 7.3 担当者 CRUD

| 操作 | ルール |
|------|--------|
| 登録（社内） | 名前必須、ID=4桁数字≥1000、PW=4桁以上数字、重複チェック |
| 登録（外注等） | ID/PW入力不可（MESSAGE_31/32） |
| 変更 | 「選択」必須、削除済不可、社内ルール同上 |
| 削除 | 論理削除（sakujyoFlg=1）。MPwdも削除 |

### 7.4 物件検索

- 変更/参照/削除: ラジオ選択必須（MESSAGE_27）
- 変更: teishiFlg=1 不可（MESSAGE_51）
- 再利用: teishiFlg=1 **のみ**可（MESSAGE_82）
- 削除: MD5(bukenCode), MD5(hachushaCode) で改ざん防止

---

## 8. エッジケース・業務ルール

| ケース | 挙動 |
|--------|------|
| 点検停止 | 指定年度の t_check/t_chktrackrec 全削除 + M.teishiFlg=1 |
| 再利用 | 停止物件のみ。新規登録フローで再契約 |
| スポット(tenkenKbn=4) | jinendotenkenY=0。次年度バッチ対象外 |
| 3年保持 | 次年度更新時 `nendo < konnendo-2` を削除。t_housinginfos / t_repair は残る |
| 物件詳細の年度表示 | 過去3年分 + 来年度（コメント: buken_joho_shosai） |
| 削除済担当者 | セレクトに「×」表示。選択不可（JS+サーバー） |
| 外注担当者 | セレクトに「◆」表示。外注費入力必須 |
| メンテナンス | sstatus≠0 の間、業務画面は maintenance へ |
| 年度自動繰上 | 点検担当者ログイン時 nendo_check が m_inits を更新 |

---

## 9. 運用・インフラ

### 9.1 起動要件（調査時点で未構築）

- Ruby 2.x + Bundler 1.x + Rails 4.1.4
- MySQL（mysql2 gem 0.3.x — 現行macOSとの相性問題あり）
- ThinReports + IPAMincho フォント
- 本番相当データ: `db/backup/2026/07/202607301340.sql`

### 9.2 定期処理

- `app/backrestore/autobackup.cron` — 自動バックアップ
- 次年度更新 — 管理者が年度初めに手動実行（5月想定）

---

## 10. 現行システム（Next.js + Supabase）との対応

| レガシー | 現行リポジトリ | 備考 |
|----------|----------------|------|
| m_checkpeople / 資格 | Supabase employees / qualifications | 別ドメイン。統合要検討 |
| 点検契約・実績 | 未実装 | 新規開発対象 |
| 帳票PDF | 未実装 | ThinReports → 別PDFエンジンへ |
| 4桁数字PW | Supabase Auth | セキュリティ刷新必須 |

---

## 11. 再実装時の推奨フェーズ

1. **Phase 0**: DBスキーマ移植（PostgreSQL/Supabase）+ マスタ移行
2. **Phase 1**: 物件・発注者 CRUD + 次年度ロジック
3. **Phase 2**: 点検予定/実績一覧 + 実績登録 + 補修
4. **Phase 3**: 帳票8種 + バックアップ/リストア
5. **Phase 4**: 担当者管理 + 権限（RLS）

---

## 12. 調査上の残リスク（100%未到達の5%）

| 項目 | 理由 |
|------|------|
| 実PDF目視 | 環境未起動のため生成PDFのレイアウト崩れ未確認 |
| schema.rb | マイグレーション履歴と本番DDLの差異可能性 |
| 本番インフラ | サーバー構成・ネットワーク・cron実設定は ZIP 外 |
| 性能 | 1.2万件規模の検索SQLの実行計画未計測 |

---

## 付録A: コントローラファイル一覧

```
admin_login, admin_menu, admin_pass, application, buken_henko_kanryo,
buken_henko_sakujo, buken_joho_shosai, buken_kensaku, buken_kensaku_pop,
buken_toroku, buken_toroku_kanryo, hachulist, hachusha_kensaku,
hoshurireki, index, initialization, jiseki_toroku, jiseki_toroku_kanryo,
maintenance, monthlist, restore, setsubilist, system_login, tantolist,
tenken_henko_kanryo, tenken_henko_sakujo, tenken_login, tenken_sakujo_kanryo,
tenken_toroku, tenken_toroku_kanryo, update_crontab, yotei, yotei_admin
```

## 付録B: 主要ソースパス

| 用途 | パス |
|------|------|
| 定数・メッセージ | `app/controllers/application_controller.rb` |
| 共通ロジック | `app/extras/common_util.rb` |
| 次年度バッチ | `app/controllers/admin_menu_controller.rb` |
| 物件登録 | `app/controllers/buken_toroku_controller.rb` |
| 物件変更 | `app/controllers/buken_henko_sakujo_controller.rb` |
| 予定/実績（管理） | `app/controllers/yotei_admin_controller.rb` |
| 予定/実績（担当） | `app/controllers/yotei_controller.rb` |
| 実績登録 | `app/controllers/jiseki_toroku_controller.rb` |
| DBバックアップ | `db/backup/2026/07/202607301340.sql` |

---

*本レポートは Cursor エージェントによる静的コード解析結果です。*

**関連PRD**: リプレイス要件は [inspection-system-prd.md](./inspection-system-prd.md)、親PRDは [detailed_prd.md](../detailed_prd.md) §13 を参照。
