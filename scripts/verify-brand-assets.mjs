import { readFileSync, statSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const pngDimensions = (path) => {
  const buffer = readFileSync(path);
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${path} must be a PNG`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: statSync(path).size
  };
};

const layout = read("app/layout.tsx");
const site = read("lib/site.ts");
const og = pngDimensions("public/og-default.png");
const favicon = pngDimensions("public/favicon.png");

if (og.width !== 1200 || og.height !== 630) {
  throw new Error(`public/og-default.png must be 1200x630; got ${og.width}x${og.height}`);
}

if (favicon.width !== 64 || favicon.height !== 64) {
  throw new Error(`public/favicon.png must be 64x64; got ${favicon.width}x${favicon.height}`);
}

for (const required of [
  'url: "/og-default.png"',
  'images: ["/og-default.png"]',
  'icon: "/favicon.png"',
  'apple: "/favicon.png"'
]) {
  if (!layout.includes(required)) throw new Error(`app/layout.tsx is missing asset reference: ${required}`);
}

if (!site.includes("logo: `${siteUrl}/og-default.png`")) {
  throw new Error("Organization JSON-LD must use the raster social asset");
}

if (og.bytes > 250_000) throw new Error(`public/og-default.png is unexpectedly large: ${og.bytes} bytes`);
if (favicon.bytes > 100_000) throw new Error(`public/favicon.png is unexpectedly large: ${favicon.bytes} bytes`);

console.log("BRAND_ASSET_CONTRACT", JSON.stringify({
  passed: true,
  og,
  favicon,
  sourceArtwork: "public/og-default.svg"
}));
