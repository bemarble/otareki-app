import { describe, expect, it } from 'vitest'
import { decodeTimeline, encodeTimeline, type TimelineEntry } from './timelineEncoding'

describe('timelineEncoding', () => {
  const entries: TimelineEntry[] = [
    {
      id: 'yoasobi-1',
      name: 'YOASOBI',
      imageHash: 'ab6761610000e5ebc3c7',
      startYear: '2021',
      endYear: '2024',
    },
    {
      id: 'aimer-1',
      name: 'Aimer',
      imageHash: 'ab6761610000e5ebc8f2',
      startYear: '2023',
      endYear: '',
    },
  ]

  it('encodes and decodes timeline entries (round trip)', () => {
    const encoded = encodeTimeline({ username: '', entries })
    const decoded = decodeTimeline(encoded)

    expect(decoded.entries).toHaveLength(2)
    expect(decoded.entries[0]).toMatchObject({
      name: 'YOASOBI',
      imageHash: 'ab6761610000e5ebc3c7',
      startYear: '2021',
      endYear: '2024',
    })
    expect(decoded.entries[1]).toMatchObject({
      name: 'Aimer',
      imageHash: 'ab6761610000e5ebc8f2',
      startYear: '2023',
      endYear: '',
    })
  })

  it('encodes and decodes username', () => {
    const encoded = encodeTimeline({ username: 'みなみ', entries })
    const decoded = decodeTimeline(encoded)
    expect(decoded.username).toBe('みなみ')
  })

  it('returns empty data when encoded string is empty', () => {
    const result = decodeTimeline('')
    expect(result.entries).toEqual([])
    expect(result.username).toBe('')
  })

  it('handles invalid JSON safely', () => {
    const result = decodeTimeline('invalid-data')
    expect(result.entries).toEqual([])
    expect(result.username).toBe('')
  })

  it('decodes old format (array) with backwards compatibility', () => {
    // 旧フォーマット（username なし）で encode した場合
    const encoded = encodeTimeline({ username: '', entries })
    const decoded = decodeTimeline(encoded)
    expect(decoded.username).toBe('')
    expect(decoded.entries).toHaveLength(2)
  })
})
