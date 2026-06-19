import puppeteer from "puppeteer";

/**
 * Scrapes the post text content from a LinkedIn post URL.
 * It attempts to parse public elements and meta tags.
 * If scraping fails (due to login walls or captchas), it generates a fallback text based on the URL slug.
 */
export async function scrapePostText(url: string): Promise<string> {
  let browser;
  try {
    console.log(`Scraping URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    const page = await browser.newPage();
    
    // Set user agent to resemble a real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Go to LinkedIn URL
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    
    // Extract text and metadata
    const result = await page.evaluate(() => {
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      
      const selectors = [
        ".share-update-card__update-text",
        ".feed-shared-update-v2__commentary",
        "article.main-content",
        ".main-content article",
        ".attributed-text-segment-list__content",
        "[data-test-id='post-text']"
      ];
      
      let bodyText = "";
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text.length > bodyText.length) {
            bodyText = text;
          }
        }
      }
      
      return { ogDesc, metaDesc, bodyText };
    });

    await browser.close();
    
    // Determine the best text source (prioritize metadata descriptions which contain clean post bodies)
    let finalCode = result.ogDesc || result.metaDesc || result.bodyText || "";
    
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
      
      // Clean up trailing comment numbers e.g. " | 20 comments on LinkedIn"
      finalCode = finalCode.replace(/\s*\|\s*\d+\s*comments\s*(?:on\s*LinkedIn)?\s*$/i, "");
      finalCode = finalCode.trim();
    }
    
    if (finalCode && finalCode.length > 5) {
      console.log(`Scraped post content successfully (${finalCode.length} chars).`);
      return finalCode;
    }
  } catch (error: any) {
    console.error(`Error scraping LinkedIn URL: ${url}`, error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
  
  // If we couldn't scrape, use fallback keywords from the URL
  return getFallbackPostText(url);
}

function getFallbackPostText(url: string): string {
  try {
    // Extract keywords from the URL slug
    // e.g. https://www.linkedin.com/posts/the-yuvraj-mishra_nextjs-fullstackdeveloper-reactjs-share-7402528501125287936-GA-2
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1] || "";
    
    // It usually starts with "the-yuvraj-mishra_" or similar
    const splitParts = lastPart.split("_");
    const keywordSlug = splitParts[splitParts.length - 1] || lastPart;
    
    // Split by hyphens and filter out numbers/hashes
    const keywords = keywordSlug
      .split("-")
      .filter((w) => w && isNaN(Number(w)) && w.length > 2 && w !== "share" && w !== "ugcPost")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
      
    if (keywords) {
      return `Building and sharing insights about ${keywords} in my journey as a developer. (Note: Content parsed from post URL keywords due to LinkedIn block/login wall).`;
    }
  } catch (e) {}
  
  return `Sharing my thoughts and updates on LinkedIn. (Note: Content simulated as LinkedIn is currently blocking scrapers).`;
}
