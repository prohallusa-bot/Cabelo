import React, { useState, useRef, useEffect } from 'react';

// Cabelo.ai - ChatGPT-Style Interface
// White + Light Pastels, Left Sidebar Tools, Working Chat

export default function CabeloAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Tool categories with pastel colors
  const toolCategories = [
    {
      label: 'Analysis',
      tools: [
        { id: 'hair-analysis', icon: '📸', name: 'Hair Analysis', color: '#E8F5E9', description: 'Upload photo to analyze hair type' },
        { id: 'damage-check', icon: '🔬', name: 'Damage Check', color: '#E3F2FD', description: 'Assess hair damage level' },
      ]
    },
    {
      label: 'Recommendations',
      tools: [
        { id: 'product-match', icon: '✨', name: 'Product Match', color: '#FFF3E0', description: 'Find perfect products for you' },
        { id: 'routine', icon: '📋', name: 'Care Routine', color: '#F3E5F5', description: 'Get personalized routine' },
      ]
    },
    {
      label: 'Learn',
      tools: [
        { id: 'treatments', icon: '💆', name: 'Treatments', color: '#E0F7FA', description: 'Keratin, botox & more' },
        { id: 'hair-types', icon: '📚', name: 'Hair Types', color: '#FBE9E7', description: 'Understand your hair' },
      ]
    }
  ];

  // Simulated AI responses based on tool/message
  const getAIResponse = (userMessage, tool) => {
    const responses = {
      'hair-analysis': "I'd be happy to analyze your hair! Please upload a clear photo of your hair in natural lighting. I'll identify your hair type (straight, wavy, curly, or coily), assess its condition, and provide personalized recommendations.",
      'damage-check': "Let's check your hair health! Upload a photo focusing on your hair ends and mid-lengths. I'll analyze for signs of damage like split ends, breakage, dryness, or chemical damage, then suggest treatments.",
      'product-match': "I'll find the perfect products for you! First, tell me: What's your main hair concern? (frizz, dryness, damage, volume, etc.) and what's your hair type?",
      'routine': "Let's build your personalized hair care routine! To get started, please tell me:\n\n1. Your hair type (straight, wavy, curly, coily)\n2. Main concerns (frizz, damage, dryness, etc.)\n3. How often you wash your hair",
      'treatments': "I can help you understand professional treatments! What would you like to know about?\n\n• **Keratin Treatment** - Smooths & reduces frizz\n• **Hair Botox** - Deep conditioning & repair\n• **Nanoplastia** - Natural smoothing treatment\n\nOr ask me anything specific!",
      'hair-types': "Hair types are classified by pattern and texture:\n\n**Type 1** - Straight\n**Type 2** - Wavy (2A, 2B, 2C)\n**Type 3** - Curly (3A, 3B, 3C)\n**Type 4** - Coily (4A, 4B, 4C)\n\nWould you like help identifying your type?",
      'default': "I'm here to help with all your hair care questions! I can analyze your hair, recommend products, suggest treatments, or answer any questions. What would you like to know?"
    };
    
    if (tool) return responses[tool] || responses['default'];
    
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('frizz')) return "Frizz is usually caused by lack of moisture or humidity. For frizz control, I recommend:\n\n1. Use a sulfate-free shampoo\n2. Deep condition weekly\n3. Apply anti-frizz serum on damp hair\n4. Consider a keratin treatment for long-term smoothing\n\nWant me to recommend specific products?";
    if (lowerMsg.includes('damaged') || lowerMsg.includes('damage')) return "For damaged hair, focus on repair and protection:\n\n1. **Trim** split ends regularly\n2. **Deep condition** 1-2x per week\n3. **Avoid heat** or use protectant\n4. **Try Hair Botox** for intense repair\n\nWould you like me to analyze your damage level with a photo?";
    if (lowerMsg.includes('curly') || lowerMsg.includes('curl')) return "For beautiful curls, the key is moisture and definition:\n\n1. Use the **CGM method** (Curly Girl Method)\n2. Apply products to wet hair\n3. Scrunch, don't rub\n4. Use a diffuser for drying\n\nWhat's your curl pattern? I can give more specific advice!";
    
    return responses['default'];
  };

  // Handle sending message
  const sendMessage = (text, fromTool = null) => {
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getAIResponse(userMessage, fromTool);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  // Handle tool click
  const handleToolClick = (tool) => {
    setActiveTool(tool.id);
    setMessages(prev => [...prev, { role: 'user', content: `Start ${tool.name}` }]);
    setIsTyping(true);
    
    setTimeout(() => {
      const response = getAIResponse('', tool.id);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 800);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      
      {/* Left Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0px',
        backgroundColor: '#FAFBFC',
        borderRight: '1px solid #F0F0F0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #F0F0F0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>✨</div>
            <span style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              letterSpacing: '-0.3px'
            }}>Cabelo.ai</span>
          </div>
          
          {/* New Chat Button */}
          <button 
            onClick={() => {
              setMessages([]);
              setActiveTool(null);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #E8E8E8',
              backgroundColor: '#ffffff',
              color: '#1a1a1a',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '10px 14px',
            border: '1px solid #E8E8E8',
            gap: '8px'
          }}>
            <span style={{ color: '#999', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search tools..."
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px',
                width: '100%',
                color: '#1a1a1a'
              }}
            />
          </div>
        </div>

        {/* Tool Categories */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 20px 12px'
        }}>
          {toolCategories.map((category, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 8px',
                marginBottom: '8px'
              }}>
                {category.label}
              </div>
              
              {category.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  style={{
                    width: '100%',
                    padding: '12px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeTool === tool.id ? tool.color : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '4px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (activeTool !== tool.id) {
                      e.currentTarget.style.backgroundColor = tool.color;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTool !== tool.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1a1a1a'
                    }}>{tool.name}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '2px'
                    }}>{tool.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #F0F0F0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#E3F2FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>👤</div>
            <span style={{ fontSize: '14px', color: '#1a1a1a' }}>My Account</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}>
        
        {/* Top Bar */}
        <header style={{
          padding: '16px 24px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #E8E8E8',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ☰
          </button>
          
          <div style={{
            fontSize: '14px',
            color: '#888'
          }}>
            {activeTool ? toolCategories.flatMap(c => c.tools).find(t => t.id === activeTool)?.name : 'New Chat'}
          </div>
          
          <button style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Sign In
          </button>
        </header>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {messages.length === 0 ? (
            // Welcome Screen
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '24px'
              }}>✨</div>
              
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: '0 0 12px 0',
                letterSpacing: '-0.5px'
              }}>
                How can I help with your hair today?
              </h1>
              
              <p style={{
                fontSize: '16px',
                color: '#666',
                margin: '0 0 40px 0'
              }}>
                Select a tool from the sidebar or ask me anything about hair care
              </p>

              {/* Quick Start Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '500px'
              }}>
                {[
                  { text: "Analyze my hair type", color: '#E8F5E9' },
                  { text: "How to fix frizzy hair?", color: '#E3F2FD' },
                  { text: "Best products for damage", color: '#FFF3E0' },
                  { text: "What is keratin treatment?", color: '#F3E5F5' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(item.text)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: '1px solid #E8E8E8',
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = item.color;
                      e.currentTarget.style.borderColor = item.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#E8E8E8';
                    }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat Messages
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '24px',
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: msg.role === 'assistant' ? '#F8FAF8' : 'transparent'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'assistant' ? '#E8F5E9' : '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {msg.role === 'assistant' ? '✨' : '👤'}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#1a1a1a',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#E8F5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>✨</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '12px 0'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#B0BEC5',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0s'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#B0BEC5',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0.2s'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#B0BEC5',
                      animation: 'pulse 1.5s infinite',
                      animationDelay: '0.4s'
                    }}></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px 24px 24px 24px',
          borderTop: '1px solid #F0F0F0'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              backgroundColor: '#F7F8F9',
              borderRadius: '20px',
              padding: '8px',
              border: '1px solid #E8E8E8'
            }}>
              <button style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                📷
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your hair..."
                rows={1}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  color: '#1a1a1a',
                  lineHeight: '1.4'
                }}
              />
              
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: input.trim() ? '#1a1a1a' : '#E0E0E0',
                  color: '#ffffff',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                ↑
              </button>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '12px',
              color: '#999'
            }}>
              Cabelo.ai by Prohall Professional • Your AI Hair Expert
            </div>
          </div>
        </div>
      </main>

      {/* CSS Animation for typing dots */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
