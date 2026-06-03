/**
 * 同一免状（同じ社員 × 同じ免状番号）でまとめ、各資格がグループ内で
 * 「最新の免状」かどうかを判定するユーティリティ。
 *
 * 消防設備士・危険物取扱者など「1枚の免状に複数の資格区分」が載るケースで、
 * どれが最新版の免状かを把握するために使う。
 */

export interface LicenseGroupInfo {
    /** 同一免状グループに属する資格件数（自分を含む。常に2件以上） */
    groupSize: number;
    /** グループ内で最新（取得日が最も新しい）免状かどうか */
    isLatest: boolean;
}

export interface LicenseGroupInput {
    id: string;
    employee_id: string | null;
    certificate_number: string | null;
    acquired_date: string | null;
    created_at?: string | null;
}

// 新しいものを先頭に並べる比較関数（取得日 → 登録日時 → id の降順）。
// 取得日・登録日時が未設定（null）のものは空文字となり、末尾に並ぶ。
function compareByRecency(a: LicenseGroupInput, b: LicenseGroupInput): number {
    const aDate = a.acquired_date ?? "";
    const bDate = b.acquired_date ?? "";
    if (aDate !== bDate) return aDate < bDate ? 1 : -1;

    const aCreated = a.created_at ?? "";
    const bCreated = b.created_at ?? "";
    if (aCreated !== bCreated) return aCreated < bCreated ? 1 : -1;

    return a.id < b.id ? 1 : -1;
}

/**
 * 資格一覧から同一免状グループを算出し、資格ID→グループ情報のMapを返す。
 * 同一免状が1件のみ（＝グループを形成しない）の資格はMapに含めない。
 */
export function computeLicenseGroups<T extends LicenseGroupInput>(
    qualifications: T[],
): Map<string, LicenseGroupInfo> {
    const groups = new Map<string, T[]>();

    for (const qualification of qualifications) {
        const certificateNumber = qualification.certificate_number?.trim();
        if (!certificateNumber) continue;

        const key = `${qualification.employee_id ?? ""}::${certificateNumber}`;
        const existing = groups.get(key);
        if (existing) {
            existing.push(qualification);
        } else {
            groups.set(key, [qualification]);
        }
    }

    const result = new Map<string, LicenseGroupInfo>();
    for (const members of groups.values()) {
        if (members.length < 2) continue;

        const latestId = [...members].sort(compareByRecency)[0].id;
        for (const member of members) {
            result.set(member.id, {
                groupSize: members.length,
                isLatest: member.id === latestId,
            });
        }
    }

    return result;
}

/**
 * Server Component から Client Component へ渡せるよう、computeLicenseGroups の
 * 結果をプレーンなオブジェクト（資格ID→グループ情報）へ変換する。
 */
export function computeLicenseGroupRecord<T extends LicenseGroupInput>(
    qualifications: T[],
): Record<string, LicenseGroupInfo> {
    return Object.fromEntries(computeLicenseGroups(qualifications));
}
