import React from 'react';
import '../Real-Estate-Social-Media-Post.css'

export default function LuxuryHouseSalePoster() {
    return (
        <div className=" flex items-center justify-center p-8" >

            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}
                data-size="medium"
                data-category="property-listing"
                data-industry="real-estate"
                data-orientation="portrait"
                data-event="none"
            >
                <div className="relative z-10 h-full flex flex-col">

                    <div className=' pt-8'>
                        {/* Logo at top */}
                        <div className="flex items-start px-8 mb-4">
                            <div className="flex items-center gap-2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" opacity="0.9" />
                                    <polyline points="9 22 9 12 15 12 15 22" fill="var(--primary)" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white tracking-wide">REAL ESTATE</div>
                                    <div className="text-xs text-gray-300">FIND THE ONE</div>
                                </div>
                            </div>
                        </div>

                        {/* Main Headline */}
                        <div className="text-center mb-3">
                            <h1 className="text-[45px] leading-tight font-bold text-[var(--secondary)] tracking-wide">
                                LUXURY HOUSE<br />
                                FOR SALE
                            </h1>
                        </div>

                        {/* Sofa image */}
                        <div className="relative -top-10 flex justify-center">
                            <div className=" w-full h-auto">
                                <img
                                    src="https://static.vecteezy.com/system/resources/thumbnails/045/794/281/small/a-large-house-stands-elegantly-with-a-pool-in-front-of-it-creating-a-luxurious-and-spacious-outdoor-living-area-png.png"
                                    alt="Modern luxury house"
                                    className="w-full h-[300px] object-cover"
                                    style={{
                                        filter:
                                            'drop-shadow(0 30px 25px rgba(0,0,0,0.4)) ' +
                                            'drop-shadow(0 50px 50px rgba(0,0,0,0.35)) '

                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className='bg-[var(--secondary)] px-8 py-5 relative bottom-10'>
                        {/* Description text */}
                        <div className="text-center mb-4">
                            <p className="text-sm text-[var(--primary)] font-semibold ">
                                From the scent of coffee in the morning to the <br /> sound of laughter, some homes are just <br /> made for creating memories.
                            </p>
                        </div>

                        {/* Footer - Contact info */}
                        <div className="flex items-center justify-center gap-2 text-[var(--primary)] text-[10px] font-medium">
                            <span>000 0000-0000</span> |
                            <span>www.yourwebsite.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}