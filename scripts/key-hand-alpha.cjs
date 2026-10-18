const sharp = require("sharp");
const path = require("path");

async function keyImage(input, output, tint) {
  const source = sharp(input).ensureAlpha();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    const alpha = Math.max(0, Math.min(255, (luma - 7) * 5.2));
    data[i] = Math.min(255, r * 1.15 + tint[0] * 0.25);
    data[i + 1] = Math.min(255, g * 1.12 + tint[1] * 0.25);
    data[i + 2] = Math.min(255, b * 1.18 + tint[2] * 0.25);
    data[i + 3] = alpha;
  }
  await sharp(data, { raw: info }).png().toFile(output);
}

const assets = path.join(process.cwd(), "public", "assets");
Promise.all([
  keyImage(path.join(assets, "ai-hand.jfif"), path.join(assets, "ai-hand-alpha.png"), [80, 215, 255]),
  keyImage(path.join(assets, "human-hand.jfif"), path.join(assets, "human-hand-alpha.png"), [255, 188, 155])
]).catch((error) => {
  console.error(error);
  process.exit(1);
});
