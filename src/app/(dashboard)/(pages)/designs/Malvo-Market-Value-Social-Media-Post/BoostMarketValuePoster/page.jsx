import React from 'react';

export default function BoostMarketValuePoster() {
    return (
        <div className=" flex items-center justify-center " >

            <div className="Malvo-Market-Value-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top right */}
                <div className="absolute -top-24 -right-34 " style={{ fontSize: '600px', lineHeight: '0.8', fontWeight: '900', color: 'var(--primary-light)' }}>
                    *
                </div>


                {/* bottom left */}
                <div className="absolute -bottom-90 -left-28 " style={{ fontSize: '700px', lineHeight: '0.8', fontWeight: '900', color: 'var(--primary-light)' }}>
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

                    {/* Main Headline */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-[var(--text-on-primary)] mb-2">
                            How to Boost
                        </h1>
                        <div className="inline-block px-4 py-1 relative bottom-2 rotate-[-3deg] rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
                            <h1 className="text-5xl font-bold  text-[var(--text-on-secondary)]">
                                Market Value
                            </h1>
                        </div>
                    </div>

                    {/* List of items */}
                    <div className="flex flex-col justify-center items-center space-y-4 mb-18">
                        <div className="bg-[var(--tertiary)] rotate-[-2deg] rounded-lg px-4 py-2 shadow-lg">
                            <p className="text-sm font-semibold text-center">
                                Build strong customer trust
                            </p>
                        </div>

                        <div className="bg-[var(--tertiary)] rotate-2 rounded-lg px-4 py-2 shadow-lg">
                            <p className="text-sm font-semibold text-center">
                                Showcase consistent performance
                            </p>
                        </div>

                        <div className="bg-[var(--tertiary)] rotate-[-2deg] rounded-lg px-4 py-2 shadow-lg">
                            <p className="text-sm font-semibold text-center">
                                Innovate and stay relevant
                            </p>
                        </div>

                        <div className="bg-[var(--tertiary)] rotate-2 rounded-lg px-4 py-2 shadow-lg">
                            <p className="text-sm font-semibold text-center">
                                Communicate your vision clearly
                            </p>
                        </div>
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex items-center relative  justify-between">
                        <button className="px-4 py-1 text-[var(--text-on-secondary)] rounded font-bold text-sm shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)', }}>
                            Contact Us!
                        </button>
                        <span className="text-[var(--text-on-primary)] text-xs font-medium">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}