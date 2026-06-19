import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrapes the post text content from a LinkedIn post URL.
 * It uses Axios to fetch the HTML and Cheerio to parse meta tags.
 * This runs significantly faster than launching a headless browser.
 */
export async function scrapePostText(url: string): Promise<string> {
  try {
    console.log(`Scraping post: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch page. Status: ${response.status}`);
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract post text from metadata tags
    const metaDesc = $('meta[property="og:description"]').attr("content") ||
                     $('meta[name="description"]').attr("content") ||
                     $('meta[name="twitter:description"]').attr("content") || "";

    let finalCode = metaDesc.trim();
    
    if (finalCode) {
      // Clean up common LinkedIn meta prefixes
      const cleaningRegexes = [
        /^[A-Za-z\s]+ on LinkedIn:\s*/i,
        /^[A-Za-z\s]+ posted on LinkedIn:\s*/i,
        /^LinkedIn post by [A-Za-z\s]+:\s*/i
      ];
      for (const regex of cleaningRegexes) {
        finalCode = finalCode.replace(regex, "");
      }
      
      // Clean up trailing comment/reaction summaries
      finalCode = finalCode.replace(/\s*\|\s*\d+\s+(?:comment|reaction)s?\s+(?:on\s+LinkedIn)?\s*$/i, "");
      finalCode = finalCode.replace(/\s*\|\s*LinkedIn\s*$/i, "");
      finalCode = finalCode.trim();
    }
    
    if (finalCode) {
      console.log(`Scraped post content successfully (${finalCode.length} chars).`);
      return finalCode;
    }
  } catch (error: any) {
    console.error(`Error scraping LinkedIn URL ${url}:`, error.message);
  }
  
  return "";
}
