import { describe, expect, it } from 'vitest'
import { extractImageHash } from './index'

describe('extractImageHash', () => {
  it('returns empty string when url is empty', () => {
    expect(extractImageHash('')).toBe('')
  })

  it('extracts hash from spotify image url', () => {
    const url = 'https://i.scdn.co/image/ab6761610000e5ebc3c7'
    expect(extractImageHash(url)).toBe('ab6761610000e5ebc3c7')
  })

  it('returns last segment even if url has trailing slash', () => {
    const url = 'https://i.scdn.co/image/ab6761610000e5ebc3c7/'
    expect(extractImageHash(url)).toBe('')
  })
})

