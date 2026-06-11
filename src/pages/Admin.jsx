import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../services/firebase'
import { useLanguage } from '../context/LanguageContext'
import {
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllUsers,
  getAllChats,
  getAllAnalyses,
  updateUserData,
  getAdminEmails,
  saveAdminEmails,
  getNotificationSettings,
  saveNotificationSettings,
  getInactiveUsersWithTokens
} from '../services/firebase'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Download,
  Users,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  Ban,
  CheckCircle,
  Eye,
  ArrowLeft,
  Clock,
  Image as ImageIcon,
  Search,
  Filter,
  Mail,
  User as UserIcon,
  LogOut,
  Bell
} from 'lucide-react'

const CATEGORIES = [
  'Hydration',
  'Frizz Control',
  'Strength',
  'Shine',
  'Scalp Health',
  'Night Care',
  'Keratin',
  'General'
]

const COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100' },
  { value: 'green', label: 'Green', class: 'bg-green-100' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-100' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100' },
]

// Editorial Beauty Color Palette
const colors = {
  cream: '#FAF9F7',
  warmWhite: '#FFFEFA',
  charcoal: '#2D2A26',
  warmGray: '#8A857D',
  lightGray: '#E8E6E3',
  accent: '#B8A88A',
  pastelGreen: '#D4E8D1',
  pastelBlue: '#D1E3E8',
  pastelYellow: '#E8E4D1',
  pastelPurple: '#E1D1E8',
  pastelPink: '#E8D1D8',
  pastelCyan: '#D1E8E4',
}

const Admin = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { t, supportedLanguages } = useLanguage()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [allChats, setAllChats] = useState([])
  const [allAnalyses, setAllAnalyses] = useState([])
  const [stats, setStats] = useState({ users: 0, analyses: 0, chats: 0, posts: 0 })
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [errors, setErrors] = useState({})
  const [mounted, setMounted] = useState(false)

  // Modal states for viewing user details
  const [selectedUserChats, setSelectedUserChats] = useState(null)
  const [selectedUserAnalyses, setSelectedUserAnalyses] = useState(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)

  // User editing state
  const [editingUser, setEditingUser] = useState(null)
  const [userEditForm, setUserEditForm] = useState({ displayName: '', email: '' })

  // User search and filters
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all') // 'all', 'active', 'banned', 'newest', 'oldest', 'az'
  const [hairTypeFilter, setHairTypeFilter] = useState('all')
  const [concernFilter, setConcernFilter] = useState('all')
  const [porosityFilter, setPorosityFilter] = useState('all')
  const [hasAnalysisFilter, setHasAnalysisFilter] = useState('all')

  // Admin emails management
  const [adminEmails, setAdminEmails] = useState([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [savingAdminEmails, setSavingAdminEmails] = useState(false)

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    inactiveDays: 7,
    title: "We miss you! 💇",
    body: "Your hair care journey awaits. Come back and check your hair health!"
  })
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0)

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    fullContent: '',
    category: 'General',
    color: 'blue',
    readTime: 3,
    ingredients: '',
    language: 'en',
    published: true
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not admin
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/')
    }
  }, [user, isAdmin, navigate])

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allPosts, allUsersData, chatsData, analysesData, adminEmailsList, notifSettings] = await Promise.all([
        getAllBlogPosts(),
        getAllUsers(),
        getAllChats(),
        getAllAnalyses(),
        getAdminEmails(),
        getNotificationSettings()
      ])
      setPosts(allPosts)
      setUsers(allUsersData)
      setAllChats(chatsData)
      setAllAnalyses(analysesData)
      setAdminEmails(adminEmailsList)
      setNotificationSettings(notifSettings)

      // Get count of inactive users
      const inactiveUsers = await getInactiveUsersWithTokens(notifSettings.inactiveDays)
      setInactiveUsersCount(inactiveUsers.length)

      // Calculate stats correctly from actual data
      setStats({
        users: allUsersData.length,
        analyses: analysesData.length, // Count from hairAnalysis collection
        chats: chatsData.length, // Count from chats collection (each doc = 1 user with chats)
        posts: allPosts.length
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ban/unban user
  const handleBanUser = async (uid, currentBanStatus) => {
    try {
      await updateUserData(uid, { isBanned: !currentBanStatus })
      // Refresh users list
      const updatedUsers = users.map(u =>
        u.uid === uid ? { ...u, isBanned: !currentBanStatus } : u
      )
      setUsers(updatedUsers)
    } catch (error) {
      console.error('Error updating ban status:', error)
      alert('Failed to update user status')
    }
  }

  // Get user's chat history (returns all conversations for a user)
  const getUserChatHistory = (uid) => {
    // Filter chats by userId field (not id, which is the conversation ID)
    const userChats = allChats.filter(c => c.userId === uid)
    return userChats
  }

  // Get user's analysis history
  const getUserAnalysisHistory = (uid) => {
    return allAnalyses.filter(a => a.userId === uid)
  }

  // Filter and sort users
  const getFilteredUsers = () => {
    let filtered = [...users]

    // Search filter
    if (userSearch.trim()) {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      )
    }

    // Status filter
    switch (userFilter) {
      case 'active':
        filtered = filtered.filter(u => !u.isBanned)
        break
      case 'banned':
        filtered = filtered.filter(u => u.isBanned)
        break
      case 'newest':
        filtered = filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB - dateA
        })
        break
      case 'oldest':
        filtered = filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateA - dateB
        })
        break
      case 'az':
        filtered = filtered.sort((a, b) =>
          (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
        )
        break
      default:
        break
    }

    // Hair type filter
    if (hairTypeFilter !== 'all') {
      filtered = filtered.filter(u => {
        const userType = (u.hairProfile?.type || u.hairType || '').toLowerCase()
        return userType.includes(hairTypeFilter.toLowerCase())
      })
    }

    // Concern filter
    if (concernFilter !== 'all') {
      filtered = filtered.filter(u => {
        const userConcerns = u.hairProfile?.concerns || u.concerns || []
        return userConcerns.some(c => c.toLowerCase().includes(concernFilter.toLowerCase()))
      })
    }

    // Porosity filter
    if (porosityFilter !== 'all') {
      filtered = filtered.filter(u => {
        const userPorosity = (u.hairProfile?.porosity || u.porosity || '').toLowerCase()
        return userPorosity.includes(porosityFilter.toLowerCase())
      })
    }

    // Has analysis filter
    if (hasAnalysisFilter !== 'all') {
      const usersWithAnalysis = new Set(allAnalyses.map(a => a.userId))
      if (hasAnalysisFilter === 'with') {
        filtered = filtered.filter(u => usersWithAnalysis.has(u.uid))
      } else if (hasAnalysisFilter === 'without') {
        filtered = filtered.filter(u => !usersWithAnalysis.has(u.uid))
      }
    }

    return filtered
  }

  // Open user edit modal
  const handleEditUser = (u) => {
    setEditingUser(u)
    setUserEditForm({
      displayName: u.displayName || '',
      email: u.email || ''
    })
  }

  // Save user edits
  const handleSaveUserEdit = async () => {
    if (!editingUser) return
    try {
      await updateUserData(editingUser.uid, {
        displayName: userEditForm.displayName
      })
      // Update local state
      setUsers(prev => prev.map(u =>
        u.uid === editingUser.uid ? { ...u, displayName: userEditForm.displayName } : u
      ))
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  // Add admin email
  const handleAddAdminEmail = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return
    if (adminEmails.includes(newAdminEmail.toLowerCase())) return

    const updatedEmails = [...adminEmails, newAdminEmail.toLowerCase()]
    setSavingAdminEmails(true)
    try {
      await saveAdminEmails(updatedEmails)
      setAdminEmails(updatedEmails)
      setNewAdminEmail('')
    } catch (error) {
      console.error('Error adding admin email:', error)
      alert('Failed to add admin email')
    } finally {
      setSavingAdminEmails(false)
    }
  }

  // Remove admin email
  const handleRemoveAdminEmail = async (email) => {
    const updatedEmails = adminEmails.filter(e => e !== email)
    setSavingAdminEmails(true)
    try {
      await saveAdminEmails(updatedEmails)
      setAdminEmails(updatedEmails)
    } catch (error) {
      console.error('Error removing admin email:', error)
      alert('Failed to remove admin email')
    } finally {
      setSavingAdminEmails(false)
    }
  }

  // Save notification settings
  const handleSaveNotificationSettings = async () => {
    setSavingNotifications(true)
    try {
      await saveNotificationSettings(notificationSettings)
      // Update inactive users count with new settings
      const inactiveUsers = await getInactiveUsersWithTokens(notificationSettings.inactiveDays)
      setInactiveUsersCount(inactiveUsers.length)
    } catch (error) {
      console.error('Error saving notification settings:', error)
      alert('Failed to save notification settings')
    } finally {
      setSavingNotifications(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (form.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (form.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!form.fullContent.trim()) {
      newErrors.fullContent = 'Content is required'
    } else if (form.fullContent.length < 100) {
      newErrors.fullContent = 'Content must be at least 100 characters'
    }

    if (form.readTime < 1 || form.readTime > 30) {
      newErrors.readTime = 'Read time must be between 1-30 minutes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)

      const postData = {
        ...form,
        ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        readTime: parseInt(form.readTime)
      }

      if (editingPost) {
        await updateBlogPost(editingPost.id, postData)
      } else {
        await createBlogPost(postData)
      }

      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error saving post:', error)
      setErrors({ submit: 'Failed to save post' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (post) => {
    setForm({
      title: post.title || '',
      description: post.description || '',
      fullContent: post.fullContent || '',
      category: post.category || 'General',
      color: post.color || 'blue',
      readTime: post.readTime || 3,
      ingredients: Array.isArray(post.ingredients) ? post.ingredients.join(', ') : '',
      language: post.language || 'en',
      published: post.published !== false
    })
    setEditingPost(post)
    setShowForm(true)
    setErrors({})
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return

    try {
      await deleteBlogPost(postId)
      await loadData()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      fullContent: '',
      category: 'General',
      color: 'blue',
      readTime: 3,
      ingredients: '',
      language: 'en',
      published: true
    })
    setEditingPost(null)
    setShowForm(false)
    setErrors({})
  }

  const handleExportUsers = async () => {
    try {
      setExporting(true)

      // Fetch all user data with chats and analyses
      const [allUsers, allChats, allAnalyses] = await Promise.all([
        getAllUsers(),
        getAllChats(),
        getAllAnalyses()
      ])

      // Combine data - comprehensive export including hair data, analysis data, and chat data
      const exportData = allUsers.map(user => {
        // Get all chats for this user
        const userChats = allChats.filter(c => c.userId === user.uid)
        // Get all analyses for this user
        const userAnalyses = allAnalyses.filter(a => a.userId === user.uid)

        return {
          // User Profile Data
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phone: user.phone || '',
          country: user.country || '',
          city: user.city || '',
          state: user.state || '',
          language: user.language || 'en',
          emailNotifications: user.emailNotifications || false,
          createdAt: user.createdAt?.toDate?.()?.toISOString() || '',
          lastLogin: user.lastLogin?.toDate?.()?.toISOString() || '',
          lastActiveDate: user.lastActiveDate?.toDate?.()?.toISOString() || '',
          streak: user.streak || 0,
          isAdmin: user.isAdmin || false,
          isBanned: user.isBanned || false,

          // Hair Analysis Data (complete)
          analysisCount: userAnalyses.length,
          hairAnalyses: userAnalyses.map(a => ({
            id: a.id,
            shareId: a.shareId,
            analysisType: a.analysisType || 'full',
            createdAt: a.createdAt?.toDate?.()?.toISOString() || a.createdAt || '',

            // Hair Profile
            hairType: a.hair_type,
            hairTypeConfidence: a.hair_type_confidence,
            texture: a.texture,
            density: a.density,
            porosity: a.porosity,

            // Hair Condition
            conditionScore: a.condition_score,
            moistureLevel: a.moisture_level,
            proteinBalance: a.protein_balance,

            // Issues & Recommendations
            concerns: a.concerns || [],
            chemicalHistory: a.chemical_history,
            primaryNeed: a.primary_need,
            recommendations: a.recommendations || [],
            summary: a.summary,

            // Metrics
            hydration: a.hydration,
            shine: a.shine,
            strength: a.strength
          })),

          // AI Chat Data (complete conversations)
          chatCount: userChats.length,
          chatHistory: userChats.map(chat => ({
            conversationId: chat.id,
            lastMessage: chat.lastMessage,
            lastUpdated: chat.lastUpdated || '',
            messageCount: chat.messageCount || 0,
            messages: (chat.messages || []).map(msg => ({
              role: msg.role,
              content: msg.content,
              hasImage: msg.hasImage || false,
              timestamp: msg.timestamp || ''
            }))
          }))
        }
      })

      // Create JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cabelo-full-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exporting users:', error)
      alert('Failed to export users. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)

      // Fetch all data
      const [allUsers, chatsData, analysesData] = await Promise.all([
        getAllUsers(),
        getAllChats(),
        getAllAnalyses()
      ])

      // Create CSV with comprehensive data
      const headers = [
        'UID', 'Email', 'Display Name', 'Phone', 'Country', 'City', 'State',
        'Created At', 'Last Login', 'Last Active', 'Streak', 'Is Admin', 'Is Banned',
        'Analysis Count', 'Chat Count', 'Total Messages',
        'Latest Hair Type', 'Latest Porosity', 'Latest Texture', 'Latest Density',
        'Latest Condition Score', 'Latest Concerns'
      ]

      const rows = allUsers.map(user => {
        // Get user's analyses and chats
        const userAnalyses = analysesData.filter(a => a.userId === user.uid)
        const userChats = chatsData.filter(c => c.userId === user.uid)
        const totalMessages = userChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0)

        // Get latest analysis data
        const latestAnalysis = userAnalyses.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB - dateA
        })[0]

        return [
          user.uid,
          user.email,
          user.displayName || '',
          user.phone || '',
          user.country || '',
          user.city || '',
          user.state || '',
          user.createdAt?.toDate?.()?.toISOString() || '',
          user.lastLogin?.toDate?.()?.toISOString() || '',
          user.lastActiveDate?.toDate?.()?.toISOString() || '',
          user.streak || 0,
          user.isAdmin ? 'Yes' : 'No',
          user.isBanned ? 'Yes' : 'No',
          userAnalyses.length,
          userChats.length,
          totalMessages,
          latestAnalysis?.hair_type || '',
          latestAnalysis?.porosity || '',
          latestAnalysis?.texture || '',
          latestAnalysis?.density || '',
          latestAnalysis?.condition_score || '',
          (latestAnalysis?.concerns || []).join('; ')
        ]
      })

      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cabelo-users-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setExporting(false)
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!isAdmin) return null

  return (
    <div
      className="min-h-screen admin-theme"
      style={{ backgroundColor: colors.cream, fontFamily: "'Instrument Serif', Georgia, serif" }}
    >
      {/* Grain overlay */}
      <div className="grain-overlay" />

      <div className="flex">
        {/* Sidebar */}
        <aside
          className="fixed left-0 top-0 h-screen w-60 border-r flex flex-col z-50"
          style={{
            backgroundColor: colors.warmWhite,
            borderColor: colors.lightGray,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Logo */}
          <div className="p-8 border-b" style={{ borderColor: colors.lightGray }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: `linear-gradient(145deg, ${colors.charcoal} 0%, #4A4540 100%)`,
                  color: colors.cream,
                  boxShadow: '0 4px 12px rgba(45, 42, 38, 0.15)'
                }}
              >
                C
              </div>
              <div>
                <div className="text-lg" style={{ color: colors.charcoal, letterSpacing: '-0.5px' }}>
                  Cabelo.ai
                </div>
                <div
                  className="text-xs uppercase tracking-widest admin-body"
                  style={{ color: colors.warmGray }}
                >
                  Admin
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div
              className="text-xs uppercase tracking-widest mb-4 px-3 admin-body"
              style={{ color: colors.warmGray }}
            >
              Menu
            </div>

            {navItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full px-4 py-3 rounded-lg mb-1 flex items-center gap-3 text-left admin-body transition-all"
                  style={{
                    backgroundColor: activeSection === item.id ? '#F0EDE8' : 'transparent',
                    color: activeSection === item.id ? colors.charcoal : '#6B665E',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                    transitionDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className="w-5 h-5 opacity-70" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-5 border-t" style={{ borderColor: colors.lightGray }}>
            <div
              className="flex items-center gap-3 p-3 rounded-lg mb-3"
              style={{ backgroundColor: '#F7F5F2' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium admin-body"
                style={{ background: `linear-gradient(145deg, ${colors.pastelGreen} 0%, #B8D4B4 100%)`, color: colors.charcoal }}
              >
                {user?.displayName?.[0] || user?.email?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium admin-body truncate" style={{ color: colors.charcoal }}>
                  {user?.displayName || 'Admin'}
                </div>
                <div className="text-xs admin-body" style={{ color: colors.warmGray }}>
                  Owner
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 admin-body text-sm font-medium transition-all hover:bg-red-50"
              style={{ color: '#DC2626', border: `1px solid #FEE2E2` }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 ml-60 p-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '0.2s'
          }}
        >
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <>
              <header className="mb-12">
                <p
                  className="text-xs uppercase tracking-widest mb-2 admin-body"
                  style={{ color: colors.warmGray }}
                >
                  Welcome back
                </p>
                <h1
                  className="text-4xl"
                  style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                >
                  Dashboard
                </h1>
              </header>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Total Users', value: stats.users, sub: 'Registered', color: colors.pastelGreen },
                  { label: 'Analyses', value: stats.analyses, sub: 'Completed', color: colors.pastelBlue },
                  { label: 'Chat Users', value: stats.chats, sub: 'Active', color: colors.pastelYellow },
                  { label: 'Blog Posts', value: stats.posts, sub: 'Published', color: colors.pastelPurple },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="rounded-2xl p-7 border relative overflow-hidden"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <div
                      className="absolute -top-5 -right-5 w-24 h-24 rounded-full"
                      style={{ backgroundColor: stat.color, opacity: 0.4 }}
                    />
                    <div
                      className="text-xs uppercase tracking-widest mb-3 admin-body"
                      style={{ color: colors.warmGray }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="text-4xl mb-1"
                      style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                    >
                      {loading ? '...' : stat.value}
                    </div>
                    <div className="text-sm admin-body" style={{ color: colors.warmGray }}>
                      {stat.sub}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  className="rounded-2xl p-8 border"
                  style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                >
                  <h2 className="text-xl mb-6" style={{ color: colors.charcoal, letterSpacing: '-0.3px' }}>
                    Quick Actions
                  </h2>

                  {[
                    { label: 'Export Users (JSON)', action: handleExportUsers, color: colors.pastelGreen, icon: Download },
                    { label: 'Export Users (CSV)', action: handleExportCSV, color: colors.pastelBlue, icon: Download },
                    { label: 'New Blog Post', action: () => { setActiveSection('content'); setShowForm(true) }, color: colors.pastelPurple, icon: Plus },
                  ].map((action, i) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={i}
                        onClick={action.action}
                        disabled={exporting}
                        className="w-full px-5 py-4 rounded-xl border mb-3 flex items-center gap-4 text-left admin-body transition-all hover:translate-x-1 disabled:opacity-50"
                        style={{
                          backgroundColor: colors.warmWhite,
                          borderColor: colors.lightGray,
                          color: colors.charcoal
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: action.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        {action.label}
                        <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                      </button>
                    )
                  })}
                </div>

                {/* Recent Users */}
                <div
                  className="rounded-2xl p-8 border"
                  style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl" style={{ color: colors.charcoal, letterSpacing: '-0.3px' }}>
                      Recent Users
                    </h2>
                    <button
                      onClick={() => setActiveSection('users')}
                      className="text-sm admin-body underline underline-offset-2"
                      style={{ color: colors.warmGray }}
                    >
                      View all
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-8 text-center">
                      <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: `${colors.lightGray}`, borderTopColor: colors.charcoal }} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.slice(0, 5).map((u, i) => (
                        <div
                          key={u.uid || i}
                          className="flex items-center gap-4 py-3 border-b last:border-0"
                          style={{ borderColor: '#F0EDE8' }}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium admin-body"
                            style={{ backgroundColor: colors.pastelGreen, color: colors.charcoal }}
                          >
                            {u.displayName?.[0] || u.email?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium admin-body truncate" style={{ color: colors.charcoal }}>
                              {u.displayName || u.email?.split('@')[0]}
                            </div>
                            <div className="text-xs admin-body truncate" style={{ color: colors.warmGray }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics Section */}
              <div className="mt-12">
                <h2 className="text-2xl mb-6" style={{ color: colors.charcoal, letterSpacing: '-0.5px' }}>
                  Analytics Overview
                </h2>

                {/* Hair Type Distribution */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div
                    className="rounded-2xl p-8 border"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <h3 className="text-lg mb-6 admin-body" style={{ color: colors.charcoal }}>
                      Hair Type Distribution
                    </h3>
                    {(() => {
                      const hairTypes = {}
                      // Get from hairAnalysis collection (allAnalyses)
                      allAnalyses.forEach(a => {
                        const type = a.hair_type || ''
                        if (type) {
                          let typeName = type
                          if (type.startsWith('1')) typeName = `Straight (${type})`
                          else if (type.startsWith('2')) typeName = `Wavy (${type})`
                          else if (type.startsWith('3')) typeName = `Curly (${type})`
                          else if (type.startsWith('4')) typeName = `Coily (${type})`
                          hairTypes[typeName] = (hairTypes[typeName] || 0) + 1
                        }
                      })
                      const total = allAnalyses.length || 1
                      const getColor = (type) => {
                        if (type.includes('Straight')) return colors.pastelBlue
                        if (type.includes('Wavy')) return colors.pastelGreen
                        if (type.includes('Curly')) return colors.pastelYellow
                        if (type.includes('Coily')) return colors.pastelPurple
                        return colors.pastelCyan
                      }
                      return (
                        <div className="space-y-3">
                          {Object.keys(hairTypes).length > 0 ? (
                            Object.entries(hairTypes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => (
                              <div key={type}>
                                <div className="flex justify-between text-sm mb-1 admin-body">
                                  <span style={{ color: colors.charcoal }}>{type}</span>
                                  <span style={{ color: colors.warmGray }}>{count} ({Math.round(count/total*100)}%)</span>
                                </div>
                                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.lightGray }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${(count/total)*100}%`,
                                      backgroundColor: getColor(type)
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm admin-body" style={{ color: colors.warmGray }}>No analysis data yet</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Top Concerns */}
                  <div
                    className="rounded-2xl p-8 border"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <h3 className="text-lg mb-6 admin-body" style={{ color: colors.charcoal }}>
                      Top Hair Concerns
                    </h3>
                    {(() => {
                      const concerns = {}
                      // Get from hairAnalysis collection only
                      allAnalyses.forEach(a => {
                        const userConcerns = a.concerns || []
                        userConcerns.forEach(c => {
                          concerns[c] = (concerns[c] || 0) + 1
                        })
                      })
                      const concernColors = [colors.pastelPink, colors.pastelYellow, colors.pastelBlue, colors.pastelGreen, colors.pastelPurple]
                      return (
                        <div className="space-y-3">
                          {Object.entries(concerns).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([concern, count], i) => (
                            <div key={concern} className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: concernColors[i % concernColors.length] }}
                              />
                              <span className="flex-1 text-sm admin-body" style={{ color: colors.charcoal }}>{concern}</span>
                              <span className="text-sm admin-body" style={{ color: colors.warmGray }}>{count}</span>
                            </div>
                          ))}
                          {Object.keys(concerns).length === 0 && (
                            <p className="text-sm admin-body" style={{ color: colors.warmGray }}>No concerns data yet</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Analysis Score Distribution & Porosity */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* Average Condition Score */}
                  <div
                    className="rounded-2xl p-8 border text-center"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <h3 className="text-sm uppercase tracking-widest mb-4 admin-body" style={{ color: colors.warmGray }}>
                      Avg Condition
                    </h3>
                    <div className="text-5xl mb-2" style={{ color: colors.charcoal, letterSpacing: '-2px' }}>
                      {(() => {
                        const scores = allAnalyses.map(a => a.condition_score).filter(s => s > 0)
                        return scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : '-'
                      })()}
                    </div>
                    <p className="text-sm admin-body" style={{ color: colors.warmGray }}>out of 10</p>
                  </div>

                  {/* Porosity Distribution */}
                  <div
                    className="rounded-2xl p-8 border"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <h3 className="text-sm uppercase tracking-widest mb-4 admin-body" style={{ color: colors.warmGray }}>
                      Porosity
                    </h3>
                    {(() => {
                      const porosity = { Low: 0, Medium: 0, High: 0 }
                      // Get from hairAnalysis collection only
                      allAnalyses.forEach(a => {
                        const p = (a.porosity || '').toLowerCase()
                        if (p.includes('low')) porosity.Low++
                        else if (p.includes('high')) porosity.High++
                        else if (p.includes('medium') || p.includes('normal')) porosity.Medium++
                      })
                      const total = allAnalyses.length || 1
                      return (
                        <div className="flex gap-2 h-20">
                          {Object.entries(porosity).map(([level, count], i) => (
                            <div key={level} className="flex-1 flex flex-col items-center justify-end">
                              <span className="text-xs mb-1 admin-body" style={{ color: colors.charcoal }}>{count}</span>
                              <div
                                className="w-full rounded-t transition-all"
                                style={{
                                  height: `${Math.max((count / total) * 100, count > 0 ? 15 : 0)}%`,
                                  backgroundColor: [colors.pastelBlue, colors.pastelGreen, colors.pastelYellow][i],
                                  minHeight: count > 0 ? '12px' : '0'
                                }}
                              />
                              <span className="text-xs mt-2 admin-body" style={{ color: colors.warmGray }}>{level}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Primary Needs */}
                  <div
                    className="rounded-2xl p-8 border"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <h3 className="text-sm uppercase tracking-widest mb-4 admin-body" style={{ color: colors.warmGray }}>
                      Primary Needs
                    </h3>
                    {(() => {
                      const needs = {}
                      allAnalyses.forEach(a => {
                        const need = a.primary_need || ''
                        if (need) needs[need] = (needs[need] || 0) + 1
                      })
                      return (
                        <div className="space-y-2">
                          {Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([need, count]) => (
                            <div key={need} className="flex justify-between text-sm admin-body">
                              <span style={{ color: colors.charcoal }}>{need}</span>
                              <span style={{ color: colors.warmGray }}>{count}</span>
                            </div>
                          ))}
                          {Object.keys(needs).length === 0 && (
                            <p className="text-sm admin-body" style={{ color: colors.warmGray }}>No data yet</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Total Analyses',
                      value: allAnalyses.length,
                      sub: `${allAnalyses.filter(a => a.analysisType === 'full').length} full, ${allAnalyses.filter(a => a.analysisType === 'quick').length} quick`,
                      color: colors.pastelGreen
                    },
                    {
                      label: 'Users Analyzed',
                      value: new Set(allAnalyses.map(a => a.userId)).size,
                      sub: `of ${users.length} users`,
                      color: colors.pastelBlue
                    },
                    {
                      label: 'AI Coach Sessions',
                      value: allChats.length,
                      sub: 'conversations',
                      color: colors.pastelYellow
                    }
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-5 border"
                      style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                    >
                      <div className="text-xs uppercase tracking-widest mb-2 admin-body" style={{ color: colors.warmGray }}>
                        {stat.label}
                      </div>
                      <div className="text-3xl mb-1" style={{ color: colors.charcoal }}>{stat.value}</div>
                      <div className="text-sm admin-body" style={{ color: colors.warmGray }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <>
              <header className="flex justify-between items-start mb-6">
                <div>
                  <p
                    className="text-xs uppercase tracking-widest mb-2 font-body"
                    style={{ color: colors.warmGray }}
                  >
                    Manage
                  </p>
                  <h1
                    className="text-4xl font-serif"
                    style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                  >
                    Users
                  </h1>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="px-5 py-3 rounded-xl flex items-center gap-2 font-body font-medium transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: colors.warmWhite,
                      border: `1px solid ${colors.lightGray}`,
                      color: colors.charcoal
                    }}
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={handleExportUsers}
                    disabled={exporting}
                    className="px-5 py-3 rounded-xl flex items-center gap-2 font-body font-medium transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: colors.charcoal,
                      color: colors.cream,
                      boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export All (JSON)
                  </button>
                </div>
              </header>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                {/* Search Row */}
                <div className="flex gap-4">
                  {/* Search */}
                  <div
                    className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                  >
                    <Search className="w-5 h-5" style={{ color: colors.warmGray }} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1 bg-transparent outline-none font-body"
                      style={{ color: colors.charcoal }}
                    />
                    {userSearch && (
                      <button onClick={() => setUserSearch('')}>
                        <X className="w-4 h-4" style={{ color: colors.warmGray }} />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border font-body cursor-pointer"
                    style={{
                      backgroundColor: colors.warmWhite,
                      borderColor: colors.lightGray,
                      color: colors.charcoal
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z by Name</option>
                  </select>
                </div>

                {/* Advanced Filters Row */}
                <div className="flex gap-3 flex-wrap">
                  {/* Hair Type Filter */}
                  <select
                    value={hairTypeFilter}
                    onChange={(e) => setHairTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm font-body cursor-pointer"
                    style={{
                      backgroundColor: hairTypeFilter !== 'all' ? colors.pastelGreen : colors.warmWhite,
                      borderColor: colors.lightGray,
                      color: colors.charcoal
                    }}
                  >
                    <option value="all">All Hair Types</option>
                    <option value="straight">Straight</option>
                    <option value="wavy">Wavy</option>
                    <option value="curly">Curly</option>
                    <option value="coily">Coily</option>
                  </select>

                  {/* Porosity Filter */}
                  <select
                    value={porosityFilter}
                    onChange={(e) => setPorosityFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm font-body cursor-pointer"
                    style={{
                      backgroundColor: porosityFilter !== 'all' ? colors.pastelBlue : colors.warmWhite,
                      borderColor: colors.lightGray,
                      color: colors.charcoal
                    }}
                  >
                    <option value="all">All Porosity</option>
                    <option value="low">Low Porosity</option>
                    <option value="medium">Medium Porosity</option>
                    <option value="high">High Porosity</option>
                  </select>

                  {/* Concern Filter */}
                  <select
                    value={concernFilter}
                    onChange={(e) => setConcernFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm font-body cursor-pointer"
                    style={{
                      backgroundColor: concernFilter !== 'all' ? colors.pastelYellow : colors.warmWhite,
                      borderColor: colors.lightGray,
                      color: colors.charcoal
                    }}
                  >
                    <option value="all">All Concerns</option>
                    <option value="dryness">Dryness</option>
                    <option value="frizz">Frizz</option>
                    <option value="damage">Damage</option>
                    <option value="breakage">Breakage</option>
                    <option value="split">Split Ends</option>
                    <option value="thinning">Thinning</option>
                    <option value="oily">Oiliness</option>
                    <option value="dandruff">Dandruff</option>
                  </select>

                  {/* Analysis Filter */}
                  <select
                    value={hasAnalysisFilter}
                    onChange={(e) => setHasAnalysisFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm font-body cursor-pointer"
                    style={{
                      backgroundColor: hasAnalysisFilter !== 'all' ? colors.pastelPurple : colors.warmWhite,
                      borderColor: colors.lightGray,
                      color: colors.charcoal
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="with">With Analysis</option>
                    <option value="without">Without Analysis</option>
                  </select>

                  {/* Clear Filters */}
                  {(hairTypeFilter !== 'all' || concernFilter !== 'all' || porosityFilter !== 'all' || hasAnalysisFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setHairTypeFilter('all')
                        setConcernFilter('all')
                        setPorosityFilter('all')
                        setHasAnalysisFilter('all')
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-body flex items-center gap-1"
                      style={{ color: colors.warmGray }}
                    >
                      <X className="w-3 h-3" />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm font-body mb-4" style={{ color: colors.warmGray }}>
                Showing {getFilteredUsers().length} of {users.length} users
              </p>

              {/* Users Table */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
              >
                {/* Header */}
                <div
                  className="grid grid-cols-7 gap-4 px-7 py-4 border-b text-xs uppercase tracking-widest font-body"
                  style={{ backgroundColor: '#F7F5F2', borderColor: colors.lightGray, color: colors.warmGray }}
                >
                  <div>User</div>
                  <div>Email</div>
                  <div>Joined</div>
                  <div>Status</div>
                  <div>Chats</div>
                  <div>Analyses</div>
                  <div>Actions</div>
                </div>

                {/* Rows */}
                {loading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: colors.lightGray, borderTopColor: colors.charcoal }} />
                  </div>
                ) : getFilteredUsers().length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4" style={{ color: colors.lightGray }} />
                    <p className="font-body" style={{ color: colors.warmGray }}>
                      {userSearch ? 'No users match your search' : 'No users yet'}
                    </p>
                  </div>
                ) : (
                  getFilteredUsers().map((u, i) => {
                    const userChats = getUserChatHistory(u.uid)
                    const userAnalyses = getUserAnalysisHistory(u.uid)
                    return (
                      <div
                        key={u.uid || i}
                        className={`grid grid-cols-7 gap-4 px-7 py-5 border-b last:border-0 items-center transition-colors ${u.isBanned ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                        style={{ borderColor: '#F0EDE8' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium font-body"
                            style={{ backgroundColor: u.isBanned ? '#FEE2E2' : colors.pastelGreen, color: colors.charcoal }}
                          >
                            {u.displayName?.[0] || u.email?.[0] || '?'}
                          </div>
                          <div>
                            <span className="font-medium font-body block" style={{ color: colors.charcoal }}>
                              {u.displayName || 'No name'}
                            </span>
                            {u.isAdmin && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-body truncate" style={{ color: '#6B665E' }}>
                          {u.email}
                        </div>
                        <div className="text-sm font-body" style={{ color: '#A8A29E' }}>
                          {u.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </div>
                        <div className="text-sm font-body">
                          {u.isBanned ? (
                            <span className="text-red-600 font-medium">Banned</span>
                          ) : (
                            <span className="text-green-600">Active</span>
                          )}
                        </div>
                        <div className="text-sm font-body" style={{ color: colors.charcoal }}>
                          {userChats.length > 0 ? (
                            <button
                              onClick={() => setSelectedUserChats({ user: u, conversations: userChats })}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {userChats.reduce((total, chat) => total + (chat.messages?.length || 0), 0)}
                            </button>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                        <div className="text-sm font-body" style={{ color: colors.charcoal }}>
                          {userAnalyses.length > 0 ? (
                            <button
                              onClick={() => setSelectedUserAnalyses({ user: u, analyses: userAnalyses })}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <BarChart3 className="w-4 h-4" />
                              {userAnalyses.length}
                            </button>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBanUser(u.uid, u.isBanned)}
                            className={`p-2 rounded-lg transition-colors ${u.isBanned ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                            title={u.isBanned ? 'Unban user' : 'Ban user'}
                          >
                            {u.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* Content Section */}
          {activeSection === 'content' && (
            <>
              <header className="flex justify-between items-start mb-10">
                <div>
                  <p
                    className="text-xs uppercase tracking-widest mb-2 admin-body"
                    style={{ color: colors.warmGray }}
                  >
                    Manage
                  </p>
                  <h1
                    className="text-4xl"
                    style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                  >
                    Blog Posts
                  </h1>
                </div>
                <button
                  onClick={() => { resetForm(); setShowForm(true) }}
                  className="px-6 py-3 rounded-xl flex items-center gap-2 admin-body font-medium transition-all"
                  style={{
                    backgroundColor: colors.charcoal,
                    color: colors.cream,
                    boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                  }}
                >
                  <Plus className="w-5 h-5" />
                  New Post
                </button>
              </header>

              {/* Posts Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: colors.lightGray, borderTopColor: colors.charcoal }} />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: colors.lightGray }} />
                  <p className="admin-body" style={{ color: colors.warmGray }}>No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-2xl p-6 border"
                      style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${COLORS.find(c => c.value === post.color)?.class || 'bg-gray-100'}`}
                          />
                          <h3 className="font-medium admin-body" style={{ color: colors.charcoal }}>
                            {post.title}
                          </h3>
                        </div>
                        {!post.published && (
                          <span
                            className="text-xs px-2 py-0.5 rounded admin-body"
                            style={{ backgroundColor: '#F0EDE8', color: '#6B665E' }}
                          >
                            Draft
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm mb-4 line-clamp-2 admin-body"
                        style={{ color: colors.warmGray }}
                      >
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs admin-body" style={{ color: '#A8A29E' }}>
                          <span>{post.category}</span>
                          <span>{post.readTime} min read</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: colors.warmGray }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            style={{ color: colors.warmGray }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <>
              <header className="mb-10">
                <p
                  className="text-xs uppercase tracking-widest mb-2 font-body"
                  style={{ color: colors.warmGray }}
                >
                  Configure
                </p>
                <h1
                  className="text-4xl font-serif"
                  style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                >
                  Push Notifications
                </h1>
              </header>

              {/* Status Card */}
              <div
                className="rounded-2xl p-6 border mb-6 flex items-center justify-between"
                style={{ backgroundColor: notificationSettings.enabled ? colors.pastelGreen : '#FEE2E2', borderColor: colors.lightGray }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: notificationSettings.enabled ? '#16A34A' : '#DC2626' }}
                  >
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg" style={{ color: colors.charcoal }}>
                      {notificationSettings.enabled ? 'Notifications Active' : 'Notifications Disabled'}
                    </h3>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>
                      {inactiveUsersCount} users inactive for {notificationSettings.inactiveDays}+ days
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-5 py-2.5 rounded-xl font-body font-medium transition-all ${
                    notificationSettings.enabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {notificationSettings.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Settings Card */}
              <div
                className="rounded-2xl p-8 border max-w-2xl"
                style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
              >
                <h3 className="text-lg font-serif mb-6" style={{ color: colors.charcoal }}>
                  Re-engagement Notification
                </h3>

                {/* Inactive Days Setting */}
                <div className="mb-6">
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Send notification after X days of inactivity
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={notificationSettings.inactiveDays}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        inactiveDays: Math.max(1, Math.min(90, parseInt(e.target.value) || 7))
                      }))}
                      className="w-24 px-4 py-3 rounded-xl border font-body text-center"
                      style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                    />
                    <span className="font-body" style={{ color: colors.warmGray }}>days</span>
                  </div>
                  <p className="text-xs mt-2 font-body" style={{ color: colors.warmGray }}>
                    Users who haven't been active for this many days will receive a push notification.
                  </p>
                </div>

                {/* Notification Title */}
                <div className="mb-6">
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={notificationSettings.title}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="We miss you! 💇"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border font-body"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  />
                  <p className="text-xs mt-1 font-body text-right" style={{ color: colors.warmGray }}>
                    {notificationSettings.title.length}/50
                  </p>
                </div>

                {/* Notification Body */}
                <div className="mb-6">
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Notification Message
                  </label>
                  <textarea
                    value={notificationSettings.body}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Your hair care journey awaits. Come back and check your hair health!"
                    maxLength={150}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border font-body resize-none"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  />
                  <p className="text-xs mt-1 font-body text-right" style={{ color: colors.warmGray }}>
                    {notificationSettings.body.length}/150
                  </p>
                </div>

                {/* Preview */}
                <div className="mb-6">
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Preview
                  </label>
                  <div
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">C</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium">Cabelo.ai</span>
                          <span className="text-gray-400 text-xs">now</span>
                        </div>
                        <p className="text-white text-sm font-medium mb-0.5">{notificationSettings.title || 'Notification Title'}</p>
                        <p className="text-gray-300 text-sm">{notificationSettings.body || 'Notification message will appear here.'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveNotificationSettings}
                  disabled={savingNotifications}
                  className="w-full px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-body font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: colors.charcoal,
                    color: colors.cream
                  }}
                >
                  {savingNotifications ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {savingNotifications ? 'Saving...' : 'Save Settings'}
                </button>

                <p className="text-xs mt-4 font-body text-center" style={{ color: colors.warmGray }}>
                  Settings are saved to the database. A Cloud Function will send notifications automatically.
                </p>
              </div>

              {/* Setup Instructions */}
              <div
                className="rounded-2xl p-8 border max-w-2xl mt-6"
                style={{ backgroundColor: colors.pastelBlue, borderColor: colors.lightGray }}
              >
                <h3 className="text-lg font-serif mb-4" style={{ color: colors.charcoal }}>
                  Setup Required
                </h3>
                <p className="text-sm font-body mb-4" style={{ color: colors.charcoal }}>
                  To enable push notifications, you need to:
                </p>
                <ol className="text-sm font-body space-y-2" style={{ color: colors.charcoal }}>
                  <li className="flex gap-2">
                    <span className="font-medium">1.</span>
                    <span>Set up Firebase Cloud Messaging (FCM) in Firebase Console</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">2.</span>
                    <span>Add the FCM service worker to your app</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">3.</span>
                    <span>Deploy the Cloud Function to check inactive users daily</span>
                  </li>
                </ol>
                <p className="text-xs font-body mt-4" style={{ color: colors.warmGray }}>
                  See the setup guide below for detailed instructions.
                </p>
              </div>
            </>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <>
              <header className="mb-10">
                <p
                  className="text-xs uppercase tracking-widest mb-2 font-body"
                  style={{ color: colors.warmGray }}
                >
                  Configure
                </p>
                <h1
                  className="text-4xl font-serif"
                  style={{ color: colors.charcoal, letterSpacing: '-1px' }}
                >
                  Settings
                </h1>
              </header>

              {/* Admin Emails */}
              <div
                className="rounded-2xl p-8 border max-w-2xl"
                style={{ backgroundColor: colors.warmWhite, borderColor: colors.lightGray }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-serif" style={{ color: colors.charcoal }}>
                      Admin Emails
                    </h3>
                    <p className="text-sm font-body mt-1" style={{ color: colors.warmGray }}>
                      Users with these emails have admin access
                    </p>
                  </div>
                </div>

                {/* Admin email list */}
                <div className="space-y-3 mb-6">
                  {adminEmails.map((email, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl border"
                      style={{ backgroundColor: colors.cream, borderColor: colors.lightGray }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colors.pastelPurple }}
                        >
                          <Mail className="w-5 h-5" style={{ color: colors.charcoal }} />
                        </div>
                        <span className="font-body font-medium" style={{ color: colors.charcoal }}>
                          {email}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveAdminEmail(email)}
                        disabled={savingAdminEmails}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors disabled:opacity-50"
                        title="Remove admin"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new admin email */}
                <div className="flex gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray }}
                  >
                    <Mail className="w-5 h-5" style={{ color: colors.warmGray }} />
                    <input
                      type="email"
                      placeholder="Enter email address..."
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAdminEmail()}
                      className="flex-1 bg-transparent outline-none font-body"
                      style={{ color: colors.charcoal }}
                    />
                  </div>
                  <button
                    onClick={handleAddAdminEmail}
                    disabled={!newAdminEmail.trim() || !newAdminEmail.includes('@') || savingAdminEmails}
                    className="px-5 py-3 rounded-xl flex items-center gap-2 font-body font-medium transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: colors.charcoal,
                      color: colors.cream
                    }}
                  >
                    {savingAdminEmails ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {savingAdminEmails ? 'Saving...' : 'Add Admin'}
                  </button>
                </div>

                <p className="text-xs mt-4 font-body" style={{ color: colors.warmGray }}>
                  Changes are automatically saved to the database.
                </p>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 w-full max-w-2xl my-8 shadow-2xl"
            style={{ backgroundColor: colors.warmWhite }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl" style={{ color: colors.charcoal, letterSpacing: '-0.5px' }}>
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <button
                onClick={resetForm}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F0EDE8', color: '#6B665E' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Language */}
              <div>
                <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                  Language *
                </label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border admin-body"
                  style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Deep Hydration Tips"
                  className={`w-full px-4 py-3 rounded-xl border admin-body ${errors.title ? 'border-red-300' : ''}`}
                  style={{ backgroundColor: colors.cream, borderColor: errors.title ? '#FCA5A5' : colors.lightGray, color: colors.charcoal }}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 admin-body">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Short description shown in the card..."
                  className={`w-full px-4 py-3 rounded-xl border admin-body resize-none ${errors.description ? 'border-red-300' : ''}`}
                  style={{ backgroundColor: colors.cream, borderColor: errors.description ? '#FCA5A5' : colors.lightGray, color: colors.charcoal }}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1 admin-body">{errors.description}</p>}
              </div>

              {/* Full Content */}
              <div>
                <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                  Content * (Markdown supported)
                </label>
                <textarea
                  value={form.fullContent}
                  onChange={(e) => setForm({ ...form, fullContent: e.target.value })}
                  rows={8}
                  placeholder="Full article content with **bold**, *italic*, - lists..."
                  className={`w-full px-4 py-3 rounded-xl border font-mono text-sm resize-none ${errors.fullContent ? 'border-red-300' : ''}`}
                  style={{ backgroundColor: colors.cream, borderColor: errors.fullContent ? '#FCA5A5' : colors.lightGray, color: colors.charcoal }}
                />
                {errors.fullContent && <p className="text-red-500 text-xs mt-1 admin-body">{errors.fullContent}</p>}
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border admin-body"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                    Color
                  </label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border admin-body"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  >
                    {COLORS.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Read Time & Ingredients */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                    Read Time (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.readTime}
                    onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border admin-body ${errors.readTime ? 'border-red-300' : ''}`}
                    style={{ backgroundColor: colors.cream, borderColor: errors.readTime ? '#FCA5A5' : colors.lightGray, color: colors.charcoal }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium admin-body block mb-2" style={{ color: '#6B665E' }}>
                    Ingredients
                  </label>
                  <input
                    type="text"
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    placeholder="Aloe Vera, Keratin, Argan Oil"
                    className="w-full px-4 py-3 rounded-xl border admin-body"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  />
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, published: !form.published })}
                  className="w-12 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: form.published ? '#22C55E' : colors.lightGray }}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: form.published ? 'translateX(26px)' : 'translateX(2px)' }}
                  />
                </button>
                <span className="text-sm admin-body" style={{ color: colors.charcoal }}>
                  {form.published ? 'Published' : 'Draft'}
                </span>
              </div>

              {errors.submit && (
                <p className="text-red-500 text-sm text-center admin-body">{errors.submit}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-4 rounded-xl border admin-body transition-colors"
                  style={{ borderColor: colors.lightGray, color: colors.warmGray }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 rounded-xl admin-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: colors.charcoal,
                    color: colors.cream,
                    boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                  }}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingPost ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Chat History Modal */}
      <AnimatePresence>
        {selectedUserChats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedUserChats(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.lightGray }}>
                <div>
                  <h3 className="font-serif text-xl" style={{ color: colors.charcoal }}>
                    Chat History
                  </h3>
                  <p className="text-sm font-body" style={{ color: colors.warmGray }}>
                    {selectedUserChats.user.displayName || selectedUserChats.user.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserChats(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: colors.warmGray }} />
                </button>
              </div>

              {/* Messages */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {!selectedUserChats.conversations || selectedUserChats.conversations.length === 0 ? (
                  <p className="text-center font-body" style={{ color: colors.warmGray }}>No conversations</p>
                ) : (
                  selectedUserChats.conversations.map((conversation, convIdx) => (
                    <div key={conversation.id || convIdx} className="border rounded-xl p-4" style={{ borderColor: colors.lightGray }}>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: colors.lightGray }}>
                        <span className="text-xs font-body font-medium" style={{ color: colors.warmGray }}>
                          Conversation {convIdx + 1}
                        </span>
                        <span className="text-xs font-body" style={{ color: colors.warmGray }}>
                          {conversation.lastUpdated ? new Date(conversation.lastUpdated).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {(conversation.messages || []).map((msg, i) => (
                          <div
                            key={msg.id || i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {msg.image && (
                                <div className="mb-2">
                                  <img
                                    src={msg.image}
                                    alt="Attached"
                                    className="max-w-full rounded-lg max-h-40 object-cover"
                                  />
                                </div>
                              )}
                              <p className="text-sm font-body whitespace-pre-wrap">{msg.content}</p>
                              {msg.timestamp && (
                                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                                  {typeof msg.timestamp === 'string' ? new Date(msg.timestamp).toLocaleString() : msg.timestamp?.toDate?.()?.toLocaleString() || ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis History Modal */}
      <AnimatePresence>
        {selectedUserAnalyses && !selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedUserAnalyses(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.lightGray }}>
                <div>
                  <h3 className="font-serif text-xl" style={{ color: colors.charcoal }}>
                    Analysis History
                  </h3>
                  <p className="text-sm font-body" style={{ color: colors.warmGray }}>
                    {selectedUserAnalyses.user.displayName || selectedUserAnalyses.user.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserAnalyses(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: colors.warmGray }} />
                </button>
              </div>

              {/* Analyses List */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
                {selectedUserAnalyses.analyses.length === 0 ? (
                  <p className="text-center font-body" style={{ color: colors.warmGray }}>No analyses</p>
                ) : (
                  selectedUserAnalyses.analyses.map((analysis, i) => (
                    <button
                      key={analysis.id || i}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className="w-full p-4 rounded-xl border hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                      style={{ borderColor: colors.lightGray }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: colors.pastelGreen }}
                        >
                          <BarChart3 className="w-6 h-6" style={{ color: colors.charcoal }} />
                        </div>
                        <div>
                          <p className="font-medium font-body" style={{ color: colors.charcoal }}>
                            {analysis.analysisType === 'quick' ? 'Quick Scan' : 'Full Analysis'}
                          </p>
                          <div className="flex items-center gap-2 text-sm" style={{ color: colors.warmGray }}>
                            <Clock className="w-3 h-3" />
                            {analysis.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-serif" style={{ color: colors.charcoal }}>
                            {Math.round((analysis.condition_score || 0) * 10)}%
                          </p>
                          <p className="text-xs font-body" style={{ color: colors.warmGray }}>Score</p>
                        </div>
                        <ChevronRight className="w-5 h-5" style={{ color: colors.warmGray }} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.lightGray }}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5" style={{ color: colors.warmGray }} />
                  </button>
                  <div>
                    <h3 className="font-serif text-xl" style={{ color: colors.charcoal }}>
                      Analysis Details
                    </h3>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>
                      {selectedAnalysis.createdAt?.toDate?.()?.toLocaleString() || 'Unknown date'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAnalysis(null); setSelectedUserAnalyses(null); }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: colors.warmGray }} />
                </button>
              </div>

              {/* Analysis Details */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Score */}
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-3"
                    style={{ backgroundColor: colors.pastelGreen }}
                  >
                    <span className="text-4xl font-serif" style={{ color: colors.charcoal }}>
                      {Math.round((selectedAnalysis.condition_score || 0) * 10)}%
                    </span>
                  </div>
                  <p className="font-body text-lg" style={{ color: colors.charcoal }}>
                    Overall Hair Health Score
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.pastelBlue }}>
                    <p className="text-2xl font-serif" style={{ color: colors.charcoal }}>
                      {Math.round((selectedAnalysis.moisture_level || 0) * 10)}%
                    </p>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>Hydration</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.pastelYellow }}>
                    <p className="text-2xl font-serif" style={{ color: colors.charcoal }}>
                      {Math.round((selectedAnalysis.condition_score || 0) * 10)}%
                    </p>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>Shine</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: colors.pastelPurple }}>
                    <p className="text-2xl font-serif" style={{ color: colors.charcoal }}>
                      {Math.round((selectedAnalysis.protein_balance || 0) * 10)}%
                    </p>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>Strength</p>
                  </div>
                </div>

                {/* Hair Profile */}
                <div className="space-y-3">
                  <h4 className="font-serif text-lg" style={{ color: colors.charcoal }}>Hair Profile</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                      <p className="text-xs font-body uppercase tracking-wide" style={{ color: colors.warmGray }}>Hair Type</p>
                      <p className="font-body font-medium" style={{ color: colors.charcoal }}>{selectedAnalysis.hair_type || 'Unknown'}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                      <p className="text-xs font-body uppercase tracking-wide" style={{ color: colors.warmGray }}>Porosity</p>
                      <p className="font-body font-medium" style={{ color: colors.charcoal }}>{selectedAnalysis.porosity || 'Unknown'}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                      <p className="text-xs font-body uppercase tracking-wide" style={{ color: colors.warmGray }}>Texture</p>
                      <p className="font-body font-medium" style={{ color: colors.charcoal }}>{selectedAnalysis.texture || 'Unknown'}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                      <p className="text-xs font-body uppercase tracking-wide" style={{ color: colors.warmGray }}>Density</p>
                      <p className="font-body font-medium" style={{ color: colors.charcoal }}>{selectedAnalysis.density || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Primary Need */}
                  {selectedAnalysis.primary_need && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F7F5F2' }}>
                      <p className="text-xs font-body uppercase tracking-wide" style={{ color: colors.warmGray }}>Primary Need</p>
                      <p className="font-body font-medium" style={{ color: colors.charcoal }}>{selectedAnalysis.primary_need}</p>
                    </div>
                  )}

                  {/* Concerns */}
                  {selectedAnalysis.concerns && selectedAnalysis.concerns.length > 0 && (
                    <div>
                      <p className="text-xs font-body uppercase tracking-wide mb-2" style={{ color: colors.warmGray }}>Concerns</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.concerns.map((concern, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm font-body"
                            style={{ backgroundColor: colors.pastelPink, color: colors.charcoal }}
                          >
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.lightGray }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.pastelGreen }}
                  >
                    <UserIcon className="w-6 h-6" style={{ color: colors.charcoal }} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl" style={{ color: colors.charcoal }}>
                      Edit User
                    </h3>
                    <p className="text-sm font-body" style={{ color: colors.warmGray }}>
                      {editingUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" style={{ color: colors.warmGray }} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userEditForm.displayName}
                    onChange={(e) => setUserEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border font-body"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium font-body block mb-2" style={{ color: '#6B665E' }}>
                    Email (cannot be changed)
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border font-body opacity-60 cursor-not-allowed"
                    style={{ backgroundColor: colors.cream, borderColor: colors.lightGray, color: colors.charcoal }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: colors.cream }}>
                    <p className="text-xs font-body" style={{ color: colors.warmGray }}>Status</p>
                    <p className="font-body font-medium" style={{ color: editingUser.isBanned ? '#DC2626' : '#16A34A' }}>
                      {editingUser.isBanned ? 'Banned' : 'Active'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: colors.cream }}>
                    <p className="text-xs font-body" style={{ color: colors.warmGray }}>Joined</p>
                    <p className="font-body font-medium" style={{ color: colors.charcoal }}>
                      {editingUser.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: colors.lightGray }}>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl font-body font-medium"
                  style={{ color: colors.charcoal }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  className="px-5 py-2.5 rounded-xl font-body font-medium flex items-center gap-2"
                  style={{ backgroundColor: colors.charcoal, color: colors.cream }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif&display=swap');
      `}</style>
    </div>
  )
}

export default Admin
