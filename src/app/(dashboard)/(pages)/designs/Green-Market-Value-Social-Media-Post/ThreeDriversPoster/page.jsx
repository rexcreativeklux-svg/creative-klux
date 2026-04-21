import React from 'react';

export default function ThreeDriversPoster() {
    return (
        <div className="flex items-center justify-center" >

            <div className="example-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Background decorative curvy vertical lines */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                    {/* Line 1 */}
                    <svg
                        className="absolute inset-y-0 left-[49%] h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 800"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M50,0 Q40,100 50,200 T50,400 T50,600 T50,800"
                            fill="none"
                            stroke="white"
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Line 2 */}
                    <svg
                        className="absolute inset-y-0 left-[69%] rotate-6 h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 800"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M50,0 Q60,100 50,200 T50,400 T50,600 T50,800"
                            fill="none"
                            stroke="white"
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Line 3 */}
                    <svg
                        className="absolute inset-y-0 left-23 rotate-25 h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 100 800"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M50,0 Q40,100 50,200 T50,400 T50,600 T50,800"
                            fill="none"
                            stroke="white"
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Header */}
                    <div className="text-center mb-3">
                        <p className="text-white text-xs tracking-widest uppercase opacity-70">
                            MARKET VALUE
                        </p>
                    </div>

                    {/* Main Headline */}
                    <div className="text-center mb-4">
                        <h1 className="text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--secondary)' }}>
                            3 DRIVERS OF<br />
                            MARKET VALUE
                        </h1>
                    </div>

                    {/* Sub-heading */}
                    <div className="text-center mb-10">
                        <p className="text-xs font-medium leading-tight text-white">
                            Market value is simply the price an asset would sell for in a competitive marketplace
                        </p>
                    </div>

                    {/* Numbered list items */}
                    <div className="flex-1 space-y-4">
                        {/* Item 1 */}
                        <div className="relative gap-4">

                            <div className="flex bg-white rounded-lg shadow-lg relative">
                                <p className="text-md py-3 px-5 pr-10 font-bold" style={{ color: 'var(--primary)' }}>
                                    Demand & Supply – High demand + low supply raises value
                                </p>


                                <span className="text-[110px] absolute -right-1 rotate-5 -top-13 font-bold" style={{ color: 'var(--secondary)' }}>1</span>

                            </div>

                        </div>

                        {/* Item 2 */}
                        <div className="relative gap-4">

                            <div className=" bg-white rounded-lg shadow-lg">
                                <span className="text-[100px] absolute -left-2 rotate-5 -top-10 font-bold" style={{ color: 'var(--secondary)' }}>2</span>
                                <p className="text-md py-3 px-5 pl-15 font-bold" style={{ color: 'var(--primary)' }}>
                                    Quality Perception – Strong reputation builds higher worth
                                </p>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="relative gap-4">
                            <div className="flex bg-white rounded-lg shadow-lg relative">
                                <p className="text-md py-3 px-5 pr-13 font-bold" style={{ color: 'var(--primary)' }}>
                                    Competition – Value shaped by market comparisons
                                </p>


                                <span className="text-[100px] absolute -right-1 rotate-8 -top-10 font-bold" style={{ color: 'var(--secondary)' }}>3</span>

                            </div>
                        </div>
                    </div>

                    {/* Footer - Website URL */}
                    <div className="mt-8">
                        <div className="bg-white rounded-full px-6 py-1 shadow-lg text-center">
                            <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                                www.yourwebsite.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}