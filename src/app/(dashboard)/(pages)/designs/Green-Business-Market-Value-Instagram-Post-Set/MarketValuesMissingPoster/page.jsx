import React from 'react';
import '../Green-Business-Market-Value-Instagram-Post-Set.css'

export default function MarketValuesMissingPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">

            <div
                className="Green-Business-Market-Value-Instagram-Post-Set relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--secondary-light)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow)',
                    aspectRatio: '9 / 12'
                }}
                data-size="medium"
                data-category="educational"
                data-industry="business"
                data-orientation="portrait"
                data-event="none"
            >
                {/* Decorative green blob - top left */}
                <div className="absolute -top-16 -left-16 w-68 h-48 bg-[var(--secondary)] rounded-full"></div>

                {/* Decorative dark green blob - top right */}
                <div className="absolute -top-17 -right-15 w-50 h-40 bg-[var(--primary)] rounded-full" ></div>

                {/* Decorative light green blob - bottom */}
                <div className="absolute bottom-0 -right-3 text-[350px] leading-none font-medium text-[var(--accent-on-secondary)]  pointer-events-none select-none">
                    ✱
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Company logo - top left */}
                    <div className="flex items-start mb-6">
                        <div className="flex items-center gap-2">
                            <svg width="28" height="28" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="var(--primary)" />
                                <circle cx="20" cy="20" r="8" fill="var(--bg-light)" />
                                <rect x="18" y="5" width="4" height="8" fill="var(--bg-light)" />
                                <rect x="18" y="27" width="4" height="8" fill="var(--bg-light)" />
                                <rect x="5" y="18" width="8" height="4" fill="var(--bg-light)" />
                                <rect x="27" y="18" width="8" height="4" fill="var(--bg-light)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-xs font-bold text-gray-900">Company</div>
                                <div className="text-xs text-gray-600">Name Here</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-6 relative">
                        <h1 className="text-3xl font-black flex flex-col text-[var(--primary)] leading-tight">
                            <span className='text-4xl'>What Happens</span>
                            When Market<br />
                            <div className='text-[var(--secondary)] z-40'>
                                <span className='text-[var(--primary)]'> Values</span>
                                <span> missing?</span>
                            </div>
                        </h1>

                        <div className="absolute top-9 left-49 text-[120px] leading-none font-medium text-[var(--primary)]  pointer-events-none select-none">
                            ✱
                        </div>
                    </div>

                    {/* Two column layout */}
                    <div className=" relative flex gap-2">
                        {/* Left column - Description and Key Points */}
                        <div className=" flex flex-col">
                            {/* Description */}
                            <div className="mb-5 w-[260px]">
                                <p className="text-sm font-medium text-[var(--primary)] ">
                                    Brands become reactive, inconsistent, and forgettable. Do your customers know what you stand for?
                                </p>
                            </div>

                            {/* Key Points box */}
                            <div className="rounded-t-xl flex flex-col  rounded-br-xl w-[300px] p-5 -left-7 relative shadow-lg bg-[var(--primary)]">
                                <h3 className="text-base flex  ml-9 font-black text-[var(--secondary-light)] mb-3">Key Points:</h3>
                                <ul className="space-y-2 ml-12 text-[var(--secondary-light)] text-xs ">
                                    <li> A lack of values leads to misaligned</li>
                                    <li> It becomes harder to build loyalty.</li>
                                    <li> Your brand becomes vulnerable.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right column - Person image */}
                        <div className="relative -top-25 -left-40 flex items-end">
                            <div className="w-85 h-68">
                                <img
                                    src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                    alt="Professional woman smiling in office setting (transparent background)"
                                    className="w-full h-auto object-contain"
                                    style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom section */}
                    <div className="flex relative bottom-5 justify-between">
                        {/* Contact info */}
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">For More Information:</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-[var(--primary)]">www.yourwebsite.com</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-bold">f</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-bold">t</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-bold">in</span>
                                    </div>
                                    <span className="text-sm font-bold text-[var(--primary)]">@socialmedia</span>
                                </div>
                            </div>
                        </div>

                        <div className='border h-20 border-[var(--primary)]'></div>

                        {/* Join Us */}
                        <div className="text-right relative -left-5 -top-1">
                            <h2 className="text-4xl italic font-black leading-tight text-[var(--primary)]">
                                Join<br />
                                Us!
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}