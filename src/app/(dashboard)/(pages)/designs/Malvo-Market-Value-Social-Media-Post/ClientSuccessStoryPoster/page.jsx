import React from 'react';

export default function ClientSuccessStoryPoster() {
    return (
        <div className=" flex items-center justify-center" >


            <div className="Malvo-Market-Value-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--tertiary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                  {/* Top right */}
                <div className="absolute -top-20 right-18 " style={{ fontSize: '400px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                    {/* center */}
                <div className="absolute top-48 -right-3 " style={{ fontSize: '450px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                {/* bottom left */}
                <div className="absolute -bottom-90 -left-28 " style={{ fontSize: '700px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo and brand at top */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                            <span className=" font-bold text-sm">Businest</span>
                        </div>
                        <span className="text-[var(--text-on-secondary)] font-medium text-xs">@yourbrand</span>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-4">
                        <h1 className="text-5xl font-bold">
                            Client<br />
                            <span className="inline-block px-3 py-1 rotate-[-3deg] rounded-lg text-[var(--tertiary)]" style={{ backgroundColor: 'var(--secondary)' }}>Success</span> Story
                        </h1>
                    </div>

                    {/* Content area with quote and image side by side */}
                    <div className="flex-1  flex justify-between mb-5">
                        {/* Left side - Quote */}
                        <div className=" flex max-w-[190px] relative bottom-3 flex-col justify-center">
                            <p className="text-sm font-medium  mb-4">
                                "Before working with Businest, we struggled to prove our real value in the market.
                            </p>
                            <p className="text-sm font-medium ">
                                Their strategy not only increased our valuation but also attracted new investors."
                            </p>
                        </div>

                        {/* Right side - Person image with orange background shape */}
                        <div className="flex-shrink-0 relative top-17">
                            {/* SVG clip path definition */}
                            <svg width="0" height="0" className="absolute">
                                <defs>
                                    <clipPath id="orange-clip" clipPathUnits="objectBoundingBox">
                                        <path  d="M0.417486 0.366573 L0.417486 0.366573 C0.470154 0.291081 0.492978 0.259480 0.557935 0.178722 L0.733497 0.110253 L1.000351 -0.009129 C1.003862 0.001404 1.000000 0.016076 1.000000 0.035907 L1.000000 0.964093 C1.000000 0.983924 0.982091 1.000000 0.960000 1.000000 L0.040000 1.000000 C0.017909 1.000000 0.000000 0.983924 0.000000 0.964093 L0.000000 0.500000 L-0.000351 0.396419 C0.008427 0.359551 -0.012640 0.371840 0.010183 0.326194 L0.417486 0.366573 Z" />
                                    </clipPath>
                                </defs>
                            </svg>

                            {/* Orange decorative shape with clip path */}
                            <div
                                className="absolute top-0 right-0 w-48 h-56"
                                style={{
                                    backgroundColor: 'var(--secondary)',
                                    clipPath: 'url(#orange-clip)'
                                }}
                            ></div>

                            {/* Person image */}
                            <div className="relative z-10 w-54 h-63  overflow-hidden right-3 bottom-7">
                                <img
                                    src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                    alt="Darren Watkins - CEO"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Client info */}
                    <div className="mb-6 relative bottom-7">
                        <h3 className="text-xl font-bold text-[var(--secondary)] mb-1">Darren Watkins</h3>
                        <p className="text-xs  font-semibold">CEO & Entrepeneur</p>
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex items-center relative bottom- justify-between">
                        <button className="px-3 py-1 rounded font-bold text-sm shadow-lg text-[var(--tertiary)] hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)', }}>
                            Contact Us!
                        </button>
                        <span className=" text-xs font-semibold">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}