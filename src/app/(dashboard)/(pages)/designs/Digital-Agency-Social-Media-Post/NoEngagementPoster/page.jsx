import React from 'react';
import '../Digital-Agency-Social-Media-Post.css';

export default function NoEngagementPoster() {
    return (
        <div className=" flex items-center justify-center" >


            <div className="struggling-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white" style={{
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow)',
                aspectRatio: '9 / 12'
            }}>
                <div className="absolute -top-20 -left-30 rotate-5 z-10 w-[400px] opacity-90">
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
                            fill="var(--accent-on-secondary)"
                        />
                    </svg>
                </div>


                <div className="relative z-10 h-full flex flex-col">
                    {/* Logo at top */}
                    <div className="flex items-center justify-center pt-8 px-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-5 h-5 border-4 border-white rounded-full"></div>
                            </div>
                            <span className="text-gray-800 font-bold text-xl">yourlogo</span>
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 flex flex-col justify-between p-8">
                        {/* Questions */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-xl font-bold text-gray-900 mb-2">
                                    Posting every day but<br />
                                    still <span className="inline-block px-2 rotate-[-5deg] py-1 rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>no engagement?</span>
                                </p>
                            </div>

                            <div>
                                <p className="text-xl font-bold text-gray-900">
                                    Spending on ads but<br />
                                    <span className="inline-block px-2 rotate-5 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>no real sales?</span>
                                </p>
                            </div>
                        </div>

                        {/* Image section with decorative elements */}
                        <div className="relative mt-8">
                            {/* Yellow/lime decorative shapes */}
                            {/* <div className="absolute top-0 right-0 w-20 h-40" style={{ backgroundColor: 'var(--secondary)' }}>
                                <svg viewBox="0 0 100 200" className="w-full h-full">
                                    <path d="M0,0 L100,0 L100,200 Q50,180 0,200 Z" fill="currentColor" />
                                </svg>
                            </div> */}

                            <div className="absolute -bottom-120 -left-40 ">
                                <svg width="1000" height="1000" viewBox="0 0 400 400">
                                    {/* Inner lighter overlay for added softness and depth */}
                                    <path
                                        d="
      M200,70
      Q220,140 235,190
      Q285,205 330,200
      Q285,220 235,235
      Q220,285 200,330
      Q180,285 165,235
      Q115,220 70,200
      Q115,205 165,190
      Q180,140 200,70
      Z
    "
                                        fill="var(--secondary)"
                                    />
                                </svg>
                            </div>

                            {/* Person image */}
                            <div className="absolute -right-10 -bottom-24 left-20 z-10 flex justify-end">
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop"
                                    alt="Professional woman pointing"
                                    className="w-50 h-94 object-cover"
                                    style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.1))' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer - Social handle and website */}
                    <div className="relative z-20 flex items-center gap-4 px-6 pb-10 text-xs font-bold">
                        <span>@yoursocialmedia</span>
                        <span>yourwebsite.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}