import React from 'react';
import { FileText } from 'lucide-react';
import '../Green-Business-Market-Value-Instagram-Post-Set.css'

export default function EmbedValuesPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8" >
            <div
                className="Green-Business-Market-Value-Instagram-Post-Set relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--secondary-light)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow)',
                    aspectRatio: '9 / 12'
                }}
                data-size="medium"
                data-category="brand-values"
                data-industry="business"
                data-orientation="portrait"
                data-event="none"
            >
                {/* Decorative green blob - top right */}
                <div className="absolute top-0 right-0 w-58 h-32 bg-[var(--secondary)] rounded-bl-[100px]"></div>

                <div className="absolute -top-5 left-0 text-[350px] leading-none font-medium text-[var(--accent-on-secondary)] pointer-events-none select-none">
                    ✱
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Top section with logo and social */}
                    <div className="flex items-start justify-between mb-8">
                        {/* Company logo */}
                        <div className="flex items-center gap-2">
                            <svg width="32" height="32" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="var(--primary)" />
                                <circle cx="20" cy="20" r="8" fill="var(--secondary-light)" />
                                <rect x="18" y="5" width="4" height="8" fill="var(--secondary-light)" />
                                <rect x="18" y="27" width="4" height="8" fill="var(--secondary-light)" />
                                <rect x="5" y="18" width="8" height="4" fill="var(--secondary-light)" />
                                <rect x="27" y="18" width="8" height="4" fill="var(--secondary-light)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-sm font-bold text-[var(--primary)]">Company</div>
                                <div className="text-xs text-[var(--primary)]">Name Here</div>
                            </div>
                        </div>

                        {/* Social media - top right on green blob */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[var(--primary)]">@socialmedia</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] flex items-center justify-center">
                                    <span className="text-xs font-bold text-[var(--primary)]">G</span>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] flex items-center justify-center">
                                    <span className="text-xs font-bold text-[var(--primary)]">f</span>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] flex items-center justify-center">
                                    <span className="text-xs font-bold text-[var(--primary)]">in</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline with decorative elements */}
                    <div className="mb-2 relative">
                        {/* Arrow pointing down */}
                        <svg className="absolute left-4 top-30 rotate-[-45deg] w-10 h-12" viewBox="0 0 50 50">
                            <path d="M10,5 L10,35 M10,35 L5,30 M10,35 L15,30" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
                        </svg>

                        {/* Four decorative flowers/stars - top right */}
                        <div className="absolute top-9 right-0 flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="text-3xl relative font-black"
                                    style={{
                                        color: 'var(--primary)',
                                        transform: `rotate(${i % 2 === 0 ? 12 : -12}deg)`, // Alternate slight tilt
                                        display: 'inline-block',
                                    }}
                                >
                                    *
                                </div>
                            ))}
                        </div>

                        <h1 className="text-4xl relative top-7 font-black text-[var(--primary)]">
                            Don't Just
                        </h1>
                        <h1 className="text-[80px] flex justify-end tracking-wider relative top-2 left-2 font-black text-[var(--secondary)] " >
                            Say It!
                        </h1>
                    </div>

                    {/* Green rounded box with icon and text */}
                    <div className="mb-4 rounded-full p-6 shadow-lg bg-[var(--secondary)] relative">
                        {/* Icon */}
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center shadow-md">
                            <FileText className="w-6 h-6 text-[var(--primary)]" strokeWidth={2.5} />
                        </div>

                        {/* Text */}
                        <div className="ml-16">
                            <h2 className="text-xl flex justify-center text-center font-bold text-[var(--secondary-light)] leading-tight">
                                Embed Your Values<br />
                                Into Every Experience
                            </h2>
                        </div>
                    </div>

                    <div className='flex flex-row relative'>
                        {/* Dark green content box */}
                        <div className="rounded-tr-3xl rounded-br-3xl py-4 px-4 shadow-xl bg-[var(--primary)] relative -left-7 flex flex-col" >


                            {/* Zigzag arrow decoration */}
                            <svg className="absolute -right-4 top-1/3 w-12 h-24" viewBox="0 0 50 100">
                                <path d="M10,10 L30,30 L10,50 L30,70 L10,90" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
                            </svg>

                            {/* Main content */}
                            <div className="flex-1 pr-8">
                                <p className="text-sm text-white leading-relaxed mb-6">
                                    Your customers interact with your brand in many ways—online, in-store, through support. Are your market values reflected in all of those experiences?
                                </p>

                                {/* CTA Button */}
                                <button className="bg-white rounded-full px-6 py-2 shadow-lg hover:scale-105 transition-transform">
                                    <span className="text-sm font-black" style={{ color: 'var(--primary)' }}>Join With Us</span>
                                </button>
                            </div>
                        </div>

                        {/* Arrow pointing down */}
                        <svg className="absolute -right-0 -top-5 rotate-45 w-7 h-7" viewBox="0 0 50 50">
                            <path d="M10,5 L10,35 M10,35 L5,30 M10,35 L15,30" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
                        </svg>

                        {/* Vertical text on right edge */}
                        <div className=" flex items-center mr-0 justify-center w-10">
                            <div className="transform rotate-90 origin-center whitespace-nowrap">
                                <p className="text-sm font-bold text-[var(--primary)] tracking-widest">
                                    www.yourwebsite.com
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}