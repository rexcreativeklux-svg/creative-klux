import React from 'react';
import '../Digital-Agency-Social-Media-Post.css';

export default function BenefitsCardPoster() {
    return (
        <div className="flex items-center justify-center ">
            <div className="relative struggling-poster w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white" style={{
                aspectRatio: '9 / 12'
            }}>
                {/* Top decorative curved lines */}
                <div className="absolute -top-15 -right-30 rotate-[-40deg] pointer-events-none overflow-hidden w-full h-48">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M350,20 Q300,40 280,80 Q260,120 290,160 Q320,200 280,240 Q240,280 200,260 Q160,240 180,200 Q200,160 170,120"
                            stroke="#D4FF00"
                            strokeWidth="15"
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* <path
                            d="M380,50 Q330,70 310,110 Q290,150 320,190 Q350,230 310,270 Q270,310 230,290 Q190,270 210,230"
                            stroke="#D4FF00"
                            stroke-width="45"
                            stroke-linecap="round"
                            fill="none"
                        /> */}
                    </svg>
                </div>

                {/* Bottom decorative curved lines */}
                <div className="absolute -bottom-20 rotate-140 -left-65 pointer-events-none overflow-hidden w-full h-64">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M200,350 Q80,320 50,200 Q80,80 200,50"
                            stroke="#D4FF00"
                            strokeWidth="15"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </svg>
                </div>

                  {/* Bottom decorative curved lines */}
                <div className="absolute -bottom-24 rotate-137 -left-55 pointer-events-none overflow-hidden w-full h-64">
                    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M200,350 Q80,320 50,200 Q80,80 200,50"
                            stroke="#D4FF00"
                            strokeWidth="15"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </svg>
                </div>

                <div className="relative z-10 h-full flex flex-col p-8">
                    {/* Logo at top */}
                    <div className="flex items-center justify-center mb-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-5 h-5 border-4 border-white rounded-full"></div>
                            </div>
                            <span className="text-gray-800 font-bold text-xl">yourlogo</span>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="flex-1 flex flex-col gap-2 mb-12">
                        <div className='flex flex-row gap-2 w-full '>
                            {/* Card 1 - Blue */}
                            <div className="relative w-[40%] rounded-lg px-3 py-4 pt-16 flex items-end overflow-hidden" style={{ backgroundColor: 'var(--primary)' }}>
                                <div className="absolute -top-0 -right-14 rotate-7 z-10 w-40">
                                    <svg viewBox="0 0 400 400">
                                        <path
                                            d="
      M200 20                    
      C260 60, 300 140, 220 180    
      C300 200, 270 300, 200 280  
      C130 300, 100 200, 180 180   
      C100 140, 140 60, 200 20    
      Z
    "
                                            fill="var(--primary-light)"
                                        />
                                    </svg>

                                </div>
                                <p className="text-white font-bold text-md opacity-90 leading-tight relative z-10">
                                    Increased<br />brand<br />awareness
                                </p>
                            </div>

                            {/* Card 2 - Yellow */}
                            <div className="relative w-[60%] rounded-lg px-3 py-4 pt-16 flex items-end overflow-hidden" style={{ backgroundColor: 'var(--secondary)' }}>
                                <div className="absolute -top-15 -right-21 z-10 ">
                                    <svg viewBox="0 0 200 200" className="w-full rotate-180 h-full">
                                        <path
                                            d="
      M0 160
      L60 160
      L60 120
      L120 120
      L120 80
      L180 80
      L180 40
      L0 40
      Z
    "
                                            fill="var(--secondary-light)"
                                        />
                                    </svg>

                                </div>

                                <p className="font-bold text-md opacity-90 leading-tight relative z-10" style={{ color: 'var(--text-on-secondary)' }}>
                                    Higher<br />engagement<br />rates
                                </p>
                            </div>
                        </div>

                        <div className='flex flex-row gap-2 w-full'>
                            {/* Card 3 - Yellow */}
                            <div className="relative w-[60%] rounded-lg px-3 py-4 pt-20 flex items-end overflow-hidden" style={{ backgroundColor: 'var(--secondary)' }}>
                                <div className="absolute -top-10 -left-20 rotate-7 z-10 w-60">
                                    <svg viewBox="0 0 400 400">
                                        <path
                                            d="
        M200 35
        C245 70, 255 105, 245 145
        C290 150, 325 165, 345 200
        C325 235, 290 250, 245 255
        C255 295, 245 330, 200 365
        C155 330, 145 295, 155 255
        C110 250, 75 235, 55 200
        C75 165, 110 150, 155 145
        C145 105, 155 70, 200 35
        Z
      "
                                            fill="var(--secondary-light)"
                                        />
                                    </svg>
                                </div>

                                <p className="font-bold text-md leading-tight opacity-90 relative z-10" style={{ color: 'var(--text-on-secondary)' }}>
                                    More time to focus on<br />your business
                                </p>
                            </div>

                            {/* Card 4 - Blue */}
                            <div className="relative w-[40%] rounded-lg px-3 py-4 pt-20 flex items-end overflow-hidden" style={{ backgroundColor: 'var(--primary)' }}>
                                <div className="absolute top-0 -right-20 w-38 h-38 rounded-2xl opacity-20" style={{ backgroundColor: 'var(--primary-light)' }}></div>
                                <p className="text-white font-bold text-md leading-tight opacity-90 relative z-10">
                                    Better ROI<br />from ads
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Social handle and website */}
                    <div className="flex items-center justify-between text-gray-900 text-xs font-bold">
                        <span>@yoursocialmedia</span>
                        <span>yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}