import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  type TimelineEntry,
  decodeTimeline,
  encodeTimeline,
} from './utils/timelineEncoding'
import { captureTimelineToPng } from './utils/timelineCapture'

type ArtistResult = {
  id: string
  name: string
  image: string
}

type Album = {
  id: string
  name: string
  image: string
  url: string
  releaseDate: string
}

const MAX_ARTISTS = 10
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_MIN = 1990

const BAR_COLORS = [
  '#aa3bff',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
]

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: 16, height: 16, display: 'block', flexShrink: 0 }}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622L18.244 2.25Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: 21, height: 21, display: 'block', flexShrink: 0 }}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function ShareButtons({
  url,
  xText,
  onInstagramClick,
}: {
  url: string
  xText: string
  onInstagramClick?: () => void
}) {
  const xShareUrl =
    `https://twitter.com/intent/tweet` +
    `?text=${encodeURIComponent(xText)}` +
    `&url=${encodeURIComponent(url)}` +
    `&hashtags=${encodeURIComponent('オタレキ')}`

  function handleInstagram() {
    if (onInstagramClick) {
      onInstagramClick()
    }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="share-buttons">
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="share-button share-button-x"
        aria-label="Xでシェア"
      >
        <XIcon />
      </a>
      <button
        type="button"
        className="share-button share-button-instagram"
        onClick={handleInstagram}
        aria-label="インスタでシェア"
      >
        <InstagramIcon />
      </button>
    </div>
  )
}

function OtarekiIcon({ size = 24 }: { size?: number }) {
  const uid = useId()
  const gId = `otareki-bg-${uid}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={`url(#${gId})`} />
      <path
        d="M50,18 L54,28 L64,28 L56,35 L59,45 L50,39 L41,45 L44,35 L36,28 L47,28 Z"
        fill="white"
      />
      <rect x="18" y="58" width="56" height="6" rx="3" fill="white" opacity="0.95" />
      <rect x="18" y="68" width="37" height="6" rx="3" fill="white" opacity="0.80" />
      <rect x="18" y="78" width="47" height="6" rx="3" fill="white" opacity="0.88" />
    </svg>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="logo">
          <OtarekiIcon size={28} />
          オタレキ
        </Link>
        <nav className="nav-links">
          <Link to="/create">タイムラインを作る</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <span>推し遍歴を、URL ひとつで。</span>
      </footer>
    </div>
  )
}

function HomePage() {
  return (
    <Layout>
      <section className="hero-section">
        <div className="hero-text">
          <h1>推しの歴史を、タイムラインに。</h1>
          <p>
            「いつ、誰を推していたか」をきれいな縦タイムラインにして、
            SNSでシェアできます。
          </p>
          <div className="hero-actions">
            <Link to="/create" className="primary-button">
              オタレキを作る
            </Link>
          </div>
          <ShareButtons
            url={typeof window !== 'undefined' ? window.location.origin : ''}
            xText="推し遍歴をタイムラインにして共有できる「オタレキ」✨ あなたの推しの歴史、振り返ってみて！"
          />
          <ul className="hero-list">
            <li>アーティスト検索（Spotify）</li>
            <li>推し開始 / 終了年を入力</li>
            <li>URLにタイムラインを保存して共有</li>
          </ul>
        </div>
        <div className="hero-preview">
          <div className="timeline-card">
            <div className="timeline-title">サンプルタイムライン</div>
            <ul className="timeline-list">
              <li>
                <span className="year">2024</span>
                <span className="artist">YOASOBI</span>
              </li>
              <li>
                <span className="year">2023</span>
                <span className="artist">Aimer</span>
              </li>
              <li>
                <span className="year">2021</span>
                <span className="artist">LiSA</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function CreatePage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ArtistResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const canAddMore = timeline.length < MAX_ARTISTS
  const timelineEditRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const encoded = searchParams.get('data')
    if (!encoded) return
    if (timeline.length > 0) return

    const restored = decodeTimeline(encoded)
    if (restored.entries.length > 0) {
      setTimeline(restored.entries)
      setUsername(restored.username)
    }
  }, [searchParams, timeline.length])

  async function handleSearch() {
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error('検索に失敗しました')
      const data = (await res.json()) as ArtistResult[]
      setSearchResults(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '検索中にエラーが発生しました')
    } finally {
      setIsSearching(false)
    }
  }

  function handleAddArtist(artist: ArtistResult) {
    if (!canAddMore) return
    if (timeline.some((t) => t.id === artist.id)) return
    setTimeline((prev) => [
      ...prev,
      {
        id: artist.id,
        name: artist.name,
        imageHash: artist.image,
        startYear: String(CURRENT_YEAR),
        endYear: '',
      },
    ])
    setTimeout(() => {
      timelineEditRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 0)
  }

  function updateYear(id: string, field: 'startYear' | 'endYear', value: string) {
    setTimeline((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        // 開始年 > 終了年になった場合は終了年を開始年に合わせる
        if (
          field === 'startYear' &&
          updated.endYear &&
          Number(value) > Number(updated.endYear)
        ) {
          updated.endYear = value
        }
        return updated
      }),
    )
  }

  function toggleActive(id: string, isActive: boolean) {
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, endYear: isActive ? String(CURRENT_YEAR) : '' } : item,
      ),
    )
  }

  function handleRemove(id: string) {
    setTimeline((prev) => prev.filter((item) => item.id !== id))
  }

  const encoded = useMemo(
    () => (timeline.length ? encodeTimeline({ username, entries: timeline }) : ''),
    [timeline, username],
  )

  function handleOpenTimeline() {
    if (!encoded) return
    navigate(`/t/${encoded}`)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = encoded ? `${baseUrl}/t/${encoded}` : ''

  return (
    <Layout>
      <section className="create-layout">
        <div className="panel">
          <h2>1. アーティスト検索</h2>
          <p className="panel-description">
            推したことのあるアーティスト名を検索して、タイムラインに追加します。
          </p>
          <div className="search-row">
            <input
              className="text-input"
              placeholder="例: YOASOBI"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleSearch()
                }
              }}
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleSearch()}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? '検索中…' : '検索'}
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="results-grid">
            {searchResults.map((artist) => (
              <button
                type="button"
                key={artist.id}
                className="artist-card"
                onClick={() => handleAddArtist(artist)}
                disabled={!canAddMore}
              >
                <div className="artist-image-wrapper">
                  {artist.image ? (
                    <img
                      src={`https://i.scdn.co/image/${artist.image}`}
                      alt={artist.name}
                      className="artist-image"
                    />
                  ) : (
                    <div className="artist-placeholder">No Image</div>
                  )}
                </div>
                <div className="artist-name">{artist.name}</div>
              </button>
            ))}
            {!searchResults.length && (
              <p className="muted-text">検索すると、ここに候補が表示されます。</p>
            )}
          </div>
          <p className="muted-text">最大 {MAX_ARTISTS} アーティストまで追加できます。</p>
        </div>

        <div className="panel" ref={timelineEditRef}>
          <h2>2. タイムライン編集</h2>
          <p className="panel-description">
            各アーティストの推し始め・推し終わりの年をスライダーで設定します。
          </p>
          {timeline.length === 0 ? (
            <p className="muted-text">
              まだタイムラインがありません。左の検索からアーティストを追加してください。
            </p>
          ) : (
            <ul className="timeline-edit-list">
              {timeline.map((item) => {
                const isActive = !item.endYear
                const startVal = Number(item.startYear) || CURRENT_YEAR
                const endVal = Number(item.endYear) || CURRENT_YEAR
                const endMin = Math.max(startVal, YEAR_MIN)

                return (
                  <li key={item.id} className="timeline-edit-item">
                    <div className="timeline-edit-header">
                      <div className="timeline-edit-meta">
                        {item.imageHash && (
                          <img
                            src={`https://i.scdn.co/image/${item.imageHash}`}
                            alt={item.name}
                            className="timeline-thumb"
                          />
                        )}
                        <span className="timeline-artist">{item.name}</span>
                      </div>
                      <button
                        type="button"
                        className="ghost-button ghost-button-sm"
                        onClick={() => handleRemove(item.id)}
                      >
                        削除
                      </button>
                    </div>
                    <div className="year-slider-row">
                      <span className="year-slider-label">開始</span>
                      <span className="year-slider-value">{startVal}</span>
                      <input
                        type="range"
                        className="year-slider"
                        min={YEAR_MIN}
                        max={CURRENT_YEAR}
                        value={startVal}
                        onChange={(e) => updateYear(item.id, 'startYear', e.target.value)}
                      />
                    </div>
                    <div className="year-slider-row">
                      <span className="year-slider-label">終了</span>
                      {isActive ? (
                        <button
                          type="button"
                          className="active-badge"
                          onClick={() => toggleActive(item.id, true)}
                          title="クリックして終了年を設定"
                        >
                          現在も推し中
                        </button>
                      ) : (
                        <>
                          <span className="year-slider-value">{endVal}</span>
                          <input
                            type="range"
                            className="year-slider"
                            min={endMin}
                            max={CURRENT_YEAR}
                            value={endVal}
                            onChange={(e) => updateYear(item.id, 'endYear', e.target.value)}
                          />
                          <button
                            type="button"
                            className="ghost-button ghost-button-sm"
                            onClick={() => toggleActive(item.id, false)}
                          >
                            現在も
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <h2>3. URL生成 & 共有</h2>
          <p className="panel-description">
            タイムラインを URL に保存して、SNS に貼り付けできます。
          </p>
          <label className="username-field">
            <span className="username-label">ユーザー名（任意）</span>
            <input
              className="text-input"
              placeholder="例: オタク"
              value={username}
              maxLength={30}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <p className="muted-text">
            タイムラインに「{username || 'ユーザー名'}のオタレキ」と表示されます。
          </p>
          <div className="url-row">
            <input
              className="text-input"
              readOnly
              value={shareUrl}
              placeholder="タイムラインを作成すると URL が表示されます"
            />
            <button
              type="button"
              className="secondary-button"
              disabled={!encoded}
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              コピー
            </button>
          </div>
          <div className="actions-row">
            <button
              type="button"
              className="primary-button"
              disabled={!encoded}
              onClick={handleOpenTimeline}
            >
              タイムラインを開く
            </button>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function TimelinePage() {
  const { data } = useParams<{ data: string }>()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [username, setUsername] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!data) return
    const decoded = decodeTimeline(data)
    setEntries(decoded.entries)
    setUsername(decoded.username)
  }, [data])

  if (!data) {
    return (
      <Layout>
        <p className="error-text">タイムラインデータが見つかりませんでした。</p>
      </Layout>
    )
  }

  if (entries.length === 0) {
    return (
      <Layout>
        <p className="error-text">
          タイムラインを読み込めませんでした。URL が壊れている可能性があります。
        </p>
      </Layout>
    )
  }

  const sorted = [...entries].sort((a, b) => {
    const ay = Number(a.startYear) || 0
    const by = Number(b.startYear) || 0
    return ay - by
  })

  const validStarts = sorted.map(e => Number(e.startYear)).filter(y => y > 1900)
  const validEnds = sorted.map(e => Number(e.endYear)).filter(y => y > 1900)
  const minYear = validStarts.length ? Math.min(...validStarts) : CURRENT_YEAR - 5
  const maxYear = Math.max(CURRENT_YEAR, ...(validEnds.length ? validEnds : [CURRENT_YEAR]))
  const totalSpan = maxYear - minYear || 1

  const yearStep = totalSpan <= 10 ? 1 : totalSpan <= 20 ? 2 : 5
  const yearMarkers = Array.from(
    { length: Math.floor(totalSpan / yearStep) + 1 },
    (_, i) => minYear + i * yearStep,
  )

  async function handleDownloadImage() {
    if (!timelineRef.current) return
    setIsCapturing(true)
    setError(null)
    try {
      const blob = await captureTimelineToPng(timelineRef.current)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'otareki-timeline.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '画像の生成中にエラーが発生しました。',
      )
    } finally {
      setIsCapturing(false)
    }
  }

  function handleBackToEdit() {
    if (!data) {
      navigate('/create')
      return
    }
    navigate(`/create?data=${data}`)
  }

  return (
    <Layout>
      <section className="timeline-view" ref={timelineRef}>
        <h1 className="timeline-view-title">
          <OtarekiIcon size={32} />
          {username ? `${username}のオタレキ` : 'オタレキ'}
        </h1>
        <div className="bar-chart">
          <div className="bar-chart-header">
            <div className="bar-chart-label-col" />
            <div className="bar-chart-axis">
              {yearMarkers.map((year) => (
                <div
                  key={year}
                  className="bar-chart-year-mark"
                  style={{ left: `${((year - minYear) / totalSpan) * 100}%` }}
                >
                  {year}
                </div>
              ))}
            </div>
          </div>
          <div className="bar-chart-rows">
            {sorted.map((item, index) => {
              const start = Number(item.startYear) || minYear
              const end = Number(item.endYear) || maxYear
              const isActive = !item.endYear
              const leftPct = ((start - minYear) / totalSpan) * 100
              const widthPct = Math.max(((end - start) / totalSpan) * 100, 2)
              const color = BAR_COLORS[index % BAR_COLORS.length]
              const label = isActive ? `${start}〜現在` : `${start}〜${end}`

              return (
                <div key={item.id} className="bar-chart-row">
                  <div className="bar-chart-label-col">
                    {item.imageHash && (
                      <img
                        src={`https://i.scdn.co/image/${item.imageHash}`}
                        alt={item.name}
                        className="bar-chart-artist-image"
                      />
                    )}
                    <span className="bar-chart-artist-name">{item.name}</span>
                  </div>
                  <div className="bar-chart-track">
                    <div
                      className={`bar-chart-bar${isActive ? ' bar-chart-bar-active' : ''}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        background: color,
                      }}
                      title={label}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <div className="timeline-view-actions">
        <ShareButtons
          url={typeof window !== 'undefined' ? window.location.origin : ''}
          xText={
            username
              ? `${username}のオタレキを見てみて📊 推しの遍歴をタイムラインにしたよ！`
              : '私のオタレキを見てみて📊 推しの遍歴をタイムラインにしたよ！'
          }
          onInstagramClick={() => void handleDownloadImage()}
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => void handleDownloadImage()}
          disabled={isCapturing}
        >
          {isCapturing ? '画像生成中…' : '画像を保存する'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={handleBackToEdit}
        >
          編集画面に戻る
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Layout>
  )
}

function ArtistTopTracksPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const artistName = (location.state as { name?: string } | null)?.name ?? ''
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const params = new URLSearchParams({ id })
        const res = await fetch(`/api/artist-top?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error('アルバムの取得に失敗しました')
        }
        const data = (await res.json()) as Album[]
        setAlbums(data)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        setError(
          e instanceof Error ? e.message : 'アルバムの取得中にエラーが発生しました',
        )
      } finally {
        setLoading(false)
      }
    })().catch(() => {})
    return () => controller.abort()
  }, [id])

  return (
    <Layout>
      <section className="timeline-view">
        <h1 className="timeline-view-title">
          {artistName ? `${artistName} のアルバム` : 'アルバム'}
        </h1>
        {loading && <p className="muted-text">読み込み中です…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && albums.length === 0 && (
          <p className="muted-text">アルバムが見つかりませんでした。</p>
        )}
        {!loading && !error && albums.length > 0 && (
          <ul className="top-tracks-list">
            {albums.map((album) => (
              <li key={album.id} className="top-tracks-item">
                <div className="top-tracks-content">
                  {album.image && (
                    <img
                      src={`https://i.scdn.co/image/${album.image}`}
                      alt={album.name}
                      className="top-tracks-image"
                    />
                  )}
                  <div className="top-tracks-meta">
                    <div>
                      <div className="top-tracks-name">{album.name}</div>
                      {album.releaseDate && (
                        <div className="muted-text">{album.releaseDate}</div>
                      )}
                    </div>
                    <a
                      href={album.url}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-button top-tracks-link"
                    >
                      Spotifyで聴く
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/t/:data" element={<TimelinePage />} />
      <Route path="/artist/:id" element={<ArtistTopTracksPage />} />
    </Routes>
  )
}

export default App
