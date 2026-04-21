import { ArrowBigRight, ArrowUp, MoveRight } from 'lucide-react';
import React from 'react';
import '../Yellow-Market-Value-Social-Media-Post.css';

export default function SilentFactorsPoster() {
    return (
        <div className=" flex items-center justify-center p-8" >
    

            {/* Shared SVG definitions — ONE single source of truth */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    {/* Beautiful rounded organic shape (0–1 unit coordinates) */}
                    <path id="organic-shape" d="M-0.005618 0.278792 C-0.028441 0.127809 0.104986 0.191011 0.363062 0.171699 L0.542135 0.166433 L0.543890 0.061095 C0.528090 -0.033708 0.852879 0.017205 0.794944 -0.000351 L0.995084 0.004916 L0.998596 0.192767 C0.996840 0.255969 1.000000 0.256625 0.998596 0.338483 L1.000000 0.500000 L1.002107 0.877458 C0.989817 0.977528 0.968750 0.993329 0.884480 0.998596 L0.092697 0.996840 C0.018961 0.982795 -0.003862 0.954705 -0.005618 0.872191 L-0.007374 0.505267 Z"

                        fill="black" />

                    {/* Clip path — reuses the same path */}
                    <clipPath id="organic-clip" clipPathUnits="objectBoundingBox">
                        <use href="#organic-shape" />
                    </clipPath>

                    {/* Mask for the soft background blob (same shape, filled white) */}
                    <mask id="organic-mask">
                        <use href="#organic-shape" fill="white" />
                    </mask>
                </defs>
            </svg>

            <div className="yellow-poster relative w-full max-w-md rounded-md shadow-2xl overflow-hidden" style={{
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                {/* Top decorations */}
                <div className="absolute -top-3 left-2 flex items-center z-10">
                    <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--secondary)' }}></div>
                    <div className="w-5 h-5 mt-7" style={{ backgroundColor: 'var(--secondary)' }}></div>
                </div>
                <div className="absolute -top-3 -right-8 z-10" style={{ fontSize: '250px', lineHeight: '0.8', fontWeight: '900', color: 'var(--secondary)' }}>
                    *
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                    {/* Headline */}
                    <div className="pt-4 relative">
                        <div className="flex items-start gap-4 mb-4">
                            <h1 className="font-medium absolute top-8 text-3xl w-[200px] leading-[1.3] tracking-tight" style={{ color: 'var(--text-on-primary)', maxWidth: '70%' }}>
                                There Are Silent Factors That Change Market Value
                            </h1>
                            <div className="flex-shrink-0 absolute top-6 left-36 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg mt-1">
                                <div className="font-bold -mt-0.5 w-4 border-b-2 " style={{ color: 'var(--text-on-primary)' }}>
                                    <ArrowUp className='w-5 h-5 rotate-35'/> 
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="relative px-8 mt-auto">
                        <div className="absolute -top-25 right-0 text-[0.65rem] max-w-[160px] leading-tight font-medium" style={{ color: 'var(--text-on-primary)' }}>
                            Uncover hidden factors that investors often overlook when assessing market value
                        </div>

                        <div className="relative" style={{ height: '340px' }}>
                            {/* Soft white background blob — perfectly matches the clip */}
                            <div className="absolute  inset-0 rounded-3xl overflow-hidden">
                                <div
                                    className="absolute inset-0 w-full h-full"
                                    style={{
                                        mask: 'url(#organic-mask)',
                                        maskSize: '100% 100%',
                                        background: 'rgba(255,255,255,0.35)',
                                        transform: 'translate(8%, 12%) scale(1.25)',
                                    }}
                                />
                            </div>

                            {/* Main photo — clipped with the exact same shape */}
                            <div
                                className="absolute overflow-clip rounded-3xl inset-0 "
                                style={{
                                    clipPath: 'url(#organic-clip)',
                                    transform: 'translateY(-6%) scale(1.15)',
                                }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                                    alt="Business presentation with whiteboard"
                                    className="w-full h-full object-cover"
                                />
                            </div>


                            {/* Dots */}
                            <div className="absolute bottom-10 left-10 flex gap-2.5 z-20">
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#fbbf24' }}></div>
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
                            </div>
                        </div>

                        {/* Bottom-right accent */}
                        <div className="absolute -bottom-10 -right-16 w-60 h-62 ">
                            <svg viewBox="0 0 150 120" className="w-full h-full" fill="white">
                                <path d="M0,120 Q30,70 60,100 Q90,130 120,100 L0,120 Z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}