import React from 'react';
import { Phone, Globe } from 'lucide-react';
import '../Beige-Customer-Testimonial-Social-Media-Post-Carousel.css'

export default function TrustedTeamsTestimonialPoster() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">


            <div
                className="Beige-Customer-Testimonial-Social-Media-Post-Carousel relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[var(--bg-light)]"
                style={{
                    backgroundColor: 'var(--gradient-primary)',
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
                {/* Green section - right side */}
                <div className="absolute top-0 right-0 bottom-0 w-[90%] bg-[image:var(--gradient-primary)]">
                    {/* Tiled pattern background in green section - bigger tiles + top-left blur */}
                    <div className="absolute bottom-0 right-0 w-36 h-30 overflow-hidden opacity-5 pointer-events-none">
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

                    {/* Grid lines decoration */}
                    <div className="absolute inset-0">
                        {/* Vertical center line */}
                        <div className="absolute left-43 top-0 bottom-0 w-[2px] bg-[var(--secondary)] opacity-40"></div>

                        {/* Horizontal line - top third */}
                        <div className="absolute top-1/6 left-0 right-0 h-[2px] bg-[var(--secondary)] opacity-40"></div>

                        {/* Circle node - top */}
                        <div className="absolute top-1/6 left-43 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--secondary)] bg-[var(--primary)]"></div>

                        {/* Horizontal line - bottom third */}
                        <div className="absolute -bottom-26 p-20 left-14 w-[300px] h-[2px] rounded-tr-[45px] border-2 border-[var(--secondary)] opacity-40"></div>

                        {/* Circle node - bottom */}
                        <div className="absolute bottom-11 left-43 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--secondary)] bg-[var(--primary)]"></div>

                    </div>
                </div>

                <div className="relative z-10 h-full flex">
                    {/* Left section - Person and logo */}
                    <div className="w-[40%] bg-[var(--secondary)] rounded-tr-[90px] flex flex-col p-6">
                        {/* Logo at top */}
                        <div className="flex items-start mb-8">
                            <div className="flex items-center gap-1">
                                <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-[var(--primary)]"></div>
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-[var(--primary)]">YOUR</div>
                                    <div className="text-xs font-bold text-[var(--primary)]">LOGO</div>
                                </div>
                            </div>
                        </div>

                        {/* Person image */}
                        <div className="flex-1 flex items-end">
                            <div className="w-full ">
                                <div className=" h-110 w-45 flex absolute left-0 -bottom-1 justify-start ">
                                    <img
                                        src="https://static.vecteezy.com/system/resources/thumbnails/050/512/099/small/portrait-professional-young-business-man-look-smart-confident-stylish-dashing-attractive-isolated-white-transparent-background-png.png"
                                        alt="Professional woman"
                                        className="w-full h-full object-cover object-top"

                                    />
                                </div>


                            </div>
                        </div>

                        {/* Name and title overlay */}
                        <div className="z-50">
                            <h3 className="text-base font-bold text-[var(--secondary)]">Leland Lubowitz</h3>
                            <p className="text-xs text-[var(--secondary)]">Head of Product</p>
                        </div>
                    </div>

                    {/* Right section - Content on green background */}
                    <div className="w-[60%] flex pl-18 flex-col justify-between p-6">
                        {/* Contact info at top */}
                        <div className="space-y-2 mt-2 text-[var(--secondary)] opacity-90">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span className="text-xs font-semibold">(0)(0) 0000-0000</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-semibold">www.yourwebsite.com</span>
                            </div>
                        </div>

                        {/* Main content - center */}
                        <div className=" flex flex-col justify-center">
                            <h1 className="text-3xl font-bold  text-[var(--secondary)] mb-6">
                                Trusted by <br /> teams <br /> who think growth-first
                            </h1>

                            <p className="text-sm text-[var(--secondary)] w-[150px] opacity-90">
                                The most seamless agency experience we've had — they understand both design and data.
                            </p>
                        </div>

                        {/* Empty space for bottom decoration */}
                        <div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}