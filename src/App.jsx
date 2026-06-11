import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Layout from './components/common/Layout'

// Pages — lazy-loaded so each route ships as its own chunk
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Chat = lazy(() => import('./pages/Chat'))
const QuickScan = lazy(() => import('./pages/QuickScan'))
const FullAnalysis = lazy(() => import('./pages/FullAnalysis'))
const AnalysisResults = lazy(() => import('./pages/AnalysisResults'))
const Learn = lazy(() => import('./pages/Learn'))
const TipDetail = lazy(() => import('./pages/TipDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const Settings = lazy(() => import('./pages/Settings'))
const LanguageSettings = lazy(() => import('./pages/LanguageSettings'))
const MyPhotos = lazy(() => import('./pages/MyPhotos'))
const ShareScore = lazy(() => import('./pages/ShareScore'))
const Admin = lazy(() => import('./pages/Admin'))
const Directory = lazy(() => import('./pages/Directory'))
const DirectoryListings = lazy(() => import('./pages/DirectoryListings'))
const NotFound = lazy(() => import('./pages/NotFound'))

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  )
}

export default App
