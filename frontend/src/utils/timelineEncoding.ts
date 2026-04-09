import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export type TimelineEntry = {
  id: string
  name: string
  imageHash: string
  startYear: string
  endYear: string
}

export type TimelineData = {
  username: string
  entries: TimelineEntry[]
}

// 旧フォーマット: EncodedItem[] (配列) — [name, imageHash, startYear, endYear]
// 新フォーマット: { u?: string, e: EncodedItem[] } (オブジェクト)
// v2: 5要素目に Spotify アーティスト ID を追加
type EncodedItem = [string, string, string, string, string?]
type EncodedPayload = { u?: string; e: EncodedItem[] }

function mapItems(raw: EncodedItem[]): TimelineEntry[] {
  return raw.map(([name, imageHash, startYear, endYear, spotifyId], index) => ({
    id: spotifyId ?? `${name}-${index}`,
    name,
    imageHash,
    startYear,
    endYear,
  }))
}

export function encodeTimeline(data: TimelineData): string {
  const payload: EncodedPayload = {
    e: data.entries.map((e) => [e.name, e.imageHash, e.startYear, e.endYear, e.id]),
  }
  if (data.username) payload.u = data.username
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeTimeline(encoded: string): TimelineData {
  if (!encoded) return { username: '', entries: [] }

  const json = decompressFromEncodedURIComponent(encoded)
  if (!json) return { username: '', entries: [] }

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { username: '', entries: [] }
  }

  // 旧フォーマット（配列）との後方互換
  if (Array.isArray(raw)) {
    return { username: '', entries: mapItems(raw as EncodedItem[]) }
  }

  const payload = raw as EncodedPayload
  return {
    username: payload.u ?? '',
    entries: mapItems(payload.e ?? []),
  }
}
