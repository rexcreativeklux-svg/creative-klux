import React from 'react';
import '../Malvo-Market-Value-Social-Media-Post.css';

export default function UnlockTrueValuePoster() {
    return (
        <div className=" flex items-center justify-center">

            <div className="Malvo-Market-Value-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                   {/* Top right */}
                    <div className="absolute -top-4 -right-15 " style={{ fontSize: '300px', lineHeight: '0.8', fontWeight: '900', color: 'var(--primary-light)' }}>
                        *
                    </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo and brand at top */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                            <span className="text-white font-bold text-sm">Businest</span>
                        </div>
                        <span className="text-white text-xs">@yourbrand</span>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-6">
                        <h1 className="text-4xl font-black  text-white mb-2">
                            Unlock Your
                        </h1>
                        <div className="inline-block px-4 py-2 rotate-[-3deg] mt-[-6px] rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
                            <h1 className="text-4xl font-black  text-[var(--text-on-secondary)]">
                                True Value!
                            </h1>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6 max-w-[160px]">
                        <p className="text-xs text-gray-300 leading-relaxed">
                            Your market value is more than numbers. Let's show the world your real worth.
                        </p>
                    </div>

                    {/* Image with curved clip */}
                    <div className="flex relative bottom-20">
                        <svg width="0" height="0" className="absolute ">
                            <defs>
                                <clipPath id="image-clip" clipPathUnits="objectBoundingBox">
                                    <path d="M0.417486 0.366573 L0.417486 0.366573 C0.470154 0.291081 0.492978 0.259480 0.557935 0.178722 L0.733497 0.110253 L1.000351 -0.009129 C1.003862 0.001404 1.000000 0.016076 1.000000 0.035907 L1.000000 0.964093 C1.000000 0.983924 0.982091 1.000000 0.960000 1.000000 L0.040000 1.000000 C0.017909 1.000000 0.000000 0.983924 0.000000 0.964093 L0.000000 0.500000 L-0.000351 0.396419 C0.008427 0.359551 -0.012640 0.371840 0.010183 0.326194 L0.417486 0.366573 Z" />
                                </clipPath>
                            </defs>
                        </svg>
                        <div
                            className="w-full overflow-hidden  bg-white"
                            style={{
                                clipPath: 'url(#image-clip)',
                                height: '300px'
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
                                alt="Professional woman with charts"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex relative bottom-12 items-center justify-between">
                        <button className="px-3 py-1 rounded-sm font-black text-sm  hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)', color: 'var(--text-on-secondary)' }}>
                            Contact Us!
                        </button>
                        <span className="text-gray-400 text-xs font-semibold">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}