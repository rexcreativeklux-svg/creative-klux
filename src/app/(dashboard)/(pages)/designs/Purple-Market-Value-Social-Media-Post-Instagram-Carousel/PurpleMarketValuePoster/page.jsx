import React from 'react';

export default function PurpleMarketValuePoster() {
    return (
        <div className="flex items-center justify-center">
            <div className="relative ClientTestimonialPoster w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white" style={{
                background: 'var(--accent-on-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top right purple circle */}
                <div className="absolute top-4 -right-8 w-25 h-25 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>

                {/* Large yellow circle behind person */}
                <div className="absolute z-10 bottom-10 -right-24 w-85 h-85 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>

                {/* Bottom left purple circle */}
                <div className="absolute top-65 -left-2 w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>

                {/* Small yellow circle at bottom */}
                <div className="absolute z-20  bottom-8 left-14 w-7 h-7 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>

                <div className="absolute -top-18 rotate-28 left-6 pointer-events-none ">
                    <svg width="300" height="700" viewBox="0 0 100 500" fill="none">
                        <path
                            d="M70,0 
   C-60,150 200,220 70,300 
   C-60,380 200,450 70,500"
                            stroke="var(--primary-light)"
                            strokeWidth="46"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                                <div className="w-5 h-5 border-4 border-white rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-900 font-bold text-sm">Company name</span>
                                <span className="text-gray-500 text-xs">here</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-8 max-w-xs">
                        <h1 className="text-4xl font-black " style={{ color: 'var(--primary)' }}>
                            Do You<br />
                            Really Know<br />
                            <span className="inline-block px-3 py-1" style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)' }}>Your Market</span><br />
                            Value?
                        </h1>
                    </div>

                    {/* Description text */}
                    <div className="mb-24 max-w-xs">
                        <p className="text-xs opacity-70 font-medium leading-relaxed">
                            Your value isn't just about<br />
                            price, it's about trust,<br />
                            consistency, and relevance.
                        </p>
                    </div>



                    {/* Swipe to Learn More CTA */}
                    <div className="mb-6 relative z-20">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black" style={{ color: 'var(--primary)' }}>
                                Swipe to<br />Learn More
                            </span>
                            <svg width="32" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>


                </div>

                {/* Person image - positioned absolutely to overlap with yellow circle */}
                <div className="absolute bottom-17 z-20 right-0 w-56 h-100">
                    <img
                        src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                        alt="Professional woman"
                        className="w-full h-full object-cover object-top"

                    />
                </div>

                {/* Footer - Contact info */}
                <div className='flex relative bottom-10 justify-center '>
                    <div className="flex z-20 w-[250px] rounded-full py-1 items-center justify-center bg-white gap-4 text-gray-600 text-xs font-bold">
                        <span>www.yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}