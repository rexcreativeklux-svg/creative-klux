import React from 'react';
import '../Digital-Agency-Social-Media-Post.css';

export default function GrowBrandPoster() {
    return (
        <div className="flex items-center justify-center ">
            <div className="relative w-full struggling-poster max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white" style={{
                aspectRatio: '9 / 12'
            }}>
                {/* Top left decorative curved lines */}
                <div className="absolute top-0 left-0 pointer-events-none overflow-hidden w-64 h-64">
                    <svg className="absolute -top-28 -left-20 w-80 h-80" viewBox="0 0 400 400" fill="none">
                     
                        <path
                            d="M30,180 Q80,130 130,160 Q180,190 160,240 Q140,290 80,260"
                            stroke="var(--primary-light)"
                            strokeWidth="35"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.4"
                        />
                    </svg>
                </div>

                   {/* Top left decorative curved lines */}
                <div className="absolute top-0 left-0 pointer-events-none overflow-hidden w-64 h-64">
                    <svg className="absolute -top-14 -left-4 w-80 h-80" viewBox="0 0 400 400" fill="none">
                        <path
                            d="M50,200 Q100,150 150,180 Q200,210 180,260 Q160,310 100,280"
                            stroke="var(--primary-light)"
                            strokeWidth="35"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.6"
                        />
                    </svg>
                </div>

                {/* Bottom right decorative curved lines */}
                <div className="absolute bottom-0 right-0 pointer-events-none overflow-hidden w-64 h-64">
                    <svg className="absolute -bottom-16 -right-6 w-80 h-80" viewBox="0 0 400 400" fill="none">
                      
                        <path
                            d="M370,220 Q320,270 270,240 Q220,210 240,160 Q260,110 320,140"
                            stroke="var(--secondary-light)"
                            strokeWidth="35"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.4"
                        />
                    </svg>
                </div>

                      {/* Bottom right decorative curved lines */}
                <div className="absolute bottom-0 right-0 pointer-events-none overflow-hidden w-64 h-64">
                    <svg className="absolute -bottom-40 -right-28 w-80 h-80" viewBox="0 0 400 400" fill="none">
                        <path
                            d="M350,200 Q300,250 250,220 Q200,190 220,140 Q240,90 300,120"
                            stroke="var(--secondary-light)"
                            strokeWidth="35"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.6"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-5 h-5 border-4 border-white rounded-full"></div>
                            </div>
                            <span className="text-gray-800 font-bold text-lg">yourlogo</span>
                        </div>
                    </div>

                    {/* Top Image with pill shape */}
                    <div className="mb-3">
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <clipPath id="pill-clip-top" clipPathUnits="objectBoundingBox">
                                    <path d="M 0.15,0 L 0.85,0 C 0.95,0 1,0.25 1,0.5 C 1,0.75 0.95,1 0.85,1 L 0.15,1 C 0.05,1 0,0.75 0,0.5 C 0,0.25 0.05,0 0.15,0 Z" />
                                </clipPath>
                            </defs>
                        </svg>

                        <div
                            className="w-full overflow-hidden"
                            style={{
                                height: '160px',
                                clipPath: 'url(#pill-clip-top)'
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
                                alt="Team collaboration"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="text-center mb-5">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-1">
                            Let's <span className="inline-block px-2 rotate-3 rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>Grow</span>
                        </h1>
                        <h1 className="text-3xl font-bold leading-tight mb-2">
                            <span className="inline-block px-2 rotate-[-7deg] rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>Your Brand</span> <span className="text-gray-900">Together</span>
                        </h1>
                    </div>

                    {/* Bottom Image with pill shape */}
                    <div className="mb-4">
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <clipPath id="pill-clip-bottom" clipPathUnits="objectBoundingBox">
                                    <path d="M 0.15,0 L 0.85,0 C 0.95,0 1,0.25 1,0.5 C 1,0.75 0.95,1 0.85,1 L 0.15,1 C 0.05,1 0,0.75 0,0.5 C 0,0.25 0.05,0 0.15,0 Z" />
                                </clipPath>
                            </defs>
                        </svg>

                        <div
                            className="w-full overflow-hidden"
                            style={{
                                height: '160px',
                                clipPath: 'url(#pill-clip-bottom)'
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop"
                                alt="Team meeting"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Footer - Social handle and website */}
                    <div className="mt-auto flex items-center justify-between text-gray-800 text-xs font-bold">
                        <span>@yoursocialmedia</span>
                        <span>yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}