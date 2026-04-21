import React from 'react';
import { MessageCircle } from 'lucide-react';
import '../Green-Business-Market-Value-Instagram-Post-Set.css'

export default function HonestyTestimonialsPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8" >

            <div
                className="Green-Business-Market-Value-Instagram-Post-Set relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow)',
                    aspectRatio: '9 / 12'
                }}
                data-size="medium"
                data-category="testimonial"
                data-industry="business"
                data-orientation="portrait"
                data-event="none"
            >
                {/* Decorative rounded blobs */}
                <div className="absolute -top-5 left-0 text-[250px] leading-none font-medium text-[var(--primary-light)]  pointer-events-none select-none">
                    ✱
                </div>
                <div className="absolute bottom-32 right-12 w-24 h-24 rounded-full bg-green-300 opacity-30"></div>

                <div className="relative z-10 h-full flex flex-col">

                    <div className='px-8 pt-8'>
                        {/* Top section with logo and social */}
                        <div className="flex items-start justify-between mb-4">
                            {/* Company logo */}
                            <div className="flex items-center gap-2">
                                <svg width="32" height="32" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="18" fill="var(--primary)" />
                                    <circle cx="20" cy="20" r="8" fill="var(--bg-green)" />
                                    <rect x="18" y="5" width="4" height="8" fill="var(--bg-green)" />
                                    <rect x="18" y="27" width="4" height="8" fill="var(--bg-green)" />
                                    <rect x="5" y="18" width="8" height="4" fill="var(--bg-green)" />
                                    <rect x="27" y="18" width="8" height="4" fill="var(--bg-green)" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-sm font-bold  text-[var(--primary)]" >Company</div>
                                    <div className="text-xs  text-[var(--primary)]">Name Here</div>
                                </div>
                            </div>

                            {/* Social media icons */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold  text-[var(--primary)]" >@socialmedia</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full border-2 flex  text-[var(--primary)] items-center justify-center" style={{ borderColor: 'var(--primary)' }}>
                                        <span className="text-xs font-bold  text-[var(--primary)]" >G</span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2  text-[var(--primary)] flex items-center justify-center" style={{ borderColor: 'var(--primary)' }}>
                                        <span className="text-xs font-bold  text-[var(--primary)]" >f</span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full  text-[var(--primary)] border-2 flex items-center justify-center" style={{ borderColor: 'var(--primary)' }}>
                                        <span className="text-xs font-bold  text-[var(--primary)]" >in</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Headline */}
                        <div className="mb-6 flex justify-center text-center">
                            <h1 className="text-6xl font-black text-[var(--primary)]" >
                                About Our<br />
                                Honesty
                            </h1>
                        </div>
                    </div>

                    <div className='bg-[var(--primary-light)] rounded-t-[55px] px-8'>
                        {/* Testimonials label */}
                        <div className="py-3 flex justify-center">
                            <h2 className="text-4xl tracking-wider font-bold text-[var(--primary)]">
                                Testimonials
                            </h2>
                        </div>

                        {/* Testimonial card */}
                        <div className="mb-4 bg-[var(--secondary-light)] rounded-3xl py-6 px-14 shadow-lg relative">
                            {/* Chat bubble icon - top right */}
                            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--primary)' }}>
                                <MessageCircle className="w-8 h-8 text-[var(--secondary)]" strokeWidth={1} />
                            </div>

                            {/* Profile section */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--secondary)' }}>
                                    <span className="text-lg font-black text-white">RM</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-md font-bold text-[var(--primary)]" >Rafayel Medeiros</h3>

                                    <div className='flex gap-2'>
                                        <p className="text-xs text-[var(--primary)]">Market Instructor</p>

                                        {/* 5 stars */}
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <span key={i} className="text-[var(--primary)] text-xs">★</span>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                            </div>

                            {/* Testimonial text */}
                            <p className="text-xs text-[var(--primary)] font-medium flex justify-center leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim
                            </p>
                        </div>

                        {/* Bottom CTA section */}
                        <div className="mt-auto flex flex-col pb-9 justify-center">
                            <h2 className="text-3xl font-black justify-center text-center text-[var(--primary)] leading-tight mb-2">
                                Let's Make Your Growth
                            </h2>

                            <div className="flex items-center justify-between px-3">
                                <span className="text-sm font-black text-[var(--primary)]">www.yourwebsite.com</span>

                                {/* Four decorative compass icons */}
                                <div className="flex gap-2 items-center">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="text-3xl relative top-2 font-black"
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
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}