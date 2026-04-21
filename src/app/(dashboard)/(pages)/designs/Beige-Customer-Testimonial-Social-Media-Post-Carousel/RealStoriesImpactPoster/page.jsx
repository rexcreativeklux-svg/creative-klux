import React from 'react';
import { Phone, Globe } from 'lucide-react';
import '../Beige-Customer-Testimonial-Social-Media-Post-Carousel.css'

export default function RealStoriesImpactPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 ">

            <div
                className="Beige-Customer-Testimonial-Social-Media-Post-Carousel relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                style={{
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

                <div className="relative z-10 h-full flex flex-col">

                    {/* Top green section */}
                    <div className=" p-8 pb-50 bg-[image:var(--gradient-secondary)] flex flex-col">
                        {/* Tiled pattern background in green section - bigger tiles + top-left blur */}
                        <div className="absolute top-0 right-0 w-100 h-28 overflow-hidden opacity-5 pointer-events-none">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    {/* Larger checkerboard pattern */}
                                    <pattern id="tile-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                        <rect x="0" y="0" width="50" height="50" fill="white" />
                                        <rect x="50" y="50" width="50" height="50" fill="white" />
                                    </pattern>

                                    {/* Blur filter */}
                                    <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="8" />
                                    </filter>

                                    {/* Gradient mask: opaque on bottom-right, fading to transparent on top-left */}
                                    <mask id="fade-mask">
                                        <rect width="100%" height="100%" fill="white" />
                                        <rect
                                            width="100%"
                                            height="100%"
                                            fill="black"
                                            style={{ maskImage: 'radial-gradient(circle at top left, transparent 20%, black 70%)' }}
                                        />
                                    </mask>
                                </defs>

                                {/* Main tiled background */}
                                <rect width="100%" height="100%" fill="url(#tile-pattern)" />

                                {/* Blurred overlay on top-left */}
                                <rect
                                    width="80%"
                                    height="80%"
                                    x="0"
                                    y="0"
                                    fill="url(#tile-pattern)"
                                    filter="url(#soft-blur)"
                                    mask="url(#fade-mask)"
                                    opacity="0.8"
                                />
                            </svg>
                        </div>

                        {/* Vertical center line */}
                        <div className="absolute right-55 top-0 bottom-0 w-[2px] bg-[var(--secondary)] opacity-40"></div>

                        {/* Horizontal line - top third */}
                        <div className="absolute top-28 w-[220px] right-0 h-[2px] bg-[var(--secondary)] opacity-40"></div>

                        {/* Circle node - top */}
                        <div className="absolute top-28 right-51 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--secondary)] bg-[var(--primary)]"></div>

                        {/* Logo and contact */}
                        <div className="flex items-start justify-between mb-14">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full border-4 border-[var(--primary)]"></div>
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-[var(--secondary)]">YOUR</div>
                                    <div className="text-xs font-bold text-[var(--secondary)]">LOGO</div>
                                </div>
                            </div>

                            {/* Contact info */}
                            <div className=" space-y-1">
                                <div className="flex items-center  gap-2 text-[var(--secondary)]">
                                    <Phone className="w-3 h-3" />
                                    <span className="text-xs font-semibold">(0)(0) 0000-0000</span>
                                </div>
                                <div className="flex items-center  gap-2 text-[var(--secondary)]">
                                    <Globe className="w-3 h-3" />
                                    <span className="text-xs font-semibold">www.yourwebsite.com</span>
                                </div>
                            </div>
                        </div>

                        {/* Headline */}
                        <div className="flex-1 flex flex-col w-[230px] relative -mb-5 justify-center">
                            <h1 className="text-3xl font-bold text-[var(--secondary)] mb-4">
                                Real Stories.<br />
                                Real Impact
                            </h1>
                            <p className="text-sm font-medium text-[var(--secondary)] w-[180px] opacity-90">
                                From small startups to global clients—results that speak louder than slides.
                            </p>
                        </div>
                    </div>

                    {/* Bottom cream section with person and testimonial */}
                    <div className="bg-[var(--secondary)] -top-34 rounded-tr-[150px] relative flex">


                        {/* Person image - right side */}
                        <div className="absolute w-95 h-120  overflow-hidden right-5 bottom-0">
                            <img
                                src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                alt="Darren Watkins - CEO"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Testimonial quote - left side */}
                        <div className="relative w-2/5 bottom-15 p-6 flex flex-col justify-center">
                            {/* Large quotation mark background */}
                            <div className="relative top-20 -left-7  pointer-events-none">
                                <svg width="180" height="120" viewBox="0 0 100 100">
                                    <text x="0" y="80" fontSize="120" fontWeight="900" fill="var(--accent-on-secondary)" fontFamily="serif">"</text>
                                </svg>
                            </div>

                            {/* Quote text */}
                            <p className="text-base font-bold text-[var(--primary)] leading-tight mb-6">
                                They didn't just deliver—they became part of our team
                            </p>

                            {/* Author */}
                            <div>
                                <p className="text-base font-bold text-[var(--primary)]">Marnie Mayert</p>
                                <p className="text-xs text-gray-600">Co-Founder</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}