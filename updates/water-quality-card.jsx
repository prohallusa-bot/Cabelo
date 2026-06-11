import React, { useState } from 'react';

// Water Quality Dashboard Card for Cabelo.ai
// Shows local water data and how it affects the user's hair

const WaterQualityCard = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Example data - in real app, this comes from water API + user's hair profile
  const waterData = {
    location: "Miami, FL",
    overallScore: "caution", // "good" | "caution" | "attention"
    hardness: {
      value: 185,
      unit: "ppm",
      level: "hard" // soft | moderate | hard | very-hard
    },
    minerals: {
      calcium: { value: 68, status: "elevated" },
      chlorine: { value: 2.1, status: "normal" },
      iron: { value: 0.08, status: "normal" }
    },
    // Personalized based on user's hair analysis
    hairImpact: {
      concern: "moisture-blocking",
      message: "Your high-porosity hair is extra vulnerable to mineral buildup",
      severity: "moderate"
    },
    tip: {
      icon: "🚿",
      text: "A shower filter could make a big difference for your hair type",
      action: "See Recommendations"
    }
  };

  const getScoreColor = (score) => {
    switch(score) {
      case 'good': return '#22c55e';
      case 'caution': return '#f59e0b';
      case 'attention': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getScoreLabel = (score) => {
    switch(score) {
      case 'good': return 'Good for Hair';
      case 'caution': return 'Could Be Better';
      case 'attention': return 'Needs Attention';
      default: return 'Unknown';
    }
  };

  const getHardnessBar = (level) => {
    switch(level) {
      case 'soft': return 20;
      case 'moderate': return 45;
      case 'hard': return 70;
      case 'very-hard': return 95;
      default: return 50;
    }
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: '380px',
      margin: '0 auto'
    }}>
      {/* Main Card */}
      <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #fef7f5 100%)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(234, 114, 95, 0.15)'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              💧
            </div>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Your Water Quality
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '12px', 
                color: '#64748b' 
              }}>
                📍 {waterData.location}
              </p>
            </div>
          </div>
          
          {/* Score Badge */}
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: `${getScoreColor(waterData.overallScore)}15`,
            border: `1px solid ${getScoreColor(waterData.overallScore)}30`
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: getScoreColor(waterData.overallScore)
            }}>
              {getScoreLabel(waterData.overallScore)}
            </span>
          </div>
        </div>

        {/* Hardness Meter - The Main Reading */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '14px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Water Hardness
            </span>
            <div>
              <span style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                color: '#1e293b' 
              }}>
                {waterData.hardness.value}
              </span>
              <span style={{ 
                fontSize: '12px', 
                color: '#94a3b8',
                marginLeft: '4px'
              }}>
                {waterData.hardness.unit}
              </span>
            </div>
          </div>
          
          {/* Visual Bar */}
          <div style={{
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Gradient background showing scale */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #22c55e 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)',
              opacity: 0.3
            }} />
            {/* Indicator */}
            <div style={{
              position: 'absolute',
              left: `${getHardnessBar(waterData.hardness.level)}%`,
              top: '-2px',
              width: '12px',
              height: '12px',
              background: '#1e293b',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transform: 'translateX(-50%)'
            }} />
          </div>
          
          {/* Scale Labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            fontSize: '10px',
            color: '#94a3b8'
          }}>
            <span>Soft</span>
            <span>Moderate</span>
            <span>Hard</span>
            <span>Very Hard</span>
          </div>
        </div>

        {/* What This Means For YOUR Hair - Personalized */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '14px',
          border: '1px solid #fcd34d'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ 
                margin: '0 0 4px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#92400e'
              }}>
                For Your Hair Type
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '12px', 
                color: '#a16207',
                lineHeight: '1.4'
              }}>
                {waterData.hairImpact.message}
              </p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse for Details */}
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#64748b',
            marginBottom: expanded ? '14px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          {expanded ? 'Hide Details' : 'See Mineral Breakdown'}
          <span style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>▼</span>
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Calcium */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '700', color: '#64748b' }}>Ca</div>
              <p style={{ 
                margin: '0 0 2px 0', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {waterData.minerals.calcium.value}
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '10px', 
                color: '#64748b' 
              }}>
                Calcium (mg/L)
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '9px',
                fontWeight: '600',
                background: waterData.minerals.calcium.status === 'elevated' ? '#fef3c7' : '#dcfce7',
                color: waterData.minerals.calcium.status === 'elevated' ? '#92400e' : '#166534'
              }}>
                {waterData.minerals.calcium.status === 'elevated' ? 'ELEVATED' : 'NORMAL'}
              </span>
            </div>

            {/* Chlorine */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '700', color: '#64748b' }}>Cl</div>
              <p style={{ 
                margin: '0 0 2px 0', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {waterData.minerals.chlorine.value}
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '10px', 
                color: '#64748b' 
              }}>
                Chlorine (ppm)
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '9px',
                fontWeight: '600',
                background: '#dcfce7',
                color: '#166534'
              }}>
                NORMAL
              </span>
            </div>

            {/* Iron */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '700', color: '#64748b' }}>Fe</div>
              <p style={{ 
                margin: '0 0 2px 0', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {waterData.minerals.iron.value}
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '10px', 
                color: '#64748b' 
              }}>
                Iron (mg/L)
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '9px',
                fontWeight: '600',
                background: '#dcfce7',
                color: '#166534'
              }}>
                NORMAL
              </span>
            </div>
          </div>
        )}

        {/* Tip / CTA */}
        <div style={{
          marginTop: '14px',
          background: 'linear-gradient(135deg, #ea725f 0%, #d4614f 100%)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{waterData.tip.icon}</span>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: 'white',
              fontWeight: '500',
              lineHeight: '1.3'
            }}>
              {waterData.tip.text}
            </p>
          </div>
          <span style={{ color: 'white', fontSize: '18px' }}>→</span>
        </div>
      </div>

      {/* Educational Footer */}
      <div style={{
        marginTop: '12px',
        padding: '12px 16px',
        background: '#f1f5f9',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '16px' }}>💡</span>
        <p style={{ 
          margin: 0, 
          fontSize: '11px', 
          color: '#64748b',
          lineHeight: '1.4'
        }}>
          <strong>Why water matters:</strong> Hard water leaves minerals on your hair that block moisture and cause buildup, making hair feel rough and look dull.
        </p>
      </div>
    </div>
  );
};

export default WaterQualityCard;
