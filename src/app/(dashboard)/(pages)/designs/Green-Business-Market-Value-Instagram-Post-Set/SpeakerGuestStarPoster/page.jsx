import React from 'react';
import { ArrowRight } from 'lucide-react';
import '../Green-Business-Market-Value-Instagram-Post-Set.css'

export default function SpeakerGuestStarPoster() {
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
                data-category="event-announcement"
                data-industry="business"
                data-orientation="portrait"
                data-event="conference"
            >
                {/* Background decorative W-shaped line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <svg
                        className="absolute inset-x-0 -left-50 -top-20 w-[1000px] h-[700px]"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1200 300"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M200,50 Q275,250 350,250 Q425,250 500,100 Q575,250 650,250 Q725,250 800,50"
                            fill="none"
                            stroke="var(--accent-on-secondary)"
                            strokeWidth="24"
                            strokeLinecap="round"
                            opacity="0.7"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Top header with social media and logo */}
                    <div className="flex items-start justify-between mb-2">
                        {/* Social media icons */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[var(--primary)]">@socialmedia</span>
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

                        {/* Company logo */}
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
                                <div className="text-sm font-bold text-[var(--primary)]">Company</div>
                                <div className="text-xs text-[var(--primary)]">Name Here</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className=" flex justify-center text-center">
                        <h1 className=" font-black relative text-[var(--primary)]" >
                            <span className='text-[55px]'>The Speaker </span><br />
                            <span className='font-medium relative -top-8 text-[55px]'>Guest Star</span>
                        </h1>
                    </div>

                    {/* Today badge with arrow */}
                    <div className="flex flex-col relative -top-5 left-3 w-[600px] gap-8 mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--secondary)]" >
                            <div className="absolute text-[130px] font-bold text-[var(--primary)] -top-12 -left-9" >
                                *
                            </div>
                            <span className="text-4xl pl-6 font-bold text-white">Today?</span>
                        </div>

                        {/* Arrow */}
                        <div className="h-1 w-40 bg-gray-800 relative">
                            <ArrowRight className="absolute -right-4 -top-3.5 w-9 h-8 text-[var(--primary)]" strokeWidth={3} />
                        </div>
                    </div>

                    {/* Content area with text and image */}
                    <div className="flex-1 flex gap-6 mb-6">
                        {/* Left side - Description */}
                        <div className="flex-1 flex flex-col justify-center">
                            <p className="text-sm font-medium w-[205px] text-[var(--primary)]">
                                Spotting value-driven creators helps brands collaborate with impact. Let's see if you can guess today's pick!
                            </p>
                        </div>

                        {/* Right side - Person image */}
                        <div className=" h-110 flex absolute -right-80 -bottom-8 justify-start ">
                            <div className="  ">
                                <img
                                    src="https://static.vecteezy.com/system/resources/thumbnails/050/512/099/small/portrait-professional-young-business-man-look-smart-confident-stylish-dashing-attractive-isolated-white-transparent-background-png.png"
                                    alt="Professional woman"
                                    className="w-full h-full object-cover object-top"

                                />
                            </div>
                        </div>
                    </div>

                    {/* Speaker info section */}
                    <div className="space-y-2 flex flex-col relative -left-12 items-center z-50">
                        <div className="rounded-full flex justify-end px-6 py-2 w-[300px] shadow-lg bg-[var(--primary)]" >
                            <p className="text-xl font-black text-[var(--text-on-primary)]">"Josh Vasquez"</p>
                        </div>
                        <div className="rounded-full px-3 text-center py-2 shadow-md w-[200px] bg-[var(--primary)]" >
                            <p className="text-sm text-[var(--text-on-primary)]">CEO BRAND COMPANY</p>
                        </div>
                    </div>

                    {/* Footer - Website */}
                    <div className="mt-3 z-50 relative flex justify-center">
                        <div className="flex relative -left-25 items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[var(--primary)]" ></div>
                            <span className="text-xs font-bold text-[var(--primary)]">www.yourwebsite.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}