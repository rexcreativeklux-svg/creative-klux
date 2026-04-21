import React from 'react';

export default function MoreThanNumbersPoster() {
    return (
        <div className=" flex items-center justify-center">


            <div className="Malvo-Market-Value-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top right */}
                <div className="absolute -top-28 -right-28 " style={{ fontSize: '600px', lineHeight: '0.8', fontWeight: '900', color: 'var(--primary-light)' }}>
                    *
                </div>

                {/* bottom right */}
                <div className="absolute -bottom-100 -right-20 " style={{ fontSize: '700px', lineHeight: '0.8', fontWeight: '900', color: 'var(--primary-light)' }}>
                    *
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo and brand at top */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                            <span className="text-white font-bold text-sm">Businest</span>
                        </div>
                        <span className="text-[var(--text-on-primary)] font-medium text-xs">@yourbrand</span>
                    </div>

                    {/* Main Headlines */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* First headline */}
                        <div className="mb-12">
                            <h1 className="text-4xl font-bold leading-tight text-white">
                                Your market<br />
                                value is more<br />
                                than <span className="inline-block px-4 py-1 rotate-[-3deg] text-[var(--text-on-secondary)] rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>numbers!</span>
                            </h1>
                        </div>

                        {/* Second headline */}
                        <div className="mb-8">
                            <h2 className="text-4xl font-bold leading-tight text-white">
                                Let's show the<br />
                                world your <span className="inline-block px-4 rotate-3 text-[var(--text-on-secondary)] py-1 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>real</span><br />
                                worth.
                            </h2>
                        </div>
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex items-center justify-between">
                        <button className="px-4 py-2 text-[var(--text-on-secondary)] rounded-md font-bold text-sm shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)', }}>
                            Contact Us!
                        </button>
                        <span className="text-[var(--text-on-primary)] text-xs font-semibold">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}