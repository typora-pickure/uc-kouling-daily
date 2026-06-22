import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const SOURCE_URL = "https://www.yuque.com/as2498/fbdtqk/tc7tfdy07d1cerae";

function normalizeKouling(text) {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\s+/, "").trim())
    .filter(Boolean)
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !/^(Plain Text|复制代码|复制|Copy)$/i.test(line))
    .join("\n")
    .trim();
}

function chooseKouling(candidates) {
  const cleaned = [...new Set(candidates.map(normalizeKouling).filter(Boolean))];
  const ranked = cleaned
    .map((text) => {
      let score = 0;
      if (/炖肉|燉肉|解开|解開|口令|密码|密碼|解析/.test(text)) score += 10;
      if (/UC|浏览器|瀏覽器|网盘|網盤|转存|教程|点击|复制|下载|后缀|首先|每天/.test(text)) score -= 5;
      if (text.length >= 4 && text.length <= 80) score += 4;
      if (text.length > 120) score -= 8;
      return { text, score };
    })
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  if (!ranked.length || ranked[0].score <= 0) {
    throw new Error(`没有识别到口令。候选文本：${JSON.stringify(cleaned.slice(0, 8))}`);
  }

  return ranked[0].text;
}

function makeIndex(kouling, updatedAt) {
  const escaped = kouling
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UC 口令</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; line-height: 1.6; }
    main { max-width: 720px; margin: 0 auto; }
    pre { white-space: pre-wrap; padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #f7f7f7; font-size: 18px; }
    a, button { font-size: 16px; }
  </style>
</head>
<body>
  <main>
    <h1>UC 口令</h1>
    <p>更新时间：${updatedAt}</p>
    <pre id="kouling">${escaped}</pre>
    <p><button id="copy">复制口令</button> <a href="./latest.txt" download>下载 latest.txt</a></p>
  </main>
  <script>
    document.querySelector("#copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText(document.querySelector("#kouling").textContent.trim());
      document.querySelector("#copy").textContent = "已复制";
    });
  </script>
</body>
</html>
`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1365, height: 1200 },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142 Safari/537.36",
});

try {
  await page.goto(SOURCE_URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  const candidates = await page.evaluate(() => {
    function visibleText(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) {
        return "";
      }
      return element.innerText || element.textContent || "";
    }

    const selectors = [
      "pre",
      "code",
      "[class*='code']",
      "[class*='Code']",
      "[data-card-type='codeblock']",
    ];

    return [...document.querySelectorAll(selectors.join(","))]
      .map(visibleText)
      .map((text) => text.trim())
      .filter(Boolean);
  });

  const kouling = chooseKouling(candidates);
  const updatedAt = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });

  await writeFile("latest.txt", `${kouling}\n`, "utf8");
  await writeFile("index.html", makeIndex(kouling, updatedAt), "utf8");

  console.log(`已更新口令：${kouling}`);
} finally {
  await browser.close();
}
