import { describe, expect, it } from 'vitest'
import { decodeTimeline, encodeTimeline, type TimelineEntry } from './timelineEncoding'

describe('timelineEncoding', () => {
  it('encodes and decodes timeline entries (round trip)', () => {
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

    const encoded = encodeTimeline(entries)
    const decoded = decodeTimeline(encoded)

    expect(decoded).toHaveLength(2)
    expect(decoded[0]).toMatchObject({
      name: 'YOASOBI',
      imageHash: 'ab6761610000e5ebc3c7',
      startYear: '2021',
      endYear: '2024',
    })
    expect(decoded[1]).toMatchObject({
      name: 'Aimer',
      imageHash: 'ab6761610000e5ebc8f2',
      startYear: '2023',
      endYear: '',
    })
  })

  it('returns empty array when encoded string is empty', () => {
    expect(decodeTimeline('')).toEqual([])
  })

  it('handles invalid JSON safely', () => {
    // あり得ない文字列でも例外を投げず空配列を返すことを保証
    expect(decodeTimeline('invalid-data')).toEqual([])
  })
})

