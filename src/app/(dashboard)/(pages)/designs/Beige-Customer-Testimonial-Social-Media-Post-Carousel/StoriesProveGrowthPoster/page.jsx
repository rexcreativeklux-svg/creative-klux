import React from 'react';
import { Phone, Globe } from 'lucide-react';
import '../Beige-Customer-Testimonial-Social-Media-Post-Carousel.css'

export default function StoriesProveGrowthPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 ">

            <div
                className="Beige-Customer-Testimonial-Social-Media-Post-Carousel  relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[var(--bg-light)]"
                style={{
                    backgroundColor: 'var(--secondary-light)',
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

                {/* Grid lines decoration */}
                <div className="absolute inset-0">

                    {/* Vertical center line */}
                    <div className="absolute right-14 top-0 bottom-0 w-[2px] bg-[var(--primary)]"></div>

                    {/* Diagonal growth line */}
                    <div className="absolute top-6 rotate-55 bottom-0 left-43 right-24 w-[2px] h-[530px] bg-[var(--primary)]"></div>

                    {/* Circle node - top */}
                    <div className="absolute top-34 right-10 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--primary)] bg-[var(--secondary)]"></div>

                </div>



                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-start mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full border-4 border-white"></div>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-[var(--primary)]">YOUR</div>
                                <div className="text-sm font-bold text-[var(--primary)]">LOGO</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-5">
                        <h1 className="text-5xl font-bold text-[var(--primary)]">
                            Stories
                        </h1>
                        <h1 className="text-[44px] font-bold text-[var(--primary)]">
                            That Prove
                        </h1>
                        <h1 className="text-5xl font-bold text-[var(--primary)]">
                            Growth
                        </h1>
                    </div>

                    {/* Testimonial card with person image */}
                    <div className="relative  ">
                        {/* Green rounded card */}
                        <div className="relative rounded-3xl bg-[var(--primary)] shadow-xl overflow-visible">
                            <div className="p-6 flex flex-col gap-3 justify-between">
                                {/* Quote text */}
                                <div className="mb-2">
                                    <p className="text-white text-sm  w-[140px]">
                                        They transformed our website and ads strategy — our inquiries doubled in just one month.
                                    </p>
                                </div>

                                {/* Author info */}
                                <div className="mb-3 space-y-1">
                                    <h3 className="text-white text-md font-bold">Kevin Raharejo</h3>
                                    <p className="text-white text-xs opacity-80">Co-Founder</p>
                                </div>

                                {/* Tags - now inside card but positioned to overlap the image */}
                                <div className=" z-50 flex flex-row justify-between gap-2 pointer-events-none">
                                    <span className="px-2 py-2 rounded-full bg-[var(--accent-on-primary)] text-white text-[11px] font-black ">
                                        Growth-focused
                                    </span>
                                    <span className="px-2 py-2 rounded-full bg-[var(--accent-on-primary)] text-white text-[11px] font-black ">
                                        Strategy Expert
                                    </span>
                                    <span className="px-2 py-2 rounded-full bg-[var(--accent-on-primary)] text-white text-[11px] font-black ">
                                        Results-Driven
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Person image - overlapping the card from bottom-right */}
                        <div className="relative w-80 h-100  overflow-hidden -right-15 bottom-100">
                            <img
                                src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                alt="Darren Watkins - CEO"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Footer - Contact info */}
                    <div className="flex gap-4 items-center absolute bottom-5 justify-between">
                        <div className="flex items-center gap-2 text-[var(--primary)]">
                            <Phone className="w-4 h-4" />
                            <span className="text-xs font-semibold">(00)(0000-0000)</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--primary)]">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-semibold">www.yourwebsite.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}