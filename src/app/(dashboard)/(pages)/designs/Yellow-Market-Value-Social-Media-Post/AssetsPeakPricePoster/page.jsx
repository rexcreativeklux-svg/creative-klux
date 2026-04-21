import React from 'react';
import '../Yellow-Market-Value-Social-Media-Post.css';
import { ArrowUpRight } from 'lucide-react';

export default function AssetsPeakPricePoster() {
    return (
        <div className=" flex items-center justify-center">
            <div className="assets-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">

                    {/* top-left accent */}
                    <div className="absolute -top-5 z-50  rotate-130 -left-10 w-60 h-62 ">
                        <svg viewBox="0 0 150 120" className="w-full h-full" fill="var(--accent-on-secondary)">
                            <path d="M0,120 Q30,70 60,100 Q90,130 120,100 L0,120 Z" />
                        </svg>
                    </div>

                    {/* Top right */}
                    <div className="absolute -top-4 -right-15 z-50" style={{ fontSize: '250px', lineHeight: '0.8', fontWeight: '900', color: 'var(--accent-on-secondary)' }}>
                        *
                    </div>
                </div>

                <div className="relative h-full z-20 flex flex-col">
                    {/* Black circle section with quote and headline */}
                    <div className="relative flex-1 flex items-center justify-center px-8">
                        {/* Large black circle */}
                        <div className="absolute inset-0 -top-89 flex  items-center justify-center">
                            <div className="w-full h-[570px] rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                        </div>

                        {/* Content inside circle */}
                        <div className="relative -top-20 z-10 text-center px-6">
                            {/* Opening quote */}
                            <div className="text-white text-5xl mb-4 font-serif">"</div>

                            {/* Main headline */}
                            <h1 className="text-white text-4xl font-semibold leading-tight tracking-tight">
                                Assets <span className="inline-block px-2  mx-1" style={{ backgroundColor: 'var(--primary)', color: 'var(--text-on-primary)' }}>Don't</span>
                                <br />
                                <span className="inline-block px-1  mr-1" style={{ backgroundColor: 'white', color: 'var(--text-on-primary)' }}>Always</span> Stay At
                                <br />
                                Their Peak Price.
                            </h1>
                        </div>
                    </div>

                    {/* Yellow section with text and pills */}
                    <div className="relative -top-27 px-5  ">


                        <div className="relative flex flex-col justify-center items-center z-10">
                            {/* Sub-heading text */}
                            <p className="text-[10px] font-bold mb-5 tracking-wide" style={{ color: 'var(--text-on-primary)' }}>
                                Understanding The Cycle = Knowing When To Buy And When To Sell.
                            </p>

                            {/* Pills/Badges with connecting arrows */}
                            <div className="relative">
                                <div className="flex flex-wrap justify-start items-center">
                                    <span className="px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'var(--secondary)' }}>
                                        Emerging
                                    </span>

                                    {/* Arrow 1 */}
                                    <svg className="w-4 h-2" viewBox="0 0 24 16" fill="none">
                                        <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    <span className="px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'var(--secondary)' }}>
                                        Growing
                                    </span>

                                    {/* Arrow 2 */}
                                    <svg className="w-4 h-2" viewBox="0 0 24 16" fill="none">
                                        <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    <span className="px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'var(--secondary)' }}>
                                        Peak
                                    </span>

                                    {/* Arrow 3 */}
                                    <svg className="w-4 h-2" viewBox="0 0 24 16" fill="none">
                                        <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    <span className="px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'var(--secondary)' }}>
                                        Declining
                                    </span>

                                    {/* Arrow 4 */}
                                    <svg className="w-4 h-2" viewBox="0 0 24 16" fill="none">
                                        <path d="M0 8H20M20 8L14 2M20 8L14 14" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    <span className="px-2 py-1 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'var(--secondary)' }}>
                                        Obsolete
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Diagonal stripes pattern */}
                <div className="absolute -bottom-32 -right-32 z-10  overflow-hidden">
                    <ArrowUpRight className='w-[500px] text-[var(--primary-light)] h-[500px]' />
                </div>
            </div>
        </div>
    );
}