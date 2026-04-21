import React from 'react';
import '../Yellow-Market-Value-Social-Media-Post.css';

export default function MarketValuePricePoster() {
    return (
        <div className=" flex items-center justify-center " >


            <div className="market-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
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

                    {/* Top-right black accents */}
                    <div className="absolute -top-3 -right-5 w-16 h-16 bg-[var(--primary)] z-10" />
                    <div className="absolute top-13 right-11 w-6 h-6 bg-[var(--primary)] z-10" />

                    {/* bottom-left yellow accents */}
                    <div className="absolute -bottom-4 -left-5 w-16 h-16 bg-[var(--primary)] z-10" />
                    <div className="absolute bottom-12 left-11 w-6 h-6 bg-[var(--primary)] z-10" />

                    {/* Bottom-right big asterisk – using the new light variable */}
                    <div
                        className="absolute -bottom-40 -right-16 z-10"
                        style={{
                            fontSize: '370px',
                            lineHeight: '0.8',
                            fontWeight: '900',
                            color: 'var( --accent-on-secondary)'   // ← #f0f73b
                        }}
                    >
                        *
                    </div>
                </div>

                <div className="relative z-10 h-full flex items-center justify-center p-8">
                    <div className="flex flex-row gap-2 w-full h-[350px]">
                        {/* Top card - Image */}
                        <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-[50%] rounded-xl overflow-hidden shadow-xl" >
                            <img
                                src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=800&fit=crop"
                                alt="Plant growing from coins"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Bottom card - Text content */}
                        <div className="w-[50%] flex flex-col gap-2 rounded-xl shadow-xl">

                            <div className='bg-white rounded-xl py-5 flex flex-col justify-center items-center '>
                                {/* Yellow badge */}
                                <div className="inline-block px-4 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'var(--primary)', color: 'var(--text-on-primary)' }}>
                                    Market Value
                                </div>

                                {/* Main heading */}
                                <h2 className="text-2xl font-semibold " style={{ color: 'var(--text-on-primary)' }}>
                                    More Than<br />
                                    Just Price
                                </h2>
                            </div>

                            {/* Yellow info box */}
                            <div className="rounded-xl px-3 py-3" style={{ backgroundColor: 'var(--primary)' }}>
                                <p className="text-[11px] leading-relaxed mb-2 font-medium" style={{ color: 'var(--text-on-primary)' }}>
                                    A Combination Of Public Perception, Economic Trends, Brand Strength, Regulations, And Psychological Factors That Shape Its Value.
                                </p>

                                {/* Bottom text */}
                                <p className="text-[11px] leading-relaxed pb-9 font-medium" style={{ color: 'var(--text-on-primary)' }}>
                                    Understanding Market Value Means Understanding The Story Behind The Numbers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}