import React from 'react';
import '../Market-Value-Social-Media-Post-Instagram-Carousel.css';
import { Flower } from 'lucide-react';

export default function CorporatePoster() {
  return (
    <div className=" flex items-center justify-center py-8">

      <div className="corporate-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{
        background: 'linear-gradient(65deg, #649cf5 0%, #193ca9 50%, #183ba8 100%)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow)',
        aspectRatio: '9 / 12'

      }} data-size="medium"
        data-category="corporate"
        data-industry="business"
        data-orientation="portrait"
        data-event="none">

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20" style={{ backgroundColor: '#3b82f6' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-20" style={{ backgroundColor: '#60a5fa' }} />

        <div className="relative z-10 py-8">
          {/* Header */}
          <div className="flex items-center justify-between px-8 mb-8">
            <div className="flex items-center gap-2">

              <Flower className="w-8 h-8 text-[color:var(--secondary)] " />

              <div>
                <div className="font-bold text-sm text-white">CORPORATE</div>
                <div className="text-xs text-blue-200">VALUE</div>
              </div>
            </div>

            <button className="px-4 py-2 text-[color:var(--text-on-primary)] rounded-full border border-white text-sm font-semibold shadow-lg transition-all flex items-center gap-2 bg-transparent">
              LET'S CONNECT
              <span className="w-5 h-5 rounded-full rotate-45 text-[color:var(--text-on-secondary)] flex items-center justify-center bg-[color:var(--secondary)] text-xs">↑</span>
            </button>
          </div>

          {/* Headline */}
          <div className="mb-6 flex w-full px-8 flex-row gap-4">
            <h1 className="font-bold text-4xl w-[60%] leading-tight text-white">
              Start From<br />
              Price Tags<br />
              To Business
            </h1>

            <div className="flex justify-center items-center w-[40%]">
              <p className="text-xs leading-relaxed font-medium w-full opacity-90 text-white">
                The digital landscape is no longer a static backdrop but a dynamic, breathing spectrum of ideas, data, and possibilities.
              </p>
            </div>
          </div>

          {/* Images with 3 images and yellow balls between them */}
          <div className="relative mb-6">

            <div className="relative overflow-hidden shadow-xl rounded-2xl bg-transparent">
              <div className="flex items-center gap-1 h-48">
                {/* Image 1 */}
                <div className="w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop"
                    alt="Professional 1"
                    className="w-full h-full rounded-lg object-cover"
                  />
                </div>

                {/* Yellow ball 1 */}
                <div className="relative flex items-center justify-center -mx-6 z-20">
                  <div className="w-12 h-12 rounded-full bg-[color:var(--secondary)] shadow-lg" >
                    <div
                      className="w-full h-full rounded-full border-8 border-[color:var(--primary)] corporate-poster"
                    ></div>
                  </div>
                </div>

                {/* Image 2 */}
                <div className="w-full  h-full">
                  <img
                    src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=300&h=300&fit=crop"
                    alt="Professional 2"
                    className="w-full h-full rounded-lg object-cover"
                  />
                </div>

                {/* Yellow ball 2 */}
                <div className="relative flex items-center justify-center -mx-6 z-20">
                  <div className="w-12 h-12 rounded-full bg-[color:var(--secondary)] shadow-lg" >
                    <div
                      className="w-full h-full rounded-full border-8 border-[color:var(--primary)] corporate-poster"
                    ></div>
                  </div>
                </div>

                {/* Image 3 */}
                <div className="w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop"
                    alt="Professional 3"
                    className="w-full h-full rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='px-8 bg-transparent'>
            <div className="rounded-full p-4 shadow-lg border" style={{
              backgroundColor: '#1e40af',
              borderColor: 'rgba(37, 99, 235, 0.4)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="flex items-center px-3 justify-between">
                <div>
                  <div className="text-lg font-bold text-white">The New</div>
                  <div className="font-bold text-lg text-white">Currency</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1 text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    <span className="text-sm font-semibold">100-0000-0000</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-80 text-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">www.yourwebsite.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side accent */}
        <div className="absolute top-1/2 right-0 w-1 h-32 -translate-y-1/2" style={{
          background: 'linear-gradient(to bottom, #facc15, transparent)'
        }} />
      </div>
    </div>
  );
}