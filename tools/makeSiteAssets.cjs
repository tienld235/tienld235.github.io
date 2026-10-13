// ============================================================
//  ẢNH CHO THẺ APP TRÊN TRANG GỐC — chạy từ gốc repo tienld235.github.io:
//
//      node tools/makeSiteAssets.cjs <app-slug> <ảnh bìa 1024x500> <icon 512>
//
//  Ra assets/<app-slug>-cover.webp (1024×500) + assets/<app-slug>-icon.webp (160×160).
//  Nguồn là ĐÚNG ảnh đã nộp Play (bản tiếng Anh), không vẽ ảnh riêng cho trang:
//    Godot: store/featureGraphic.png (hoặc featureGraphic-en.png) + store/icon512.png
//    RN:    store/graphics/feature-graphic*.png + store/graphics/store-icon-512.png
//  Đổi ảnh bìa / icon trên Play thì chạy lại lệnh này — quy trình: KnowHow 05 "Trang gốc".
//
//  Cần `sharp`: repo này không có package.json nên mượn của app khác:
//      SHARP_PATH=E:/projects/jumpy-hop/node_modules/sharp node tools/makeSiteAssets.cjs …
// ============================================================
const fs = require('fs');
const path = require('path');
const sharp = require(process.env.SHARP_PATH || 'sharp');

const [slug, coverSrc, iconSrc] = process.argv.slice(2);
if (!slug || !coverSrc || !iconSrc || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Cách dùng: node tools/makeSiteAssets.cjs <app-slug> <ảnh bìa 1024x500> <icon 512>');
  process.exit(1);
}
const outDir = path.join(__dirname, '..', 'assets');

(async () => {
  const cover = await sharp(coverSrc).metadata();
  const icon = await sharp(iconSrc).metadata();
  // Ảnh bìa Play luôn 1024×500; khác tỉ lệ là trỏ nhầm file (ảnh chụp màn hình, ảnh thô của Gemini…)
  if (Math.abs(cover.width / cover.height - 1024 / 500) > 0.02) throw new Error(`Ảnh bìa ${cover.width}×${cover.height} không phải tỉ lệ 1024×500 — trỏ nhầm file?`);
  if (icon.width !== icon.height) throw new Error(`Icon ${icon.width}×${icon.height} không vuông — trỏ nhầm file?`);

  const coverOut = path.join(outDir, `${slug}-cover.webp`);
  const iconOut = path.join(outDir, `${slug}-icon.webp`);
  await sharp(coverSrc).resize(1024, 500, { fit: 'cover' }).webp({ quality: 80 }).toFile(coverOut);
  await sharp(iconSrc).resize(160, 160).webp({ quality: 85 }).toFile(iconOut);
  for (const f of [coverOut, iconOut]) console.log(path.relative(process.cwd(), f), (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
})().catch(e => { console.error(e.message); process.exit(1); });
