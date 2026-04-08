// Cloudflare Worker で使用する環境変数の型
export interface Env {
  SPOTIFY_CLIENT_ID: string
  SPOTIFY_CLIENT_SECRET: string
}

// Spotify のアクセストークン取得レスポンス
export type SpotifyTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

// Spotify Search API のうち、アーティスト画像情報
export type SpotifySearchArtistImage = {
  url: string
}

// Spotify Search API のうち、アーティスト情報
export type SpotifySearchArtist = {
  id: string
  name: string
  images?: SpotifySearchArtistImage[]
}

// Spotify Search API レスポンス全体
export type SpotifySearchResponse = {
  artists?: {
    items: SpotifySearchArtist[]
  }
}

// フロントエンドに返す検索結果の整形後型
export type SearchResult = {
  id: string
  name: string
  image: string
}

// Spotify Top Tracks API のうち、トラック情報
export type SpotifyTrack = {
  id: string
  name: string
  album: {
    images?: SpotifySearchArtistImage[]
  }
  external_urls?: {
    spotify?: string
  }
}

// Spotify Top Tracks API レスポンス
export type SpotifyTopTracksResponse = {
  tracks: SpotifyTrack[]
}

// フロントエンドに返す代表曲情報
export type TopTrackResult = {
  id: string
  name: string
  image: string
  url: string
}

