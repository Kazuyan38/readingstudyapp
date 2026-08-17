import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Dashboard } from './routes/Dashboard'
import { Library } from './routes/Library'
import { BookDetail } from './routes/BookDetail'
import { NoteEditorPage } from './routes/NoteEditor'
import { Distill } from './routes/Distill'
import { Review } from './routes/Review'
import { Search } from './routes/Search'
import { Stats } from './routes/Stats'
import { SettingsHome } from './routes/settings/SettingsHome'
import { SettingsSync } from './routes/settings/SettingsSync'

const NAV = [
  { to: '/', label: 'ホーム' },
  { to: '/library', label: '蔵書' },
  { to: '/distill', label: '蒸留' },
  { to: '/review', label: '復習' },
  { to: '/search', label: '検索' },
  { to: '/stats', label: '統計' },
  { to: '/settings', label: '設定' },
]

function NavBar() {
  return (
    <nav className="sticky top-0 z-10 mb-8 flex flex-wrap gap-1 overflow-x-auto px-4 pt-4 sm:px-8">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'glass text-(--text-primary)' : 'text-(--text-muted) hover:text-(--text-primary)'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="bg-mesh" />
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/:id/note" element={<NoteEditorPage />} />
          <Route path="/distill" element={<Distill />} />
          <Route path="/review" element={<Review />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<SettingsHome />} />
          <Route path="/settings/sync" element={<SettingsSync />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
