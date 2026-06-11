import React, { useState, useEffect } from 'react';

// Cabelo.ai Admin Backend - "Editorial Beauty" Design
// Refined, luxurious, warm cream tones with elegant typography
// Feels like a high-end beauty brand dashboard

export default function CabeloAdmin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeFolder, setActiveFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Knowledge Base Folders
  const [folders] = useState([
    { id: 1, name: 'Hair Types', icon: '◐', color: '#D4E8D1', count: 12 },
    { id: 2, name: 'Treatments', icon: '◈', color: '#D1E3E8', count: 8 },
    { id: 3, name: 'Products', icon: '◇', color: '#E8E4D1', count: 24 },
    { id: 4, name: 'Damage & Repair', icon: '◎', color: '#E8D1D8', count: 15 },
    { id: 5, name: 'Routines', icon: '▣', color: '#E1D1E8', count: 6 },
    { id: 6, name: 'FAQs', icon: '◉', color: '#D1E8E4', count: 32 },
  ]);

  // Tags
  const [tags] = useState([
    { id: 1, name: 'Curly', color: '#D4E8D1' },
    { id: 2, name: 'Straight', color: '#D1E3E8' },
    { id: 3, name: 'Frizz Control', color: '#E8E4D1' },
    { id: 4, name: 'Keratin', color: '#E1D1E8' },
    { id: 5, name: 'Damage Repair', color: '#E8D1D8' },
    { id: 6, name: 'Professional', color: '#D1E8E4' },
    { id: 7, name: 'Home Care', color: '#E8E1D1' },
    { id: 8, name: 'Prohall', color: '#D8E8D1' },
  ]);

  // Knowledge Items
  const [knowledgeItems] = useState([
    { id: 1, title: 'Understanding Curly Hair Types (3A-3C)', folder: 1, tags: [1, 7], status: 'published', updated: '2h ago' },
    { id: 2, title: 'Keratin Treatment Complete Guide', folder: 2, tags: [4, 6], status: 'published', updated: '1d ago' },
    { id: 3, title: 'Prohall Select One — Product Profile', folder: 3, tags: [4, 8], status: 'published', updated: '3d ago' },
    { id: 4, title: 'Split End Prevention & Treatment', folder: 4, tags: [5, 7], status: 'draft', updated: '5h ago' },
    { id: 5, title: 'Daily Routine for Wavy Hair', folder: 5, tags: [2, 7], status: 'published', updated: '1w ago' },
    { id: 6, title: 'Humidity & Frizz — Complete FAQ', folder: 6, tags: [3, 7], status: 'published', updated: '2d ago' },
    { id: 7, title: 'Burix Amazon Treatment Protocol', folder: 2, tags: [4, 6, 8], status: 'published', updated: '4d ago' },
    { id: 8, title: 'Hair Porosity Assessment Guide', folder: 1, tags: [1, 2, 7], status: 'review', updated: '6h ago' },
  ]);

  // AI Tools
  const [tools, setTools] = useState([
    { id: 1, name: 'Hair Analysis', icon: '◐', enabled: true, folder: 1 },
    { id: 2, name: 'Damage Assessment', icon: '◎', enabled: true, folder: 4 },
    { id: 3, name: 'Product Matching', icon: '◇', enabled: true, folder: 3 },
    { id: 4, name: 'Routine Builder', icon: '▣', enabled: true, folder: 5 },
    { id: 5, name: 'Treatment Guide', icon: '◈', enabled: true, folder: 2 },
    { id: 6, name: 'Type Identifier', icon: '◉', enabled: false, folder: 1 },
  ]);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: '◫' },
    { id: 'knowledge', label: 'Knowledge', icon: '◧' },
    { id: 'folders', label: 'Folders', icon: '▤' },
    { id: 'tags', label: 'Tags', icon: '◈' },
    { id: 'tools', label: 'AI Tools', icon: '◇' },
    { id: 'prompts', label: 'Prompts', icon: '▢' },
    { id: 'settings', label: 'Settings', icon: '◎' },
  ];

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = activeFolder ? item.folder === activeFolder : true;
    return matchesSearch && matchesFolder;
  });

  const getFolderName = (id) => folders.find(f => f.id === id)?.name || '';
  const getTagNames = (ids) => ids.map(id => tags.find(t => t.id === id)).filter(Boolean);

  // Styles
  const styles = {
    // CSS Variables as inline for the demo
    colors: {
      cream: '#FAF9F7',
      warmWhite: '#FFFEFA',
      charcoal: '#2D2A26',
      warmGray: '#8A857D',
      lightGray: '#E8E6E3',
      accent: '#B8A88A',
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#FAF9F7',
      fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
      color: '#2D2A26',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Subtle grain texture overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        pointerEvents: 'none',
        zIndex: 1000
      }} />

      {/* Left Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: '#FFFEFA',
        borderRight: '1px solid #E8E6E3',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Logo */}
        <div style={{
          padding: '32px 28px',
          borderBottom: '1px solid #E8E6E3'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(145deg, #2D2A26 0%, #4A4540 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAF9F7',
              fontSize: '18px',
              fontWeight: '300',
              letterSpacing: '-1px',
              boxShadow: '0 4px 12px rgba(45, 42, 38, 0.15)'
            }}>C</div>
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '400', 
                color: '#2D2A26',
                letterSpacing: '-0.5px'
              }}>Cabelo.ai</div>
              <div style={{ 
                fontSize: '11px', 
                color: '#8A857D',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginTop: '2px'
              }}>Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '10px',
            fontFamily: "'DM Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#8A857D',
            padding: '0 12px',
            marginBottom: '16px'
          }}>Menu</div>
          
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeSection === item.id ? '#F0EDE8' : 'transparent',
                color: activeSection === item.id ? '#2D2A26' : '#6B665E',
                fontSize: '15px',
                fontWeight: '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '4px',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif",
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                transitionDelay: `${index * 50}ms`
              }}
              onMouseOver={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = '#F7F5F2';
                  e.currentTarget.style.color = '#2D2A26';
                }
              }}
              onMouseOut={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B665E';
                }
              }}
            >
              <span style={{ 
                fontSize: '16px',
                opacity: 0.7,
                width: '20px',
                textAlign: 'center'
              }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #E8E6E3'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#F7F5F2'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #D4E8D1 0%, #B8D4B4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '500',
              color: '#2D2A26'
            }}>R</div>
            <div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#2D2A26',
                fontFamily: "'DM Sans', sans-serif"
              }}>Ralph</div>
              <div style={{ 
                fontSize: '11px', 
                color: '#8A857D',
                fontFamily: "'DM Sans', sans-serif"
              }}>Owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '40px 48px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: '0.2s'
      }}>
        
        {/* ==================== DASHBOARD ==================== */}
        {activeSection === 'dashboard' && (
          <>
            <header style={{ marginBottom: '48px' }}>
              <p style={{
                fontSize: '11px',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '2.5px',
                color: '#8A857D',
                marginBottom: '8px'
              }}>Welcome back</p>
              <h1 style={{
                fontSize: '42px',
                fontWeight: '400',
                color: '#2D2A26',
                margin: 0,
                letterSpacing: '-1px',
                lineHeight: 1.1
              }}>Knowledge Overview</h1>
            </header>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {[
                { label: 'Knowledge Items', value: '97', sub: '+3 this week', color: '#D4E8D1' },
                { label: 'Folders', value: '6', sub: 'Categories', color: '#D1E3E8' },
                { label: 'Active Tags', value: '8', sub: 'In use', color: '#E8E4D1' },
                { label: 'AI Queries', value: '1.2k', sub: 'Today', color: '#E1D1E8' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#FFFEFA',
                    borderRadius: '16px',
                    padding: '28px',
                    border: '1px solid #E8E6E3',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${0.3 + i * 0.1}s`
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: stat.color,
                    opacity: 0.4
                  }} />
                  <div style={{
                    fontSize: '11px',
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: '#8A857D',
                    marginBottom: '12px'
                  }}>{stat.label}</div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '400',
                    color: '#2D2A26',
                    marginBottom: '4px',
                    letterSpacing: '-1px'
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8A857D'
                  }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              
              {/* Recent Items */}
              <div style={{
                backgroundColor: '#FFFEFA',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #E8E6E3'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '28px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '400',
                    color: '#2D2A26',
                    margin: 0,
                    letterSpacing: '-0.3px'
                  }}>Recently Updated</h2>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8A857D',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px'
                  }}>View all</button>
                </div>

                {knowledgeItems.slice(0, 5).map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom: i < 4 ? '1px solid #F0EDE8' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: folders.find(f => f.id === item.folder)?.color || '#F0EDE8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#2D2A26'
                      }}>
                        {folders.find(f => f.id === item.folder)?.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: '500',
                          color: '#2D2A26',
                          marginBottom: '2px'
                        }}>{item.title}</div>
                        <div style={{
                          fontSize: '12px',
                          fontFamily: "'DM Sans', sans-serif",
                          color: '#8A857D'
                        }}>{getFolderName(item.folder)}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#A8A29E'
                    }}>{item.updated}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: '#FFFEFA',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #E8E6E3'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: '0 0 28px 0',
                  letterSpacing: '-0.3px'
                }}>Quick Actions</h2>

                {[
                  { label: 'Add Knowledge', icon: '◐', action: () => setShowUploadModal(true), color: '#D4E8D1' },
                  { label: 'New Folder', icon: '▤', action: () => setShowNewFolderModal(true), color: '#D1E3E8' },
                  { label: 'Create Tag', icon: '◈', action: () => setShowNewTagModal(true), color: '#E8E4D1' },
                  { label: 'Edit Prompts', icon: '▢', action: () => setActiveSection('prompts'), color: '#E1D1E8' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FFFEFA',
                      color: '#2D2A26',
                      fontSize: '14px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '12px',
                      transition: 'all 0.3s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = action.color;
                      e.currentTarget.style.borderColor = action.color;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFEFA';
                      e.currentTarget.style.borderColor = '#E8E6E3';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: action.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>{action.icon}</span>
                    {action.label}
                    <span style={{ marginLeft: 'auto', opacity: 0.4 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ==================== KNOWLEDGE BASE ==================== */}
        {activeSection === 'knowledge' && (
          <>
            <header style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '40px'
            }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '2.5px',
                  color: '#8A857D',
                  marginBottom: '8px'
                }}>Manage</p>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: 0,
                  letterSpacing: '-1px'
                }}>Knowledge Base</h1>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2D2A26',
                  color: '#FAF9F7',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>+</span> Add Content
              </button>
            </header>

            {/* Search & Filters */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFEFA',
                borderRadius: '12px',
                padding: '14px 20px',
                border: '1px solid #E8E6E3',
                gap: '12px'
              }}>
                <span style={{ color: '#8A857D', fontSize: '16px' }}>◯</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search knowledge base..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    width: '100%',
                    color: '#2D2A26'
                  }}
                />
              </div>

              <select style={{
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid #E8E6E3',
                backgroundColor: '#FFFEFA',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                color: '#2D2A26',
                cursor: 'pointer',
                minWidth: '160px'
              }}>
                <option>All Folders</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              <select style={{
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid #E8E6E3',
                backgroundColor: '#FFFEFA',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                color: '#2D2A26',
                cursor: 'pointer'
              }}>
                <option>All Status</option>
                <option>Published</option>
                <option>Draft</option>
                <option>Review</option>
              </select>
            </div>

            {/* Folder Pills */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '32px',
              flexWrap: 'wrap'
            }}>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(activeFolder === folder.id ? null : folder.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '24px',
                    border: activeFolder === folder.id ? 'none' : '1px solid #E8E6E3',
                    backgroundColor: activeFolder === folder.id ? folder.color : '#FFFEFA',
                    color: '#2D2A26',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (activeFolder !== folder.id) e.currentTarget.style.backgroundColor = folder.color;
                  }}
                  onMouseOut={(e) => {
                    if (activeFolder !== folder.id) e.currentTarget.style.backgroundColor = '#FFFEFA';
                  }}
                >
                  <span>{folder.icon}</span>
                  {folder.name}
                  <span style={{
                    backgroundColor: 'rgba(45, 42, 38, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}>{folder.count}</span>
                </button>
              ))}
            </div>

            {/* Knowledge List */}
            <div style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '20px',
              border: '1px solid #E8E6E3',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 120px',
                padding: '18px 28px',
                backgroundColor: '#F7F5F2',
                borderBottom: '1px solid #E8E6E3',
                fontSize: '11px',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#8A857D'
              }}>
                <div>Title</div>
                <div>Folder</div>
                <div>Tags</div>
                <div>Status</div>
              </div>

              {/* Items */}
              {filteredItems.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 120px',
                    padding: '20px 28px',
                    borderBottom: i < filteredItems.length - 1 ? '1px solid #F0EDE8' : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FAFAF8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: folders.find(f => f.id === item.folder)?.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      {folders.find(f => f.id === item.folder)?.icon}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: '500',
                        color: '#2D2A26'
                      }}>{item.title}</div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#A8A29E'
                      }}>Updated {item.updated}</div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#6B665E'
                  }}>{getFolderName(item.folder)}</div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {getTagNames(item.tags).slice(0, 2).map(tag => (
                      <span key={tag.id} style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: tag.color,
                        fontSize: '11px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: '500'
                      }}>{tag.name}</span>
                    ))}
                    {item.tags.length > 2 && (
                      <span style={{ fontSize: '11px', color: '#8A857D' }}>+{item.tags.length - 2}</span>
                    )}
                  </div>

                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    backgroundColor:
                      item.status === 'published' ? '#D4E8D1' :
                      item.status === 'draft' ? '#E8E4D1' : '#D1E3E8',
                    color: '#2D2A26'
                  }}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== FOLDERS ==================== */}
        {activeSection === 'folders' && (
          <>
            <header style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '40px'
            }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '2.5px',
                  color: '#8A857D',
                  marginBottom: '8px'
                }}>Organize</p>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: 0,
                  letterSpacing: '-1px'
                }}>Folders</h1>
              </div>
              <button
                onClick={() => setShowNewFolderModal(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2D2A26',
                  color: '#FAF9F7',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                }}
              >
                + New Folder
              </button>
            </header>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              {folders.map((folder, i) => (
                <div
                  key={folder.id}
                  style={{
                    backgroundColor: '#FFFEFA',
                    borderRadius: '20px',
                    padding: '32px',
                    border: '1px solid #E8E6E3',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${i * 0.1}s`
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(45, 42, 38, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: folder.color,
                    opacity: 0.5
                  }} />

                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: folder.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '20px',
                    position: 'relative'
                  }}>
                    {folder.icon}
                  </div>

                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '400',
                    color: '#2D2A26',
                    margin: '0 0 6px 0',
                    letterSpacing: '-0.3px'
                  }}>{folder.name}</h3>

                  <p style={{
                    fontSize: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8A857D',
                    margin: '0 0 24px 0'
                  }}>{folder.count} items</p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FFFEFA',
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: 'pointer'
                    }}>Edit</button>
                    <button
                      onClick={() => { setActiveSection('knowledge'); setActiveFolder(folder.id); }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: folder.color,
                        fontSize: '13px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}>View →</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== TAGS ==================== */}
        {activeSection === 'tags' && (
          <>
            <header style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '40px'
            }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '2.5px',
                  color: '#8A857D',
                  marginBottom: '8px'
                }}>Categorize</p>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: 0,
                  letterSpacing: '-1px'
                }}>Tags</h1>
              </div>
              <button
                onClick={() => setShowNewTagModal(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2D2A26',
                  color: '#FAF9F7',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
                }}
              >
                + New Tag
              </button>
            </header>

            <div style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '20px',
              padding: '40px',
              border: '1px solid #E8E6E3'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                {tags.map((tag, i) => (
                  <div
                    key={tag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      backgroundColor: tag.color,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'scale(1)' : 'scale(0.9)',
                      transitionDelay: `${i * 0.05}s`
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span style={{
                      fontSize: '14px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: '500',
                      color: '#2D2A26'
                    }}>{tag.name}</span>
                    <span style={{
                      backgroundColor: 'rgba(45, 42, 38, 0.15)',
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontFamily: "'DM Sans', sans-serif"
                    }}>{knowledgeItems.filter(k => k.tags.includes(tag.id)).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ==================== AI TOOLS ==================== */}
        {activeSection === 'tools' && (
          <>
            <header style={{ marginBottom: '40px' }}>
              <p style={{
                fontSize: '11px',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '2.5px',
                color: '#8A857D',
                marginBottom: '8px'
              }}>Configure</p>
              <h1 style={{
                fontSize: '42px',
                fontWeight: '400',
                color: '#2D2A26',
                margin: 0,
                letterSpacing: '-1px'
              }}>AI Tools</h1>
            </header>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px'
            }}>
              {tools.map((tool, i) => (
                <div
                  key={tool.id}
                  style={{
                    backgroundColor: '#FFFEFA',
                    borderRadius: '20px',
                    padding: '28px',
                    border: '1px solid #E8E6E3',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${i * 0.1}s`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        backgroundColor: folders.find(f => f.id === tool.folder)?.color || '#F0EDE8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px'
                      }}>
                        {tool.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '400',
                          color: '#2D2A26',
                          marginBottom: '4px'
                        }}>{tool.name}</div>
                        <div style={{
                          fontSize: '12px',
                          fontFamily: "'DM Sans', sans-serif",
                          color: '#8A857D'
                        }}>Source: {getFolderName(tool.folder)}</div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => setTools(prev => prev.map(t =>
                        t.id === tool.id ? { ...t, enabled: !t.enabled } : t
                      ))}
                      style={{
                        width: '52px',
                        height: '30px',
                        borderRadius: '15px',
                        backgroundColor: tool.enabled ? '#2D2A26' : '#E8E6E3',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFEFA',
                        position: 'absolute',
                        top: '3px',
                        left: tool.enabled ? '25px' : '3px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} />
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      fontSize: '11px',
                      fontFamily: "'DM Sans', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#8A857D',
                      display: 'block',
                      marginBottom: '8px'
                    }}>Knowledge Source</label>
                    <select style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FAF9F7',
                      fontSize: '14px',
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#2D2A26',
                      cursor: 'pointer'
                    }}>
                      {folders.map(f => (
                        <option key={f.id} value={f.id} selected={f.id === tool.folder}>
                          {f.icon} {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #E8E6E3',
                    backgroundColor: '#FFFEFA',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F7F5F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFEFA'}
                  >
                    Edit Prompts →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== PROMPTS ==================== */}
        {activeSection === 'prompts' && (
          <>
            <header style={{ marginBottom: '40px' }}>
              <p style={{
                fontSize: '11px',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '2.5px',
                color: '#8A857D',
                marginBottom: '8px'
              }}>Customize</p>
              <h1 style={{
                fontSize: '42px',
                fontWeight: '400',
                color: '#2D2A26',
                margin: 0,
                letterSpacing: '-1px'
              }}>AI Prompts</h1>
            </header>

            <div style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '20px',
              padding: '40px',
              border: '1px solid #E8E6E3'
            }}>
              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#8A857D',
                  display: 'block',
                  marginBottom: '12px'
                }}>System Prompt</label>
                <textarea
                  rows={8}
                  defaultValue="You are Cabelo.ai, an expert AI assistant specializing in hair care, treatments, and product recommendations. You represent Prohall Professional, a premium Brazilian hair care brand. Be warm, knowledgeable, and always provide personalized advice based on the user's specific hair type and concerns. Use the knowledge base to give accurate product recommendations."
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '14px',
                    border: '1px solid #E8E6E3',
                    backgroundColor: '#FAF9F7',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: '1.7',
                    resize: 'vertical',
                    color: '#2D2A26'
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#8A857D',
                  display: 'block',
                  marginBottom: '12px'
                }}>Welcome Message</label>
                <textarea
                  rows={4}
                  defaultValue="Hi! I'm your personal hair care expert ✨ I can analyze your hair, recommend the perfect products, and help you build a routine that works. What would you like to know?"
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '14px',
                    border: '1px solid #E8E6E3',
                    backgroundColor: '#FAF9F7',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: '1.7',
                    resize: 'vertical',
                    color: '#2D2A26'
                  }}
                />
              </div>

              <button style={{
                marginTop: '32px',
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#2D2A26',
                color: '#FAF9F7',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
              }}>
                Save Changes
              </button>
            </div>
          </>
        )}

        {/* ==================== SETTINGS ==================== */}
        {activeSection === 'settings' && (
          <>
            <header style={{ marginBottom: '40px' }}>
              <p style={{
                fontSize: '11px',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '2.5px',
                color: '#8A857D',
                marginBottom: '8px'
              }}>Configure</p>
              <h1 style={{
                fontSize: '42px',
                fontWeight: '400',
                color: '#2D2A26',
                margin: 0,
                letterSpacing: '-1px'
              }}>Settings</h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {/* General */}
              <div style={{
                backgroundColor: '#FFFEFA',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #E8E6E3'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: '0 0 28px 0'
                }}>General</h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Site Name</label>
                  <input
                    type="text"
                    defaultValue="Cabelo.ai"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FAF9F7',
                      fontSize: '15px',
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#2D2A26'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Tagline</label>
                  <input
                    type="text"
                    defaultValue="Your AI Hair Care Expert"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FAF9F7',
                      fontSize: '15px',
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#2D2A26'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Brand Colors</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['#2D2A26', '#D4E8D1', '#D1E3E8', '#E8E4D1', '#E1D1E8', '#FAF9F7'].map(color => (
                      <div
                        key={color}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: color,
                          border: color === '#FAF9F7' ? '1px solid #E8E6E3' : 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI */}
              <div style={{
                backgroundColor: '#FFFEFA',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #E8E6E3'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '400',
                  color: '#2D2A26',
                  margin: '0 0 28px 0'
                }}>AI Configuration</h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Model</label>
                  <select style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '1px solid #E8E6E3',
                    backgroundColor: '#FAF9F7',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2A26',
                    cursor: 'pointer'
                  }}>
                    <option>Gemini 1.5 Pro</option>
                    <option>GPT-4 Turbo</option>
                    <option>Claude 3 Opus</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Response Style</label>
                  <select style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '1px solid #E8E6E3',
                    backgroundColor: '#FAF9F7',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2A26',
                    cursor: 'pointer'
                  }}>
                    <option>Warm & Professional</option>
                    <option>Casual & Friendly</option>
                    <option>Expert & Technical</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '500',
                    color: '#6B665E',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Max Response Length</label>
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    defaultValue="2000"
                    style={{ width: '100%', accentColor: '#2D2A26' }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#8A857D',
                    marginTop: '6px'
                  }}>
                    <span>Short</span>
                    <span>Long</span>
                  </div>
                </div>
              </div>
            </div>

            <button style={{
              marginTop: '32px',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#2D2A26',
              color: '#FAF9F7',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)'
            }}>
              Save Settings
            </button>
          </>
        )}
      </main>

      {/* ==================== UPLOAD MODAL ==================== */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 42, 38, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '24px',
              padding: '40px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(45, 42, 38, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '400',
                color: '#2D2A26',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>Add Knowledge</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F0EDE8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6B665E'
                }}
              >×</button>
            </div>

            {/* Upload Area */}
            <div
              style={{
                border: '2px dashed #D8D4CF',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                marginBottom: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: '#FAF9F7'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#2D2A26';
                e.currentTarget.style.backgroundColor = '#F7F5F2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#D8D4CF';
                e.currentTarget.style.backgroundColor = '#FAF9F7';
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#E8E6E3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 20px'
              }}>◫</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#2D2A26',
                marginBottom: '8px',
                fontFamily: "'DM Sans', sans-serif"
              }}>Drop files or click to upload</div>
              <div style={{
                fontSize: '13px',
                color: '#8A857D',
                fontFamily: "'DM Sans', sans-serif"
              }}>PDF, DOCX, TXT, MD — Max 10MB</div>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E6E3' }} />
              <span style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                color: '#8A857D'
              }}>or enter manually</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E8E6E3' }} />
            </div>

            {/* Form */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '8px'
              }}>Title</label>
              <input
                type="text"
                placeholder="e.g., Curly Hair Care Guide"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '8px'
              }}>Content</label>
              <textarea
                rows={5}
                placeholder="Enter the knowledge content..."
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif",
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: '500',
                  color: '#6B665E',
                  display: 'block',
                  marginBottom: '8px'
                }}>Folder</label>
                <select style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}>
                  <option value="">Select folder...</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: '500',
                  color: '#6B665E',
                  display: 'block',
                  marginBottom: '8px'
                }}>Status</label>
                <select style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}>
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Review</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '12px'
              }}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#FAF9F7',
                      border: '1px solid #E8E6E3',
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input type="checkbox" style={{ accentColor: '#2D2A26' }} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FFFEFA',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}
              >Cancel</button>
              <button style={{
                padding: '14px 28px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2D2A26',
                color: '#FAF9F7',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                cursor: 'pointer'
              }}>Add Content</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 42, 38, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewFolderModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '24px',
              padding: '40px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 24px 48px rgba(45, 42, 38, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '400',
              color: '#2D2A26',
              margin: '0 0 32px 0',
              letterSpacing: '-0.5px'
            }}>New Folder</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '8px'
              }}>Name</label>
              <input
                type="text"
                placeholder="e.g., Styling Tips"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '12px'
              }}>Icon</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['◐', '◈', '◇', '◎', '▣', '◉', '▤', '◫', '△', '○'].map(icon => (
                  <button
                    key={icon}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      border: '1px solid #E8E6E3',
                      backgroundColor: '#FAF9F7',
                      fontSize: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F0EDE8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FAF9F7'}
                  >{icon}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '12px'
              }}>Color</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#D4E8D1', '#D1E3E8', '#E8E4D1', '#E1D1E8', '#E8D1D8', '#D1E8E4', '#E8E1D1', '#D8E8D1'].map(color => (
                  <button
                    key={color}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      backgroundColor: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewFolderModal(false)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FFFEFA',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}
              >Cancel</button>
              <button style={{
                padding: '14px 28px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2D2A26',
                color: '#FAF9F7',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                cursor: 'pointer'
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW TAG MODAL */}
      {showNewTagModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(45, 42, 38, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewTagModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFEFA',
              borderRadius: '24px',
              padding: '40px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 24px 48px rgba(45, 42, 38, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '400',
              color: '#2D2A26',
              margin: '0 0 32px 0',
              letterSpacing: '-0.5px'
            }}>New Tag</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '8px'
              }}>Name</label>
              <input
                type="text"
                placeholder="e.g., Color Treated"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FAF9F7',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                color: '#6B665E',
                display: 'block',
                marginBottom: '12px'
              }}>Color</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#D4E8D1', '#D1E3E8', '#E8E4D1', '#E1D1E8', '#E8D1D8', '#D1E8E4', '#E8E1D1', '#D8E8D1'].map(color => (
                  <button
                    key={color}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      backgroundColor: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewTagModal(false)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: '1px solid #E8E6E3',
                  backgroundColor: '#FFFEFA',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer'
                }}
              >Cancel</button>
              <button style={{
                padding: '14px 28px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2D2A26',
                color: '#FAF9F7',
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
                cursor: 'pointer'
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif&display=swap');
      `}</style>
    </div>
  );
}
