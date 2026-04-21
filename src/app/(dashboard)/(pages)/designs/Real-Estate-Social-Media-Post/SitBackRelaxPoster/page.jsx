import React from 'react';
import '../Real-Estate-Social-Media-Post.css'

export default function SitBackRelaxPoster() {
    return (
        <div className="flex items-center justify-center">

            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
               <div className="absolute -top-32 -left-75 w-170 h-170 z-10 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-start mb-6">
                        <div className="flex items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="var(--secondary)" opacity="0.9" />
                                <polyline points="9 22 9 12 15 12 15 22" fill="var(--primary)" />
                            </svg>
                            <div className="text-left">
                                <div className="text-md font-bold text-[var(--secondary)] tracking-wide">REAL ESTATE</div>
                                <div className="text-xs text-[var(--secondary)]">HEADLINE HERE</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-4 max-w-xs">
                        <h1 className="text-3xl font-bold leading-tight text-[var(--secondary)]">
                            Sit Back And Relax,<br />
                            Let Us Take Care Of<br />
                            Everythings
                        </h1>
                    </div>

                    {/* Description */}
                    <div className="mb-0 max-w-[250px]">
                        <p className="text-sm text-[var(--secondary)] font-medium leading-relaxed">
                            Leave the process to us. We handle the marketing and negotiations to get you a great price.
                        </p>
                    </div>

                    {/* Sofa image */}
                    <div className="flex-1 flex items-end justify-center">
                        <div className="w-full max-w-sm">
                            <img
                               src="https://static.vecteezy.com/system/resources/thumbnails/070/649/473/small/modern-beige-sofa-with-cushion-isolated-on-transparent-background-png.png"
                                alt="Comfortable sofa with pillows"
                                className="w-full h-auto object-contain"
                                style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                            />
                        </div>
                    </div>

                    {/* Footer - Contact info */}
                    <div className="flex justify-center gap-2 mt-2 items-center text-[var(--primary)] text-xs font-medium">
                        <span className='text-xs'>000 0000-0000</span> |
                        <span>www.yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}