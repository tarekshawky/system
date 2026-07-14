import type { LaunchOptions } from "playwright-core";
import { chromium } from "playwright-core";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

async function getLaunchOptions(): Promise<LaunchOptions> {
  if (!isServerless) {
    // Local/dev: use the Chromium installed via `npx playwright install chromium`.
    return {};
  }

  // Vercel/Lambda: no OS package manager, no bundled browser — use the
  // Linux-only prebuilt Chromium made for serverless runtimes.
  const sparticuzChromium = (await import("@sparticuz/chromium")).default;
  return {
    args: sparticuzChromium.args,
    executablePath: await sparticuzChromium.executablePath(),
    headless: true,
  };
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch(await getLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
