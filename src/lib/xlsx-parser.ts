import * as XLSX from "xlsx";

export interface ParsedLinkedInData {
  posts: Array<{
    postUrl: string;
    publishedAt: string;
    impressions: number;
    engagements: number;
    engagementRate: number;
  }>;
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    engagements: number;
  }>;
  followerMetrics: Array<{
    date: string;
    newFollowers: number;
  }>;
  demographicMetrics: Array<{
    category: string;
    value: string;
    percentage: number;
  }>;
}

export function parseLinkedInExcel(buffer: Buffer): ParsedLinkedInData {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  // 1. Parse Engagement sheet (Date, Impressions, Engagements)
  const engagementSheet = workbook.Sheets["ENGAGEMENT"];
  const engagementData: any[] = [];
  if (engagementSheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(engagementSheet, { header: 1 });
    // Row 0 is header: ['Date', 'Impressions', 'Engagements']
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row && row[0] !== undefined && row[0] !== null && String(row[0]).trim() !== "") {
        engagementData.push({
          date: parseExcelDate(row[0]),
          impressions: parseInt(row[1]) || 0,
          engagements: parseInt(row[2]) || 0,
        });
      }
    }
  }

  // 2. Parse Followers sheet (Date, New followers)
  const followersSheet = workbook.Sheets["FOLLOWERS"];
  const followersData: any[] = [];
  if (followersSheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(followersSheet, { header: 1 });
    // Row 0 is title e.g. "Total followers on...", Row 1 is empty, Row 2 is header ['Date', 'New followers']
    for (let i = 3; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row && row[0] !== undefined && row[0] !== null && String(row[0]).trim() !== "") {
        followersData.push({
          date: parseExcelDate(row[0]),
          newFollowers: parseInt(row[1]) || 0,
        });
      }
    }
  }

  // 3. Parse Demographics sheet (Top Demographics, Value, Percentage)
  const demographicsSheet = workbook.Sheets["DEMOGRAPHICS"];
  const demographicsData: any[] = [];
  if (demographicsSheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(demographicsSheet, { header: 1 });
    // Row 0 is header: ['Top Demographics', 'Value', 'Percentage']
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row && row[0] && row[1]) {
        const pctStr = String(row[2] || "0").trim();
        let percentage = 0;
        if (pctStr.includes("<")) {
          percentage = 0.5; // Represents "< 1%" as 0.5%
        } else {
          percentage = parseFloat(pctStr.replace("%", "")) || 0;
        }
        demographicsData.push({
          category: String(row[0]),
          value: String(row[1]),
          percentage: percentage,
        });
      }
    }
  }

  // 4. Parse Top Posts sheet (Post URL, Post Publish Date, Engagements, '', Post URL, Post Publish Date, Impressions)
  const topPostsSheet = workbook.Sheets["TOP POSTS"];
  const postsMap: { [url: string]: any } = {};
  if (topPostsSheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(topPostsSheet, { header: 1 });
    // Row 0: Title info
    // Row 1: Empty
    // Row 2: Headers: ['Post URL', 'Post Publish Date', 'Engagements', '', 'Post URL', 'Post Publish Date', 'Impressions']
    for (let i = 3; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row) continue;
      
      // Left side: sorted by engagements
      const urlL = row[0];
      const dateL = row[1];
      const engL = parseInt(row[2]) || 0;
      
      // Right side: sorted by impressions
      const urlR = row[4];
      const dateR = row[5];
      const impR = parseInt(row[6]) || 0;

      if (urlL && String(urlL).startsWith("http")) {
        const urlStr = String(urlL).trim();
        if (!postsMap[urlStr]) {
          postsMap[urlStr] = {
            postUrl: urlStr,
            publishedAt: parseExcelDate(dateL),
            engagements: engL,
            impressions: 0,
            engagementRate: 0,
          };
        } else {
          postsMap[urlStr].engagements = engL;
        }
      }

      if (urlR && String(urlR).startsWith("http")) {
        const urlStr = String(urlR).trim();
        if (!postsMap[urlStr]) {
          postsMap[urlStr] = {
            postUrl: urlStr,
            publishedAt: parseExcelDate(dateR),
            engagements: 0,
            impressions: impR,
            engagementRate: 0,
          };
        } else {
          postsMap[urlStr].impressions = impR;
        }
      }
    }

    // Calculate Engagement Rate
    for (const url in postsMap) {
      const post = postsMap[url];
      if (post.impressions > 0) {
        post.engagementRate = parseFloat(((post.engagements / post.impressions) * 100).toFixed(2));
      } else {
        post.engagementRate = 0;
      }
    }
  }

  return {
    posts: Object.values(postsMap),
    dailyMetrics: engagementData,
    followerMetrics: followersData,
    demographicMetrics: demographicsData,
  };
}

function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "number") {
    // Excel base date is Dec 30, 1899
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString();
  }
  const parsed = Date.parse(String(val));
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}
