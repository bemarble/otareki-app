import * as htmlToImage from 'html-to-image'

const OUTPUT_W = 1080
const OUTPUT_H = 1350
const PADDING = 80 // 上下の最小余白 (px)

export async function captureTimelineToPng(element: HTMLElement): Promise<Blob> {
  // ① 要素を自然サイズで PNG キャプチャ（html-to-image は表示中の要素に使う）
  const naturalDataUrl = await htmlToImage.toPng(element, {
    pixelRatio: 1,
    cacheBust: true,
  })

  // ② PNG を Image として読み込んで寸法を取得
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('キャプチャ画像の読み込みに失敗しました'))
    i.src = naturalDataUrl
  })

  // ③ 固定キャンバスに収まるようスケール計算（幅優先、縦が余白内に収まるよう調整）
  const availH = OUTPUT_H - PADDING * 2
  const scaleByWidth = OUTPUT_W / img.width
  const scaledHbyWidth = img.height * scaleByWidth
  const scale = scaledHbyWidth > availH ? availH / img.height : scaleByWidth

  const drawW = Math.round(img.width * scale)
  const drawH = Math.round(img.height * scale)
  const drawX = Math.round((OUTPUT_W - drawW) / 2)
  const drawY = Math.round((OUTPUT_H - drawH) / 2)

  // ④ 1080×1350 の固定キャンバスに背景色 + コンテンツを描画
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_W
  canvas.height = OUTPUT_H

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas コンテキストを取得できませんでした')

  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff'
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, OUTPUT_W, OUTPUT_H)

  ctx.drawImage(img, drawX, drawY, drawW, drawH)

  // ⑤ Blob として返す
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Blob の生成に失敗しました'))),
      'image/png',
    )
  })
}
