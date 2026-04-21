import React from 'react';

export default function StrategyValuationPoster() {
    return (
        <div className="flex items-center justify-center">


            <div className="Malvo-Market-Value-Social-Media-Post  relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--tertiary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>

                {/* Decorative light shapes in background */}
                {/* Top right */}
                <div className="absolute -top-28 -right-28 " style={{ fontSize: '600px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>

                {/* bottom left */}
                <div className="absolute -bottom-90 -left-24 " style={{ fontSize: '700px', lineHeight: '0.8', fontWeight: '900', color: 'var(--tertiary-light)' }}>
                    *
                </div>


                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo and brand at top */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}></div>
                            <span className="text-gray-800 font-bold text-sm">Businest</span>
                        </div>
                        <span className="font-medium text-xs">@yourbrand</span>
                    </div>

                    {/* Main Headline */}
                    <div className="mb-7">
                        <h1 className="text-5xl font-bold mb-2">
                            From Strategy<br />
                            to <span className="inline-block py-1 rotate-[-3deg] font-medium px-2 rounded-lg text-[var(--tertiary)]" style={{ backgroundColor: 'var(--secondary)' }}>Valuation</span>
                        </h1>
                    </div>

                    {/* Image with curved clip */}
                    <div className="flex relative bottom-4">
                        <svg width="0" height="0" className="absolute ">
                            <defs>
                                <clipPath id="image-clip" clipPathUnits="objectBoundingBox">
                                    <path  d="M0.024969 0.000000 C0.011179 0.000000 0.000000 0.011277 0.000000 0.025189 L0.000000 0.851385 C0.000000 0.865297 0.011179 0.876574 0.024969 0.876574 L0.423651 0.806286 L0.615412 0.951882 C0.647372 0.989169 0.677557 0.989169 0.691761 0.978516 L0.968750 0.916371 C1.002486 0.898615 1.006037 0.840021 0.998935 0.729936 L1.000000 0.157431 C1.000710 0.145774 1.000710 0.115589 0.997159 0.078303 L0.995383 0.000178 L0.860440 0.001953 C0.810237 0.011277 0.799058 0.000000 0.785268 0.000000 L0.024969 0.000000 Z" />
                                </clipPath>
                            </defs>
                        </svg>
                        <div
                            className="w-full overflow-hidden  bg-white"
                            style={{
                                clipPath: 'url(#image-clip)',
                                height: '260px'
                            }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
                                alt="Professional woman with charts"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1 mb-6">
                        <p className="text-sm font-medium">
                            We craft strategies that boost your market worth and attract opportunities.
                        </p>
                    </div>

                    {/* Footer with CTA and website */}
                    <div className="flex items-center justify-between">
                        <button className="px-3 py-2 rounded-md font-bold text-sm " style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
                            Contact Us!
                        </button>
                        <span className=" text-xs font-semibold">yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}