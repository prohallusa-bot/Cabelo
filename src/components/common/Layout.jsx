import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const Layout = ({ children }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Update on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Pages that hide navigation
  const hideNav = ['/quick-scan'].includes(location.pathname)

  if (hideNav) {
    return <div className="min-h-screen bg-white">{children}</div>
  }

  // Guest sidebar is always 180px and always visible; auth sidebar is 280px and toggleable
  const sidebarMargin = !isMobile
    ? (user
      ? (sidebarOpen ? 'ml-[280px]' : 'ml-0')
      : 'ml-[180px]')
    : ''

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1
          ${isMobile ? 'pb-20' : ''}
          ${sidebarMargin}
          min-h-screen
          transition-all duration-300
        `}
      >
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  )
}

export default Layout
