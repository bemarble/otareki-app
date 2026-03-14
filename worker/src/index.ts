/// <reference types="@cloudflare/workers-types" />

// 型定義は src/types.ts に集約
import {
  type Env,
  type SearchResult,
  type SpotifySearchResponse,
  type SpotifyTokenResponse,
} from './types'

// Spotify トークン / 検索結果のキャッシュ用キー・TTL
const TOKEN_CACHE_KEY = 'spotify-token'
// Spotify のアクセストークン有効期限（約 3600 秒）より少し短めにキャッシュ
const TOKEN_TTL_SECONDS = 3500
// 検索結果のキャッシュは 60 秒
const SEARCH_TTL_SECONDS = 60

// Cloudflare Workers 環境でのみ利用できる `caches.default` を型安全に取得するヘルパー
function getDefaultCache(): Cache {
  // DOM 標準の CacheStorage 型には default が無いため、実行時の実装に合わせて型を上書きする
  return (caches as unknown as { default: Cache }).default
}

// Cloudflare Worker のエントリーポイント
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/search') {
      return handleSearch(request, env, ctx)
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>

async function handleSearch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  // クエリ文字列 q を取得（空なら何も返さず終了）
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim()
  if (!q) {
    return jsonResponse([], {
      'Cache-Control': 'public, max-age=60',
    })
  }

  // クエリを小文字に正規化した URL をキャッシュキーにする
  const cacheUrl = new URL(request.url)
  cacheUrl.searchParams.set('q', q.toLowerCase())
  const cache = getDefaultCache()

  const cached = await cache.match(cacheUrl.toString())
  if (cached) {
    return cached
  }

  // Spotify API 呼び出し用のアクセストークン取得（Worker 内でキャッシュ）
  const token = await getSpotifyToken(env)
  const searchUrl = new URL('https://api.spotify.com/v1/search')
  searchUrl.searchParams.set('q', q)
  searchUrl.searchParams.set('type', 'artist')
  searchUrl.searchParams.set('limit', '5')

  const res = await fetch(searchUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    console.error('Spotify error status', res.status, await res.text())

    return new Response('Spotify search failed', { status: 502 })
  }

  console.log('res', await res.json())

  const data = (await res.json()) as SpotifySearchResponse
  const items = data.artists?.items ?? []

  const body: SearchResult[] = items.map((artist) => ({
    id: artist.id,
    name: artist.name,
    image: extractImageHash(artist.images?.[0]?.url ?? ''),
  }))

  // 検索結果 JSON を返却（ブラウザ / Worker 両方で 60 秒キャッシュ）
  const response = jsonResponse(body, {
    'Cache-Control': `public, max-age=${SEARCH_TTL_SECONDS}`,
  })

  ctx.waitUntil(cache.put(cacheUrl.toString(), response.clone()))

  return response
}

// JSON レスポンス生成用のユーティリティ
function jsonResponse(body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

async function getSpotifyToken(env: Env): Promise<string> {
  // まず Worker の Cache からアクセストークン再利用を試みる
  const cache = getDefaultCache()
  const cacheKey = new Request(`https://token-cache/${TOKEN_CACHE_KEY}`)
  const cached = await cache.match(cacheKey)
  if (cached) {
    const data = (await cached.json()) as { access_token: string }
    return data.access_token
  }

  // Spotify の client_credentials フローでトークン取得
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error('Failed to obtain Spotify token')
  }

  const data = (await res.json()) as SpotifyTokenResponse

  // アクセストークンを Worker キャッシュに保存
  const cacheResponse = new Response(
    JSON.stringify({ access_token: data.access_token }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${TOKEN_TTL_SECONDS}`,
      },
    },
  )
  await cache.put(cacheKey, cacheResponse.clone())

  return data.access_token
}

// Spotify 画像 URL から image_hash 部分だけを取り出す
export function extractImageHash(url: string): string {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1] ?? ''
}

