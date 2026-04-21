import React from 'react';
import '../Real-Estate-Social-Media-Post.css'

export default function FamilyDreamsPoster() {
    return (
        <div className=" flex items-center justify-center p-8" >

            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Large outline decoration - top right */}
                <div className="absolute -top-22 -right-45 rotate-[-9deg] z-50 pointer-events-none">
                    <div
                        className="relative"
                        style={{
                            fontSize: '520px',
                            lineHeight: '0.8',
                            fontWeight: '900',
                            color: 'var(--secondary-light)',
                            // Thick colored border via text-stroke
                            WebkitTextStroke: '1px var(--primary)',  // Main border effect
                            textStroke: '8px var(--primary)',
                            // Optional: add subtle shadow for depth
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                        }}
                    >
                        *
                    </div>
                </div>

                <div className="relative z-10 h-full flex flex-col ">

                    <div className='bg-[var(--secondary-light)] p-8'>
                        {/* Logo at top */}
                        <div className="flex items-start mb-8">
                            <div className="flex items-center gap-2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="var(--primary)" opacity="0.9" />
                                    <polyline points="9 22 9 12 15 12 15 22" fill="#f5f3ef" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-sm font-bold tracking-wide" style={{ color: 'var(--primary)' }}>REAL ESTATE</div>
                                    <div className="text-xs" style={{ color: 'var(--primary)', opacity: 0.7 }}>FIND THE ONE</div>
                                </div>
                            </div>
                        </div>

                        {/* Main Headline */}
                        <div className=" max-w-xs">
                            <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--primary)' }}>
                                It All Starts With<br />
                                Understanding Your<br />
                                Family's Dreams
                            </h1>
                        </div>
                    </div>

                    {/* Sofa image */}
                    <div className="relative -top-8 flex justify-center">
                        <div className="w-full max-w-sm">
                            <img
                                src="https://static.vecteezy.com/system/resources/thumbnails/070/649/473/small/modern-beige-sofa-with-cushion-isolated-on-transparent-background-png.png"
                                alt="Comfortable sofa with pillows"
                                className="w-full h-auto object-contain"
                                style={{
                                    filter:
                                        'drop-shadow(0 30px 25px rgba(0,0,0,0.4)) ' +
                                        'drop-shadow(0 50px 50px rgba(0,0,0,0.35)) '

                                }}
                            />
                        </div>
                    </div>

                    {/* Description text box */}
                    <div className="mb-4 relative -top-5 px-17">
                        <p className="text-sm text-[var(--primary)] font-semibold  text-center">
                            We sit down with you to listen about your budget, your needs, and the life you envision in your new home.
                        </p>
                    </div>

                    {/* Footer - Contact info */}
                    <div className="flex relative -top-4 items-center text-[var(--primary)] font-medium justify-center gap-2 text-[10px]">
                        <span>000 0000-0000</span> |
                        <span>www.yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}