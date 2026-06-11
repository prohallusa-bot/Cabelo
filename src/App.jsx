import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { Sparkles } from 'lucide-react'

// Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import QuickScan from './pages/QuickScan'
import FullAnalysis from './pages/FullAnalysis'
import AnalysisResults from './pages/AnalysisResults'
import Learn from './pages/Learn'
import TipDetail from './pages/TipDetail'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import LanguageSettings from './pages/LanguageSettings'
import MyPhotos from './pages/MyPhotos'
import ShareScore from './pages/ShareScore'
import Admin from './pages/Admin'
import Directory from './pages/Directory'
import DirectoryListings from './pages/DirectoryListings'
import NotFound from './pages/NotFound'

// Layout
import Layout from './components/common/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute -inset-2 border-2 border-primary/20 rounded-[24px]"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-text-muted text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <LandingPage />} />
      <Route path="/chat" element={<Layout><Chat /></Layout>} />
      <Route path="/quick-scan" element={<QuickScan />} />
      <Route path="/analysis" element={<Layout><FullAnalysis /></Layout>} />
      <Route path="/results/:id" element={<Layout><AnalysisResults /></Layout>} />
      <Route path="/learn" element={<Layout><Learn /></Layout>} />
      <Route path="/learn/:id" element={<Layout><TipDetail /></Layout>} />
      <Route path="/share/:id" element={<ShareScore />} />

      {/* Directory routes */}
      <Route path="/directory" element={<Layout><Directory /></Layout>} />
      <Route path="/directory/:type" element={<Layout><DirectoryListings /></Layout>} />
      <Route path="/directory/city/:citySlug" element={<Layout><DirectoryListings /></Layout>} />

      {/* Protected routes */}
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
      <Route path="/profile/edit" element={<Layout><EditProfile /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/settings/language" element={<Layout><LanguageSettings /></Layout>} />
      <Route path="/myphotos" element={<Layout><MyPhotos /></Layout>} />
      
      {/* Admin route - no Layout wrapper to avoid user nav bars */}
      <Route path="/admin" element={<Admin />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
