import React from 'react';

// Main reusable FloatingAnimation component
export const FloatingAnimation = ({ 
  size = "w-64 h-32", 
  className = "",
  showClouds = true,
  showLoadingText = true,
  showProgressBar = true,
  loadingText = "",
  animationDuration = "6s",
  floatCount = 3, // Number of floating elements
  children
}) => {
  const delays = ["0s", "1s", "2s"]; // Increased delays for clear sequential "following" effect
  const offsets = Array.from({ length: floatCount }).map((_, index) => 
    `${index * 10 - (floatCount - 1) * 5}px`
  );

  return (
    <div className={`relative ${size} ${className} overflow-hidden`}>
      {/* Background clouds */}
      {showClouds && (
        <div className="absolute inset-0">
          <div className="absolute top-4 left-8 animate-float-slow">
            <svg width="80" height="60" viewBox="0 0 60 40" fill="none">
              <path d="M15 25c-5 0-9-4-9-9s4-9 9-9c1.5-3 5-5 9-5s7.5 2 9 5c5 0 9 4 9 9s-4 9-9 9H15z" fill="#D1D5DB" opacity="0.8"/>
            </svg>
          </div>
          <div className="absolute top-6 right-12 animate-float-slower">
            <svg width="60" height="45" viewBox="0 0 50 35" fill="none">
              <path d="M12 22c-4 0-7-3-7-7s3-7 7-7c1-2.5 4-4 7-4s6 1.5 7 4c4 0 7 3 7 7s-3 7-7 7H12z" fill="#D1D5DB" opacity="0.7"/>
            </svg>
          </div>
          <div className="absolute bottom-2 left-20 animate-float-medium">
            <svg width="55" height="40" viewBox="0 0 45 30" fill="none">
              <path d="M10 20c-3.5 0-6-2.5-6-6s2.5-6 6-6c1-2 3.5-3.5 6-3.5s5 1.5 6 3.5c3.5 0 6 2.5 6 6s-2.5 6-6 6H10z" fill="#D1D5DB" opacity="0.6"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Animated floating elements */}
      <div className="absolute inset-0">
        {Array.from({ length: floatCount }).map((_, index) => (
          <div
            key={index}
            className="absolute animate-float-glide"
            style={{
              top: `calc(50% + ${offsets[index]})`,
              left: '0',
              transform: 'translateX(-150px) translateY(-50%) rotate(-2deg)',
              opacity: 0,
              animationDuration,
              animationDelay: delays[index % delays.length],
            }}
          >
            {children}
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      {showProgressBar && (
        <div className="absolute bottom-2 left-4 right-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-700 rounded-full animate-progress-grow"
            style={{ animationDuration }}
            role="progressbar"
            aria-label="Loading progress"
            aria-valuenow="0"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      )}
      
      {/* Optional loading text */}
      {showLoadingText && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm animate-pulse">
          {loadingText}
        </div>
      )}
      
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(20px) translateY(0); }
          75% { transform: translateX(10px) translateY(5px); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(-15px) translateY(-3px); }
          66% { transform: translateX(-30px) translateY(3px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25px) translateY(-8px); }
        }
        
        @keyframes float-glide {
          0% { 
            transform: translateX(-150px) translateY(calc(-50% + 5px)) rotate(-2deg); 
            opacity: 0; 
          }
          10% { 
            transform: translateX(-100px) translateY(calc(-50% - 8px)) rotate(1deg); 
            opacity: 1; 
          }
          30% { 
            transform: translateX(-50px) translateY(calc(-50% - 12px)) rotate(2deg); 
            opacity: 1; 
          }
          50% { 
            transform: translateX(0px) translateY(calc(-50% - 8px)) rotate(1deg); 
            opacity: 1; 
          }
          70% { 
            transform: translateX(50px) translateY(calc(-50% + 0px)) rotate(0deg); 
            opacity: 1; 
          }
          90% { 
            transform: translateX(100px) translateY(calc(-50% + 5px)) rotate(-1deg); 
            opacity: 0.5; 
          }
          100% { 
            transform: translateX(150px) translateY(calc(-50% + 12px)) rotate(-2deg); 
            opacity: 0; 
          }
        }
        
        @keyframes progress-grow {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-float-glide { animation: float-glide var(--animation-duration, 5s) cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        .animate-progress-grow { animation: progress-grow var(--animation-duration, 5s) linear forwards; }
      `}</style>
    </div>
  );
};

// Exportable SVG Elements Collection
export const FloatingElements = {
  TextFile: () => (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <path d="M25 10 L55 10 L65 20 L65 50 L25 50 Z" fill="url(#textGradient)" stroke="#374151" strokeWidth="1"/>
      <path d="M55 10 L55 20 L65 20" fill="none" stroke="#374151" strokeWidth="1"/>
      <line x1="32" y1="25" x2="58" y2="25" stroke="#6B7280" strokeWidth="1.5"/>
      <line x1="32" y1="32" x2="55" y2="32" stroke="#6B7280" strokeWidth="1.5"/>
      <line x1="32" y1="39" x2="52" y2="39" stroke="#6B7280" strokeWidth="1.5"/>
      <line x1="32" y1="46" x2="48" y2="46" stroke="#6B7280" strokeWidth="1.5"/>
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F9FAFB"/>
          <stop offset="100%" stopColor="#E5E7EB"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  VideoFile: () => (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <rect x="20" y="15" width="40" height="30" rx="4" fill="url(#videoGradient)" stroke="#DC2626" strokeWidth="1"/>
      <path d="M33 25 L33 35 L45 30 Z" fill="#FFFFFF"/>
      <circle cx="25" cy="20" r="2" fill="#EF4444"/>
      <rect x="30" y="18" width="6" height="2" rx="1" fill="#374151"/>
      <rect x="38" y="18" width="6" height="2" rx="1" fill="#374151"/>
      <rect x="46" y="18" width="10" height="2" rx="1" fill="#374151"/>
      <defs>
        <linearGradient id="videoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1F2937"/>
          <stop offset="100%" stopColor="#111827"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  ImageFile: () => (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <rect x="20" y="15" width="40" height="30" rx="3" fill="url(#imageGradient)" stroke="#7C3AED" strokeWidth="1"/>
      <circle cx="28" cy="23" r="3" fill="#A78BFA"/>
      <path d="M20 38 L30 28 L38 36 L48 26 L60 38 L60 42 L20 42 Z" fill="#8B5CF6" opacity="0.7"/>
      <path d="M30 28 L38 36 L48 26 L60 38" fill="none" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="22" y="17" width="4" height="2" rx="1" fill="#C4B5FD" opacity="0.8"/>
      <rect x="28" y="17" width="6" height="2" rx="1" fill="#C4B5FD" opacity="0.8"/>
      <defs>
        <linearGradient id="imageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F3F4F6"/>
          <stop offset="100%" stopColor="#E5E7EB"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

// Pre-built loading components for common use cases
export const FileLoadingAnimations = {
  TextUpload: (props) => (
    <FloatingAnimation {...props}>
      <FloatingElements.TextFile />
    </FloatingAnimation>
  ),
  
  VideoUpload: (props) => (
    <FloatingAnimation {...props}>
      <FloatingElements.VideoFile />
    </FloatingAnimation>
  ),
  
  ImageUpload: (props) => (
    <FloatingAnimation {...props}>
      <FloatingElements.ImageFile />
    </FloatingAnimation>
  ),
};