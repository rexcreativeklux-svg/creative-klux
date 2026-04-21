import React from 'react';
import '../Yellow-Market-Value-Social-Media-Post.css';

export default function ViralTrendsPost() {
  return (
    <div className="flex items-center justify-center p-4">
      {/* Hidden SVG clip */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="custom-cut-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.499366 0 L0 0 L0 1 L0.5 1 L0.5 0.55597 L0.898525 0.552669 C1.033708 0.557935 0.99684 0.319171 1 0 L0.5 0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Main container – now uses variables */}
      <div
        className="yellow-poster relative w-full max-w-md overflow-hidden"
        style={{
          backgroundColor: 'var(--primary)',        // ← #e8f005
          aspectRatio: '3 / 4',
          padding: '35px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',               // ← your reusable shadow
        }}
      >
        {/* Top-right black accents */}
        <div className="absolute -top-2 right-0 w-16 h-16 bg-[var(--secondary)] z-10" />
        <div className="absolute top-14 right-16 w-6 h-6 bg-[var(--secondary)] z-10" />

        {/* Headline */}
        <h1
          className="text-2xl font-bold leading-tight mb-4 relative z-10 max-w-lg"
          style={{ color: 'var(--text-on-primary)' }}   // ← #2d3436 via variable
        >
          Viral Trends Can <br /> Change Market Value
        </h1>

        {/* Main Image Area */}
        <div className="relative rounded-3xl overflow-clip" style={{ height: 'calc(100% - 120px)' }}>
          {/* Clipped image */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'url(#custom-cut-clip)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=1400&fit=crop&q=80"
              alt="Business presentation"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Mini chart overlay */}
          <div
            className="absolute top-6 right-6 bg-white rounded-xl p-4 shadow-2xl z-30"
            style={{ width: '150px' }}
          >
            <div className="flex items-end gap-1 h-12 mb-2">
              {[45, 68, 52, 85, 100, 73, 60, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-orange-500 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="h-1.5 flex-1 bg-blue-500 rounded-full" />
              <div className="h-1.5 flex-1 bg-green-500 rounded-full" />
              <div className="h-1.5 flex-1 bg-red-500 rounded-full" />
            </div>
          </div>

          {/* Text box overlay – uses light yellow */}
          <div
            className="absolute bottom-2 right-0 w-[170px] rounded-2xl z-40 "
          >
            <p className="text-[9px] leading-relaxed text-gray-600 font-medium p-3">
              These Changes Are Often Not Based On Fundamental Data,
              But Rather On Market Sentiment And Perceptions. That’s why understanding the
              flow of information is just as critical as reading financial reports.
            </p>
          </div>
        </div>

        {/* Bottom-right big asterisk – using the new light variable */}
        <div 
          className="absolute -bottom-28 -right-11 z-10" 
          style={{ 
            fontSize: '270px', 
            lineHeight: '0.8', 
            fontWeight: '900', 
            color: 'var(--primary-light)'   // ← #f0f73b
          }}
        >
          *
        </div>
      </div>
    </div>
  );
}