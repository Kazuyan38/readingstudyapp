import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
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

// ページ遷移はクロスフェードのみ（docs/DESIGN.md §8.5）。スライドさせない。
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
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
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    // prefers-reduced-motion: reduce の場合、Motion のアニメーションを全て即時化する
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="bg-mesh" />
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
          <AnimatedRoutes />
        </main>
      </BrowserRouter>
    </MotionConfig>
  )
}
