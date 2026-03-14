import * as htmlToImage from 'html-to-image'

export async function captureTimelineToPng(element: HTMLElement): Promise<Blob> {
  const dataUrl = await htmlToImage.toPng(element, {
    width: 1080,
    height: 1350,
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: 'scale(1.2)',
      transformOrigin: 'top center',
    },
  })

  const res = await fetch(dataUrl)
  return await res.blob()
}

