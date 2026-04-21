import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function MarketValueReflectsPoster() {
    return (
        <div className="flex items-center justify-center">
            {/* Hidden SVG defs with your exact custom shape */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <clipPath id="white-card-clip" clipPathUnits="objectBoundingBox">
                        <path
                             d="M0.194602 -0.005149 C0.139560 0.049893 0.265625 0.126243 0.013494 0.099609 L0.000000 0.851385 C-0.004261 0.911044 0.031250 0.930575 0.128906 0.930575 L0.382812 0.930575 L0.386364 0.989169 C0.338423 1.021129 0.517756 1.001598 0.675781 1.008700 L0.853338 1.003374 C0.931463 1.003374 0.773437 0.902166 1.006037 0.927024 L1.000000 0.157431 C1.007812 0.120916 0.986506 0.094283 0.926136 0.092507 L0.571023 0.094283 L0.505327 0.088956 C0.437855 0.074751 0.519531 0.000178 0.425426 -0.010476 L0.194602 -0.005149 Z"
                        />
                    </clipPath>
                </defs>
            </svg>

            <div className="reflects-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-10 -right-8 text-[200px] rotate-45 font-black leading-none" style={{ color: 'var(--secondary)' }}>
                        ✱
                    </div>

                    <div className="absolute bottom-0 right-0 w-64 h-64">
                        <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
                            <circle cx="150" cy="150" r="120" fill="white" />
                        </svg>
                    </div>

                    <div className="absolute bottom-8 right-12">
                        <svg viewBox="0 0 100 60" className="w-32 h-20 opacity-30">
                            <path d="M0,30 Q25,0 50,30 T100,30" fill="none" stroke="white" strokeWidth="8" />
                        </svg>
                    </div>
                </div>

                <div className="relative z-10 h-full flex flex-col p-7">
                    {/* Top icon badge */}
                    <div className="flex absolute left-11 top-7 items-start mb-6">
                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg">
                            <div className="grid grid-cols-2 gap-1">
                                <div className="w-2 h-2 rounded-sm bg-white"></div>
                                <div className="w-2 h-2 rounded-sm bg-white"></div>
                                <div className="w-2 h-2 rounded-sm bg-white"></div>
                                <div className="w-2 h-2 rounded-sm bg-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* White content card — NOW CLIPPED WITH YOUR SVG */}
                    <div
                        className="bg-white p-9 flex-1 flex flex-col relative"
                        style={{
                            clipPath: 'url(#white-card-clip)',
                            borderRadius: '0', // removed because clipPath handles the shape
                        }}
                    >
                        <div className="text-5xl absolute top-25 font-serif " style={{ color: 'var(--text-on-primary)' }}>"</div>

                        <h1 className="text-2xl mt-27 font-semibold leading-relaxed mb-4" style={{ color: 'var(--text-on-primary)' }}>
                            Market Value Reflects What The World Thinks About Value, Not Always What It Is Actually Worth. Market Value Is Not Just About Numbers.
                        </h1>

                        <div className="mt-8">
                            <p className="text-[9px] text-gray-500 mb-6 ">
                                You Can See The Price, But You Have To Understand The Market Value.
                            </p>


                        </div>

                        {/* Removed the old bottom-right cutout SVG — your clipPath already creates the organic shape */}
                    </div>
                </div>

                <button className="inline-flex absolute bottom-7 left-13 items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-medium z-50 shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--secondary)' }}>
                    Learn More
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
                    </div>
                </button>
            </div>
        </div>
    );
}