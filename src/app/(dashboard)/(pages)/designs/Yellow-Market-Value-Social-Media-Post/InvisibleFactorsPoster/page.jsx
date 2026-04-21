import React from 'react';
import '../Yellow-Market-Value-Social-Media-Post.css';

export default function InvisibleFactorsPoster() {
    return (
        <div className=" flex items-center justify-center">


            <div className="invisible-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    {/* Top left yellow curved shapes */}
                    <div className="absolute -top-5 -left-10 w-64 h-44">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            <path d="M0,100 Q50,50 100,100" fill="none" stroke="var(--primary)" strokeWidth="40" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Top right yellow curved element */}
                    <div className="absolute -top-16 right-8 w-48 h-48">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            <circle cx="150" cy="50" r="80" fill="none" stroke="var(--primary)" strokeWidth="35" />
                        </svg>
                    </div>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Image section with organic shape */}
                    <div className="relative mt-5">
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <clipPath id="organic-image-clip" clipPathUnits="objectBoundingBox">
                                    <path
                                        d="M0.501756 -0.006496 L0.694874 -0.008251 C0.835323 0.042662 0.945927 0.042662 0.972261 0.232268 C0.923104 0.358673 0.938905 0.362184 0.835323 0.425386 L0.689607 0.464010 L0.826545 0.525456 C0.954705 0.585148 0.945927 0.662395 0.974017 0.716819 C0.974017 0.799333 0.947683 0.988940 0.665028 0.973139 L0.354284 0.973139 C0.217345 0.978406 0.164677 0.953827 0.127809 0.918715 C-0.002107 0.850246 0.027739 0.767732 0.008427 0.676440 L0.133076 0.532479 L0.292837 0.460499 L0.148876 0.421875 C0.113764 0.393785 0.061095 0.348139 0.013694 0.279670 C0.013694 0.063729 0.103230 0.053195 0.298104 -0.006496 Z"
                                    />
                                </clipPath>
                            </defs>
                        </svg>

                        <div
                            className="relative w-full bg-white"
                            style={{
                                height: '370px',
                                clipPath: 'url(#organic-image-clip)'
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                                alt="Team analyzing growth chart"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Text content section */}
                    <div className="flex-1 flex z-20 items-end">
                        <div className="flex gap-6 w-full ">
                            {/* Left column - Headline */}
                            <div className="flex-1 ">
                                <h1 className="text-white text-xl font-bold leading-relaxed">
                                    Invisible Factors<br />
                                    That Determine<br />
                                    Value
                                </h1>
                            </div>

                            {/* Right column - Description and squares */}
                            <div className="flex-1 relative">
                                {/* Dark circular background */}
                                <div className="absolute -top-12 -right-4 w-48 h-48 rounded-full opacity-50" style={{ backgroundColor: '#1a1a1a' }}></div>

                                <div className="relative">
                                    <p className="text-white text-[10px] leading-relaxed mb-4 opacity-60">
                                        There Are Hidden Factors At Work Behind The Scenes Of Regulatory Changes, Market Sentiment, Technological Trends, Geopolitical Conditions, And Reputations Built Over Many Years.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* bottom-left yellow accents */}
                    <div className="absolute bottom-4 left-38 w-6 h-6 bg-[var(--primary)] z-10" />
                    <div className="absolute bottom-10 left-44 w-3 h-3 bg-[var(--primary)] z-10" />

                    {/* Bottom-right big asterisk – using the new light variable */}
                    <div
                        className="absolute rotate-25 -bottom-39 -right-12 "
                        style={{
                            fontSize: '370px',
                            lineHeight: '0.8',
                            fontWeight: '900',
                            color: 'var( --accent-on-secondary)'  
                        }}
                    >
                        *
                    </div>
                </div>
            </div>
        </div>
    );
}