import React from 'react';
import '../Real-Estate-Social-Media-Post.css'

export default function HappyHomeGuidePoster() {
    return (
        <div className=" flex items-center justify-center p-8" >

            <div className="Real-Estate-Social-Media-Post relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-start mb-6">
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

                    {/* Large organic blob shape with headline */}
                    <div className="relative mb-6">
                        <svg viewBox="0 0 1 1" className="w-full h-auto" preserveAspectRatio="none" style={{ height: '330px' }}>
                            {/* Geometric blob background */}
                            <path
                                  d="M0.048806 0.000527 L0.445576 -0.006496 C0.601826 -0.011763 0.596559 0.039150 0.600070 0.330583 C0.698385 0.363940 0.770365 0.339361 0.826545 0.348139 L0.893258 0.348139 L0.924860 0.348139 C1.028441 0.365695 0.989817 0.400808 0.991573 0.888869 C0.979284 0.948560 0.930126 0.973139 0.868680 0.974895 L0.428020 0.973139 C0.412219 0.976650 0.363062 0.955583 0.361306 0.908181 C0.356039 0.836201 0.363062 0.822156 0.359551 0.739642 L0.357795 0.674684 L0.356039 0.613237 L0.212079 0.613237 C0.138343 0.614993 0.071629 0.618504 0.047051 0.576369 C0.034761 0.304249 0.040028 0.197156 0.047051 0.000527 Z"
                                fill="var(--primary)"
                            />
                        </svg>

                        {/* Headline text overlay */}
                        <div className="absolute -top-40 -left-45 inset-0 flex items-center justify-center px-8">
                            <h1 className="text-2xl font-bold text-[var(--secondary)] text-center">
                                Your Guide<br />
                                to a Happy<br />
                                New Home<br />
                                Purchase
                            </h1>
                        </div>

                        <div className="absolute top-50 left-34 inset-0 w-[260px] flex items-center justify-center px-8">
                            <div className="">
                                <p className="text-sm text-[var(--secondary)] font-medium leading-relaxed">
                                    Four essential tips to make your home buying journey smooth and successful
                                </p>
                            </div>
                        </div>


                    </div>


                    {/* Tips pills */}
                    <div className="space-y-3 mb-7">
                        <div className="flex gap-3">
                            <div className="bg-[var(--primary)] rounded-full px-4 py-2" >
                                <p className="text-xs font-semibold text-[var(--secondary)] text-center">Financial Plan</p>
                            </div>
                            <div className=" bg-[var(--secondary)] rounded-full px-4 py-2 border border-[var(--primary)]">
                                <p className="text-xs font-semibold text-[var(--primary)] text-center">Get Inspection</p>
                            </div>
                            <div className=" bg-[var(--secondary)] rounded-full px-4 py-2 border border-[var(--primary)]">
                                <p className="text-xs font-semibold text-[var(--primary)] text-center">Hire Local Agent</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-3">
                            <div className=" bg-[var(--secondary)] rounded-full px-4 py-2 border border-[var(--primary)]">
                                <p className="text-xs font-semibold text-[var(--primary)] text-center">Look Beyond the Wall</p>
                            </div>
                            <div className=" bg-[var(--primary)] rounded-full px-4 py-2 border border-gray-200">
                                <p className="text-xs font-semibold text-[var(--secondary)] text-center">Find Perfect Location</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Contact info */}
                    <div className="mt-auto flex items-center justify-center gap-2 text-[var(--primary)] text-[10px] font-semibold">
                        <span>000 0000-0000</span> |
                        <span>www.yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}