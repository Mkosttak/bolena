#!/usr/bin/env node
/**
 * Public/images altındaki >50KB görselleri sharp ile WebP + AVIF formatına çevirir
 * (orijinal dosyalar korunur). Sonrasında bileşen tarafında WebP/AVIF tercih edilebilir.
 *
 * Kullanım:
 *   npm i -D sharp
 *   node scripts/optimize-images.mjs
 *
 * Çıktılar yan yana: foo.png + foo.webp + foo.avif olur. .png referansı korunur,
 * <picture> ile WebP/AVIF tercih edilebilir.
 */

import { readdir, stat } from 'node:fs/promises'
import { join, extname, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', 'public', 'images')
const MIN_BYTES = 50 * 1024 // 50KB altı görselleri atla
const SUPPORTED = new Set(['.png', '.jpg', '.jpeg'])

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('sharp kurulu değil. `npm i -D sharp` çalıştırın ve tekrar deneyin.')
  process.exit(1)
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

let totalIn = 0
let totalOutWebp = 0
let totalOutAvif = 0

for await (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase()
  if (!SUPPORTED.has(ext)) continue

  const s = await stat(file)
  if (s.size < MIN_BYTES) continue

  const base = basename(file, ext)
  const dir = dirname(file)
  const webpOut = join(dir, `${base}.webp`)
  const avifOut = join(dir, `${base}.avif`)

  try {
    const webpBuf = await sharp(file).webp({ quality: 82 }).toBuffer()
    await sharp(file).webp({ quality: 82 }).toFile(webpOut)
    const avifBuf = await sharp(file).avif({ quality: 60 }).toBuffer()
    await sharp(file).avif({ quality: 60 }).toFile(avifOut)
    totalIn += s.size
    totalOutWebp += webpBuf.length
    totalOutAvif += avifBuf.length
    const wpct = ((1 - webpBuf.length / s.size) * 100).toFixed(0)
    const apct = ((1 - avifBuf.length / s.size) * 100).toFixed(0)
    console.log(`✓ ${file.replace(ROOT, '')} → webp ${(webpBuf.length / 1024).toFixed(0)}KB (-${wpct}%), avif ${(avifBuf.length / 1024).toFixed(0)}KB (-${apct}%)`)
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`)
  }
}

console.log('---')
console.log(`Toplam giriş:  ${(totalIn / 1024).toFixed(0)}KB`)
console.log(`Toplam WebP:   ${(totalOutWebp / 1024).toFixed(0)}KB`)
console.log(`Toplam AVIF:   ${(totalOutAvif / 1024).toFixed(0)}KB`)
