import React from 'react';
import { ArrowRight } from 'lucide-react';
import '../Green-Business-Market-Value-Instagram-Post-Set.css'

export default function MarketCompassTimelinePoster() {
    return (
        <div className=" flex items-center justify-center p-8" >

            <div
                className="Green-Business-Market-Value-Instagram-Post-Set relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--secondary-light)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow)',
                    aspectRatio: '9 / 12'
                }}
                data-size="medium"
                data-category="corporate-branding"
                data-industry="business"
                data-orientation="portrait"
                data-event="none"
            >

                {/* top left */}
                <div className="absolute top-0 -left-10 " style={{ fontSize: '550px', lineHeight: '0.8', fontWeight: '600', color: 'var(--accent-on-secondary)' }}>
                    *
                </div>

                {/* bottom right */}
                <div className="absolute -bottom-40 rotate-30 -right-0 " style={{ fontSize: '550px', lineHeight: '0.8', fontWeight: '600', color: 'var(--accent-on-secondary)' }}>
                    *
                </div>

                <div className="relative z-10 h-full flex flex-col">
                    {/* Logo at top */}
                    <div className="flex items-start justify-center py-7">
                        <div className="flex items-center gap-2">
                            <svg width="32" height="32" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="var(--primary)" />
                                <circle cx="20" cy="20" r="8" fill="var(--bg-light)" />
                                <rect x="18" y="5" width="4" height="8" fill="var(--bg-light)" />
                                <rect x="18" y="27" width="4" height="8" fill="var(--bg-light)" />
                                <rect x="5" y="18" width="8" height="4" fill="var(--bg-light)" />
                                <rect x="27" y="18" width="8" height="4" fill="var(--bg-light)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-base font-bold text-gray-900">Company</div>
                                <div className="text-xs text-gray-600">Name Here</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-4 ">
                        <h1 className="text-3xl flex text-[var(--primary)] gap-1 justify-center font-black ">
                            Your Market Are <span className='text-[var(--secondary)] mt-1 text-[35px]'>*</span>
                        </h1>
                        <h1 className="text-[75px] -mt-12 text-[var(--secondary)] flex justify-center font-black " >
                            Compass
                        </h1>
                    </div>

                    {/* Timeline with images */}
                    <div className="flex-1 px-8">
                        <div className="relative flex items-center justify-between">
                            {/* From 2020 */}
                            <div className="absolute top-0 left-0">
                                <p className="text-xs font-bold text-gray-600 mb-1">From <span className="text-lg font-black text-gray-900">2020</span></p>
                            </div>

                            {/* To 2025 */}
                            <div className="absolute bottom-0 right-0">
                                <p className="text-xs font-bold text-gray-600 text-right mb-1">To <span className="text-lg font-black text-gray-900">2025</span></p>
                            </div>

                            {/* Images with arrows */}
                            <div className="flex relative items-center justify-between w-full mt-16 gap-4">
                                {/* Image 1 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-30 h-38 rounded-lg overflow-hidden shadow-lg bg-gray-200">
                                        <img
                                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop"
                                            alt="Professional 1"
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                </div>

                                {/* Arrow 1 */}
                                <div className="flex z-50 relative items-center rounded-lg bg-[var(--accent-on-secondary)] p-2 right-28 bottom-10 justify-center">
                                    <ArrowRight className="w-6 h-6 rotate-30" strokeWidth={2} />
                                </div>

                                {/* Image 2 */}
                                <div className="flex absolute left-33 -top-12 flex-col items-center">
                                    <div className="w-30 h-44 rounded-lg overflow-hidden shadow-lg bg-gray-200">
                                        <img
                                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
                                            alt="Professional 2"
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                </div>

                                {/* Arrow 2 */}
                                <div className="flex z-50 relative items-center rounded-lg bg-[var(--accent-on-secondary)] p-2 right-26 bottom-10 justify-center">
                                    <ArrowRight className="w-6 h-6 rotate-30" strokeWidth={2} />
                                </div>

                                {/* Image 3 */}
                                <div className="flex absolute right-0 -top-24 flex-col items-center">
                                    <div className="w-30 h-38 rounded-lg overflow-hidden shadow-lg bg-gray-200">
                                        <img
                                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop"
                                            alt="Professional 3"
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Bottom CTA section */}
                    <div className="rounded-full flex justify-center items-center relative top-8 bg-[var(--secondary)] pt-6 pb-14 shadow-lg">
                        <div className="flex items-center gap-10 justify-between">
                            <div className="flex flex-row gap-6">
                                <h3 className="text-md text-[var(--primary)] font-bold flex items-center leading-tight ">Market <br /> Values</h3>
                                <div className='border text-gray-600'></div>
                                <p className="text-xs flex mt-1 flex-col">
                                    For More Information:
                                    <span className='font-bold'> www.yourwebsite.com</span>
                                </p>
                            </div>
                            <button className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <ArrowRight className="w-6 h-6 text-gray-700" strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}