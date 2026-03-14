import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export type TimelineEntry = {
  id: string
  name: string
  imageHash: string
  startYear: string
  endYear: string
}

type EncodedItem = [string, string, string, string]

export function encodeTimeline(entries: TimelineEntry[]): string {
  const data: EncodedItem[] = entries.map((e) => [
    e.name,
    e.imageHash,
    e.startYear,
    e.endYear,
  ])
  const json = JSON.stringify(data)
  return compressToEncodedURIComponent(json)
}

export function decodeTimeline(encoded: string): TimelineEntry[] {
  if (!encoded) return []

  const json = decompressFromEncodedURIComponent(encoded)
  if (!json) return []

  let raw: EncodedItem[]
  try {
    raw = JSON.parse(json) as EncodedItem[]
  } catch {
    return []
  }

  return raw.map(([name, imageHash, startYear, endYear], index) => ({
    id: `${name}-${index}`,
    name,
    imageHash,
    startYear,
    endYear,
  }))
}

