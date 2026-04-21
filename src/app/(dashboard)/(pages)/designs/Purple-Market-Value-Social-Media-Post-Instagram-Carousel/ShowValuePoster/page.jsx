import React from 'react';

export default function ShowValuePoster() {
    return (
        <div className="flex items-center justify-center">
            <div className="relative ClientTestimonialPoster w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                background: 'var(--accent-on-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top right yellow circle */}
                <div className="absolute top-3 -right-14 w-24 h-24 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>

                {/* Small yellow circle on left */}
                <div className="absolute -bottom-4 -left-8 w-50 h-50 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>

                {/* Large purple curved wave at bottom */}
                <div className="absolute bottom-35 rotate-15 left-35  w-full h-64 pointer-events-none">
                    <svg viewBox="0 0 1 1" className="w-full h-full" preserveAspectRatio="none">
                        <path
                            d="M0.968750 0.413097 L0.884480 0.393785 C0.580758 0.334094 0.180478 0.532479 0.041784 0.867802 L0.000000 1.000000 L0.113764 0.797577 C0.612360 0.423631 0.926615 0.658883 1.000000 0.479167 L1.003862 0.451721 Z"
                            fill="var(--primary)"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex justify-center mb-6">
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
                    <div className="mb-6 flex">
                        <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--primary)' }}>
                            Don't Just<br />
                            Talk About<br />
                            Value. <span className="inline-block px-3" style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)' }}>Show It</span>
                        </h1>
                    </div>

                    {/* Description text */}
                    <div className="mb-6">
                        <p className="text-xs font-medium opacity-60">
                            Your brand's value should be<br />
                            visible in every touchpoint.<br />
                            Are you ready to make it real?
                        </p>
                    </div>

                    {/* Person image */}
                    <div className="flex-1 flex  justify-start ">
                        <div className="w-48 h-63  relative -left-20 top-10">
                            <img
                                src="https://png.pngtree.com/png-vector/20241030/ourmid/pngtree-smiling-professional-woman-in-beige-suit-png-image_14177715.png"
                                alt="Professional woman"
                                className="w-full h-full object-cover object-top"

                            />
                        </div>
                    </div>

                    {/* Contact buttons */}
                    <div className="absolute bottom-30 right-8 z-20 flex flex-col items-end gap-3 mb-6">
                        <div className="px-3 py-2 rounded-full text-white font-medium text-xs" style={{ backgroundColor: 'var(--primary)' }}>
                            www.yourwebsite.com
                        </div>
                        <div className="px-3 py-2 rounded-full text-white font-medium text-xs" style={{ backgroundColor: 'var(--primary)' }}>
                            +62-xxx-xxx-xxxx
                        </div>
                    </div>

                    {/* Footer - website */}
                    <div className='flex relative bottom-5 justify-center '>
                        <div className="flex z-20 w-[250px] rounded-full py-1 items-center justify-center bg-white gap-4 text-gray-600 text-xs font-bold">
                            <span>www.yourwebsite.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}