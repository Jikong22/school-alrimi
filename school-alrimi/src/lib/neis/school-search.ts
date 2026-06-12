"use server";

export interface School {
  schoolName: string;
  schoolCode: string;
  region: string;
  schoolKind: string;
}

interface NeisSchoolRow {
  SCHUL_NM: string;
  SD_SCHUL_CODE: string;
  ATPT_OFCDC_SC_NM: string;
  SCHUL_KND_SC_NM: string;
}

interface NeisResponse {
  schoolInfo?: [
    { head: Array<{ list_total_count: number } | { RESULT: { CODE: string; MESSAGE: string } }> },
    { row: NeisSchoolRow[] }
  ];
  RESULT?: { CODE: string; MESSAGE: string };
}

/**
 * Search schools via NEIS schoolInfo API.
 * Returns up to 20 results. Empty keyword returns empty array.
 */
export async function searchSchools(keyword: string): Promise<School[]> {
  if (!keyword || keyword.trim().length < 2) {
    return [];
  }

  const url = new URL("https://open.neis.go.kr/hub/schoolInfo");
  url.searchParams.set("Type", "json");
  url.searchParams.set("SCHUL_NM", keyword.trim());
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "20");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return [];
  }

  const data: NeisResponse = await res.json();

  // Error or empty result envelope
  if (data.RESULT) {
    const code = data.RESULT.CODE;
    if (code === "INFO-200" || code === "INFO-100") {
      return [];
    }
    console.error("NEIS schoolInfo error:", code, data.RESULT.MESSAGE);
    return [];
  }

  const schoolInfo = data.schoolInfo;
  if (!schoolInfo || schoolInfo.length < 2) {
    return [];
  }

  const rows = schoolInfo[1]?.row ?? [];

  return rows.map((row) => ({
    schoolName: row.SCHUL_NM,
    schoolCode: row.SD_SCHUL_CODE,
    region: row.ATPT_OFCDC_SC_NM,
    schoolKind: row.SCHUL_KND_SC_NM,
  }));
}
