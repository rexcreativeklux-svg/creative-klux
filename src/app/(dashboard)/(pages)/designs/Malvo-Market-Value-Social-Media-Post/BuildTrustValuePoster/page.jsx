import React from 'react';

export default function BuildTrustValuePoster() {
    return (
        <div className=" flex items-center justify-center " >


            <div className="Malvo-Market-Value-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--tertiary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top right */}
                <div className="absolute -top-23 -right-28 " style={{ fontSize: '550px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                {/* center */}
                <div className="absolute top-18 -left-28 " style={{ fontSize: '450px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                {/* bottom right */}
                <div className="absolute -bottom-70 -right-24 " style={{ fontSize: '500px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo and brand at top */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                            <span className=" font-bold text-sm">Businest</span>
                        </div>
                        <span className="text-[var(--text-on-secondary)] font-medium text-xs">@yourbrand</span>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-20">
                        <h1 className="text-5xl font-bold">
                            Build Trust
                        </h1>
                        <div className="inline-block px-4 py-1 rotate-[-3deg] rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
                            <h1 className="text-5xl font-bold text-[var(--tertiary)]">
                                Build Value
                            </h1>
                        </div>
                    </div>

                    <div className='flex flex-row justify-between gap-4 '>
                        {/* Description text */}
                        <div className="max-w-[150px]">
                            <p className="text-sm font-medium mb-4">
                                Strong and consistent brand trust is one of the most powerful drivers of market value.
                            </p>
                            <p className="text-sm font-medium mb-6">
                                Our consulting helps you build that trust step by step.
                            </p>
                            <p className="text-md font-bold mb-6" style={{ color: 'var(--secondary)' }}>
                                We can help you.
                            </p>
                        </div>

                        {/* Image section */}
                        <div className="flex relative  bottom-20">
                            <svg width="0" height="0" className="absolute ">
                                <defs>
                                    <clipPath id="image-clip" clipPathUnits="objectBoundingBox">
                                        <path  d="M0.500000 0.234024 L0.500000 0.232268 C0.500000 0.234024 0.603581 0.184867 0.733497 0.118153 L0.821278 0.054951 L0.951194 -0.015274 C1.000351 -0.027563 1.000000 0.016076 1.000000 0.035907 L1.000000 0.964093 C1.000000 0.983924 0.982091 1.000000 0.960000 1.000000 L0.040000 1.000000 C0.017909 1.000000 0.000000 0.983924 0.000000 0.964093 L0.000000 0.500000 L-0.002107 0.397296 C-0.003862 0.355162 -0.012640 0.371840 -0.000351 0.230513 L0.219101 0.111131 Z" />
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
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex items-center relative bottom-6 justify-between">
                        <button className="px-4 py-1 rounded font-bold text-sm text-[var(--tertiary)] shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)' }}>
                            Contact Us!
                        </button>
                        <span className=" text-xs font-semibold">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}