const fs = require("fs");
const path = require("path");

if (process.env.SUB2API_EMBEDDED !== "1") process.exit(0);

const outDir = path.join(__dirname, "..", "out");
for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
  const locale = entry.name.slice(0, -".html".length);
  if (!/^[a-z]{2}(?:-[a-z]+)?$/.test(locale)) continue;

  const localeDir = path.join(outDir, locale);
  fs.mkdirSync(localeDir, { recursive: true });
  fs.copyFileSync(path.join(outDir, entry.name), path.join(localeDir, "index.html"));
}
