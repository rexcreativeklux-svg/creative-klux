import React from 'react';
import '../Real-Estate-Social-Media-Post.css'

export default function TestimonialWordPoster() {
    return (
        <div className="flex items-center justify-center" >

            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Bottom left decorative asterisk with visible border */}
                <div className="absolute -bottom-82 -left-52 rotate-[-3deg] pointer-events-none">
                    <div
                        className="relative"
                        style={{
                            fontSize: '650px',
                            lineHeight: '0.8',
                            fontWeight: '900',
                            color: 'var(--primary)',
                            // Thick colored border via text-stroke
                            WebkitTextStroke: '1px var(--secondary)',  // Main border effect
                            textStroke: '8px var(--primary)',
                            // Optional: add subtle shadow for depth
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                        }}
                    >
                        *
                    </div>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-start mb-6">
                        <div className="flex items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" opacity="0.9" />
                                <polyline points="9 22 9 12 15 12 15 22" fill="var(--secondary)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-sm font-bold text-[var(--secondary)] tracking-wide">REAL ESTATE</div>
                                <div className="text-xs text-[var(--secondary)]">FIND THE ONE</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="text-center  mb-3">
                        <h1 className="text-3xl font-bold leading-tight text-[var(--secondary)]">
                            Don't Just Take Our<br />
                            Word For It
                        </h1>
                    </div>

                    {/* Sub-heading */}
                    <div className="text-center px-7 mb-6">
                        <p className="text-sm text-[var(--secondary)] ">
                            Hear directly from the homeowners we've had the honor of guiding on their journey.
                        </p>
                    </div>

                    {/* Testimonial cards */}
                    <div className="flex flex-col relative space-y-6">
                        {/* Testimonial 1 */}
                        <div className="bg-[var(--secondary)] relative left-19  w-[300px] rotate-[-3deg] rounded-2xl px-3 py-2 shadow-lg flex gap-3">
                            <div className="flex-shrink-0 flex justify-center items-center">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                                        alt="Luiana Freire"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--primary)' }}>Luiana Freire</h3>
                                <p className="text-[10px] text-medium text-[var(--primary)]">
                                    We were so nervous about the whole process. We feel so calm and confident now.
                                </p>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-[var(--secondary)] relative w-[300px] rotate-3 rounded-2xl p-3 shadow-lg flex gap-3">
                            <div className="flex-shrink-0 flex justify-center items-center">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                                        alt="Ryan Sweeword"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 ">
                                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--primary)' }}>Ryan Sweeword</h3>
                                <p className="text-[10px] text-medium text-[var(--primary)]">
                                    Selling our family home of 25 years was an emotional process,
                                </p>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-[var(--secondary)] relative left-19 w-[300px] rotate-[-3deg] rounded-2xl p-3 shadow-lg flex gap-3">
                            <div className="flex-shrink-0 flex justify-center items-center">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    <img
                                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                                        alt="Jhon Wicaksono"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--primary)' }}>Jhon Wicaksono</h3>
                                <p className="text-[10px] text-medium text-[var(--primary)]">
                                    I knew I wanted to sell but didn't know where to start. They made the whole process so much easier.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Contact info */}
                    <div className="flex items-center justify-center gap-3 text-[var(--secondary)] text-[10px] font-medium mt-8">
                        <span>000 0000-0000</span>
                        <span>www.yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}