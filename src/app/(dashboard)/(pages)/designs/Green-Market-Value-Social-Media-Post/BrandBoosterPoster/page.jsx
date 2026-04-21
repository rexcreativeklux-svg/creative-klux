import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function BrandBoosterPoster() {
    return (
        <div className=" flex items-center justify-center " >


            <div className="example-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Background decorative curvy vertical lines */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">


                    {/* Line 2 */}
                    <svg
                        className="absolute inset-y-0 left-[69%] rotate-6 h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 800"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M50,0 Q60,100 50,200 T50,400 T50,600 T50,800"
                            fill="none"
                            stroke="white"
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Line 3 */}
                    <svg
                        className="absolute inset-y-0 left-23 -top-10 rotate-25 h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 800"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M50,0 Q40,100 50,200 T50,400 T50,600 T50,800"
                            fill="none"
                            stroke="white"
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Header */}
                    <div className="mb-4">
                        <p className="text-white text-xs font-medium tracking-widest uppercase opacity-70">
                            MARKET VALUE
                        </p>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-4">
                        <h1 className="text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--secondary)' }}>
                            <span className="inline-block px-1 mr-2" style={{ background: 'var(--secondary)', color: 'var(--primary)' }}>BRAND</span>
                            = BIG<br />
                            MARKET VALUE<br />
                            BOOSTER.
                        </h1>
                    </div>

                    {/* Description */}
                    <div className="mb-0">
                        <p className="text-sm font-medium text-white opacity-90 leading-relaxed">
                            Why? Because people don't just buy products, they buy trust, lifestyle, and reputation.
                        </p>
                    </div>

                    {/* Circular images section */}
                    <div className="absolute flex top-60 items-center mb-4">
                        <div className="relative w-full">
                            <svg width="0" height="0" className="absolute">
                                <defs>
                                    <clipPath id="circles-clip">
                                        {/* Significantly increased radius to 90 (from 70) and cy to 150 for much taller circles */}
                                        <circle cx="60" cy="150" r="90" />
                                        <circle cx="160" cy="150" r="90" />
                                        <circle cx="260" cy="150" r="90" />
                                        <circle cx="360" cy="150" r="90" />
                                    </clipPath>
                                </defs>
                            </svg>

                            <div className="relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=1200&fit=crop"
                                    alt="People working together in office"
                                    className="w-full h-full object-cover"
                                    style={{
                                        clipPath: 'url(#circles-clip)',
                                        transform: 'translateX(-7%)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer - Website URL */}
                    <div className="mt-3 ">
                        <div className="bg-white absolute bottom-6 w-[85%] rounded-full px-6 py-1 shadow-lg text-center">
                            <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                                www.yourwebsite.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}