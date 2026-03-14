import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
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

const MAX_ARTISTS = 10

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="logo">
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
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ArtistResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const navigate = useNavigate()

  const canAddMore = timeline.length < MAX_ARTISTS

  async function handleSearch() {
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) {
        throw new Error('検索に失敗しました')
      }
      const data = (await res.json()) as ArtistResult[]
      setSearchResults(data)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '検索中にエラーが発生しました',
      )
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
        startYear: '',
        endYear: '',
      },
    ])
  }

  function updateYear(
    id: string,
    field: 'startYear' | 'endYear',
    value: string,
  ) {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 4)
    setTimeline((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: sanitized } : item,
      ),
    )
  }

  function handleRemove(id: string) {
    setTimeline((prev) => prev.filter((item) => item.id !== id))
  }

  const encoded = useMemo(
    () => (timeline.length ? encodeTimeline(timeline) : ''),
    [timeline],
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
              <p className="muted-text">
                検索すると、ここに候補が表示されます。
              </p>
            )}
          </div>
          <p className="muted-text">
            最大 {MAX_ARTISTS} アーティストまで追加できます。
          </p>
        </div>

        <div className="panel">
          <h2>2. タイムライン編集</h2>
          <p className="panel-description">
            各アーティストの推し始め・推し終わりの年を入力して、推し遍歴を作ります。
          </p>
          {timeline.length === 0 ? (
            <p className="muted-text">
              まだタイムラインがありません。左の検索からアーティストを追加してください。
            </p>
          ) : (
            <ul className="timeline-edit-list">
              {timeline.map((item) => (
                <li key={item.id} className="timeline-edit-item">
                  <div className="timeline-edit-main">
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
                    <div className="timeline-years">
                      <label className="year-field">
                        <span>開始年</span>
                        <input
                          className="year-input"
                          inputMode="numeric"
                          placeholder="2021"
                          value={item.startYear}
                          onChange={(e) =>
                            updateYear(item.id, 'startYear', e.target.value)
                          }
                        />
                      </label>
                      <label className="year-field">
                        <span>終了年（任意）</span>
                        <input
                          className="year-input"
                          inputMode="numeric"
                          placeholder="2024"
                          value={item.endYear}
                          onChange={(e) =>
                            updateYear(item.id, 'endYear', e.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleRemove(item.id)}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h2>3. URL生成 & 共有</h2>
          <p className="panel-description">
            タイムラインを URL に保存して、X やInstagramなどに貼り付けできます。
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
          <p className="muted-text">
            例:{' '}
            {encoded
              ? `私のオタレキ作りました ${shareUrl} #オタレキ`
              : '私のオタレキ作りました https://example.com/t/xxxx #オタレキ'}
          </p>
        </div>
      </section>
    </Layout>
  )
}

function TimelinePage() {
  const { data } = useParams<{ data: string }>()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!data) return
    setEntries(decodeTimeline(data))
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
    return by - ay
  })

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

  return (
    <Layout>
      <section className="timeline-view" ref={timelineRef}>
        <h1 className="timeline-view-title">オタレキ</h1>
        <ul className="timeline-view-list">
          {sorted.map((item) => (
            <li key={item.id} className="timeline-view-item">
              <div className="timeline-view-year">
                {item.startYear}
                {item.endYear && `–${item.endYear}`}
              </div>
              <div className="timeline-view-content">
                {item.imageHash && (
                  <img
                    src={`https://i.scdn.co/image/${item.imageHash}`}
                    alt={item.name}
                    className="timeline-view-image"
                  />
                )}
                <div className="timeline-view-artist">{item.name}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="timeline-view-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => void handleDownloadImage()}
          disabled={isCapturing}
        >
          {isCapturing ? '画像生成中…' : '画像を保存する（1080x1350）'}
        </button>
        <Link to="/create" className="ghost-button">
          自分のオタレキを作る
        </Link>
      </div>
      {error && <p className="error-text">{error}</p>}
    </Layout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/t/:data" element={<TimelinePage />} />
    </Routes>
  )
}

export default App
