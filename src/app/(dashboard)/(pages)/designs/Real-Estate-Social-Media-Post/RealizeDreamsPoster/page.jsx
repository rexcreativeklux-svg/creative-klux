import React from 'react';

export default function RealizeDreamsPoster() {
    return (
        <div className="flex items-center justify-center" >


            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-start mb-12">
                        <div className="flex items-center gap-2">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="var(--primary)" opacity="0.9" />
                                <polyline points="9 22 9 12 15 12 15 22" fill="var(--secondary)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-base font-bold tracking-wide" style={{ color: 'var(--primary)' }}>REAL ESTATE</div>
                                <div className="text-xs" style={{ color: 'var(--primary)', opacity: 0.7 }}>FIND THE ONE</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom left decorative asterisk with visible border */}
                    <div className="absolute -bottom-92 -left-7 rotate-[-9deg] pointer-events-none">
                        <div
                            className="relative"
                            style={{
                                fontSize: '720px',
                                lineHeight: '0.8',
                                fontWeight: '900',
                                color: 'var(--secondary)',
                                // Thick colored border via text-stroke
                                WebkitTextStroke: '8px var(--primary)',  // Main border effect
                                textStroke: '8px var(--primary)',
                                // Optional: add subtle shadow for depth
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                            }}
                        >
                            *
                        </div>
                    </div>

                    {/* Two column layout */}
                    <div className="flex-1 flex gap-6">
                        {/* Left side - Person image with house outline */}
                        <div className="flex-1 relative flex items-end">


                            {/* Person image */}
                            <div className="w-110 h-130 flex absolute -left-55 -bottom-8 justify-start ">
                                <div className="  ">
                                    <img
                                        src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                        alt="Professional woman"
                                        className="w-full h-full object-cover object-top"

                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right side - Text content */}
                        <div className="absolute top-27 right-10 flex flex-col justify-center">
                            {/* Main Headline */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                                    We're Here to<br />
                                    Help Realize<br />
                                    Your Dreams
                                </h1>
                            </div>

                            {/* Contact info pills */}
                            <div className="space-y-3 flex flex-col items-start">
                                <div className=" rounded-full px-4 py-2 border border-[var(--primary)]">
                                    <p className="text-xs font-bold text-[var(--primary)] text-center">
                                        (00) 0000-0000
                                    </p>
                                </div>

                                <div className=" rounded-full px-4 py-2 border border-[var(--primary)]">
                                    <p className="text-xs font-bold text-[var(--primary)] text-center">
                                        www.yourwebsite.com
                                    </p>
                                </div>

                                <div className=" rounded-full px-4 py-2 border border-[var(--primary)]">
                                    <p className="text-xs font-bold text-[var(--primary)] text-center">
                                        Street Avenue, St. Beach
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}