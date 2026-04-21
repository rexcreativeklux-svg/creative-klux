'use client';

import React, { useState } from 'react';
import CorporatePoster from './Market-Value-Social-Media-Post-Instagram-Carousel/corporate-poster/page';
import MarketValuePoster from './Market-Value-Social-Media-Post-Instagram-Carousel/MarketValuePoster/page';
import SilentFactorsPoster from './Yellow-Market-Value-Social-Media-Post/SilentFactorsPoster/page';
import ViralTrendsPoster from './Yellow-Market-Value-Social-Media-Post/ViralTrendsPoster/page';
import AssetsPeakPricePoster from './Yellow-Market-Value-Social-Media-Post/AssetsPeakPricePoster/page';
import MarketValuePricePoster from './Yellow-Market-Value-Social-Media-Post/MarketValuePricePoster/page';
import MarketValueReflectsPoster from './Yellow-Market-Value-Social-Media-Post/MarketValueReflectsPoster/page';
import InvisibleFactorsPoster from './Yellow-Market-Value-Social-Media-Post/InvisibleFactorsPoster/page';
import RealLifeExamplePoster from './Green-Market-Value-Social-Media-Post/RealLifeExamplePoster/page';
import FactorsAffectPoster from './Green-Market-Value-Social-Media-Post/FactorsAffectPoster/page';
import RedefineValuePoster from './Green-Market-Value-Social-Media-Post/RedefineValuePoster/page';
import ThreeDriversPoster from './Green-Market-Value-Social-Media-Post/ThreeDriversPoster/page';
import MarketValueEasyPoster from './Green-Market-Value-Social-Media-Post/MarketValueEasyPoster/page';
import BrandBoosterPoster from './Green-Market-Value-Social-Media-Post/BrandBoosterPoster/page';
import StrugglingResultsPoster from './Digital-Agency-Social-Media-Post/StrugglingResultsPoster/page';
import NoEngagementPoster from './Digital-Agency-Social-Media-Post/NoEngagementPoster/page';
import WeHandleItAllPoster from './Digital-Agency-Social-Media-Post/WeHandleItAllPoster/page';
import BenefitsCardPoster from './Digital-Agency-Social-Media-Post/BenefitsCardPoster/page';
import GrowBrandPoster from './Digital-Agency-Social-Media-Post/GrowBrandPoster/page';
import TestimonialPoster from './Digital-Agency-Social-Media-Post/TestimonialPoster/page';
import ClientTestimonialPoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/ClientTestimonialPoster/page';
import WhyCustomersStayPoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/WhyCustomersStayPoster/page';
import MarketValueMissingPoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/MarketValueMissingPoster/page';
import MarketValueCompassPoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/MarketValueCompassPoster/page';
import ShowValuePoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/ShowValuePoster/page';
import PurpleMarketValuePoster from './Purple-Market-Value-Social-Media-Post-Instagram-Carousel/PurpleMarketValuePoster/page';
import UnlockTrueValuePoster from './Malvo-Market-Value-Social-Media-Post/UnlockTrueValuePoster/page';
import StrategyValuationPoster from './Malvo-Market-Value-Social-Media-Post/StrategyValuationPoster/page';
import MoreThanNumbersPoster from './Malvo-Market-Value-Social-Media-Post/MoreThanNumbersPoster/page';
import ClientSuccessStoryPoster from './Malvo-Market-Value-Social-Media-Post/ClientSuccessStoryPoster/page';
import BoostMarketValuePoster from './Malvo-Market-Value-Social-Media-Post/BoostMarketValuePoster/page';
import BuildTrustValuePoster from './Malvo-Market-Value-Social-Media-Post/BuildTrustValuePoster/page';
import SitBackRelaxPoster from './Real-Estate-Social-Media-Post/SitBackRelaxPoster/page';
import RealizeDreamsPoster from './Real-Estate-Social-Media-Post/RealizeDreamsPoster/page';
import TestimonialWordPoster from './Real-Estate-Social-Media-Post/TestimonialWordPoster/page';
import FamilyDreamsPoster from './Real-Estate-Social-Media-Post/FamilyDreamsPoster/page';
import HappyHomeGuidePoster from './Real-Estate-Social-Media-Post/HappyHomeGuidePoster/page';
import LuxuryHouseSalePoster from './Real-Estate-Social-Media-Post/LuxuryHouseSalePoster/page';
import MarketCompassTimelinePoster from './Green-Business-Market-Value-Instagram-Post-Set/MarketCompassTimelinePoster/page';
import SpeakerGuestStarPoster from './Green-Business-Market-Value-Instagram-Post-Set/SpeakerGuestStarPoster/page';
import CustomersAttractionPoster from './Green-Business-Market-Value-Instagram-Post-Set/CustomersAttractionPoster/page';
import MarketValuesMissingPoster from './Green-Business-Market-Value-Instagram-Post-Set/MarketValuesMissingPoster/page';
import HonestyTestimonialsPoster from './Green-Business-Market-Value-Instagram-Post-Set/HonestyTestimonialsPoster/page';
import EmbedValuesPoster from './Green-Business-Market-Value-Instagram-Post-Set/EmbedValuesPoster/page';
import StoriesProveGrowthPoster from './Beige-Customer-Testimonial-Social-Media-Post-Carousel/StoriesProveGrowthPoster/page';
import TrustedTeamsTestimonialPoster from './Beige-Customer-Testimonial-Social-Media-Post-Carousel/TrustedTeamsTestimonialPoster/page';
import BrandFeelsAlivePoster from './Beige-Customer-Testimonial-Social-Media-Post-Carousel/BrandFeelsAlivePoster/page';
import RealStoriesImpactPoster from './Beige-Customer-Testimonial-Social-Media-Post-Carousel/RealStoriesImpactPoster/page';
import GrowthCampaignViralPoster from './Beige-Customer-Testimonial-Social-Media-Post-Carousel/GrowthCampaignViralPoster/page';
// Import other designs...

const designComponents = [
  {
    id: 'corporate-poster',
    name: 'Corporate Poster',
    Component: CorporatePoster,
    thumbnail: '/thumbnails/corporate-poster.png',
  },
  {
    id: 'market-value-poster',
    name: 'Market value Poster',
    Component: MarketValuePoster,
    thumbnail: '/thumbnails/MarketValuePoster.png',
  },
  {
    id: 'Silent-Factors-Poster',
    name: 'Silent-Factors-Poster',
    Component: SilentFactorsPoster,
    thumbnail: '/thumbnails/SilentFactorsPoster.png',
  },
  {
    id: 'ViralTrendsPoster',
    name: 'ViralTrendsPoster',
    Component: ViralTrendsPoster,
    thumbnail: '/thumbnails/ViralTrendsPoster.png',
  },
  {
    id: 'AssetsPeakPricePoster',
    name: 'AssetsPeakPricePoster',
    Component: AssetsPeakPricePoster,
    thumbnail: '/thumbnails/AssetsPeakPricePoster.png',
  },
  {
    id: 'MarketValuePricePoster',
    name: 'MarketValuePricePoster',
    Component: MarketValuePricePoster,
    thumbnail: '/thumbnails/MarketValuePricePoster.png',
  },
  {
    id: 'MarketValueReflectsPoster',
    name: 'MarketValueReflectsPoster',
    Component: MarketValueReflectsPoster,
    thumbnail: '/thumbnails/MarketValueReflectsPoster.png',
  },
  {
    id: 'InvisibleFactorsPoster',
    name: 'InvisibleFactorsPoster',
    Component: InvisibleFactorsPoster,
    thumbnail: '/thumbnails/InvisibleFactorsPoster.png',
  },
  {
    id: 'RealLifeExamplePoster',
    name: 'RealLifeExamplePoster',
    Component: RealLifeExamplePoster,
    thumbnail: '/thumbnails/RealLifeExamplePoster.png',
  },
  {
    id: 'FactorsAffectPoster',
    name: 'FactorsAffectPoster',
    Component: FactorsAffectPoster,
    thumbnail: '/thumbnails/FactorsAffectPoster.png',
  },
  {
    id: 'RedefineValuePoster',
    name: 'RedefineValuePoster',
    Component: RedefineValuePoster,
    thumbnail: '/thumbnails/RedefineValuePoster.png',
  },
  {
    id: 'ThreeDriversPoster',
    name: 'ThreeDriversPoster',
    Component: ThreeDriversPoster,
    thumbnail: '/thumbnails/ThreeDriversPoster.png',
  },
  {
    id: 'MarketValueEasyPoster',
    name: 'MarketValueEasyPoster',
    Component: MarketValueEasyPoster,
    thumbnail: '/thumbnails/MarketValueEasyPoster.png',
  },
  {
    id: 'BrandBoosterPoster',
    name: 'BrandBoosterPoster',
    Component: BrandBoosterPoster,
    thumbnail: '/thumbnails/BrandBoosterPoster.png',
  },
  {
    id: 'StrugglingResultsPoster',
    name: 'StrugglingResultsPoster',
    Component: StrugglingResultsPoster,
    thumbnail: '/thumbnails/StrugglingResultsPoster.png',
  },
  {
    id: 'NoEngagementPoster',
    name: 'NoEngagementPoster',
    Component: NoEngagementPoster,
    thumbnail: '/thumbnails/NoEngagementPoster.png',
  },
  {
    id: 'WeHandleItAllPoster',
    name: 'WeHandleItAllPoster',
    Component: WeHandleItAllPoster,
    thumbnail: '/thumbnails/WeHandleItAllPoster.png',
  },
  {
    id: 'BenefitsCardPoster',
    name: 'BenefitsCardPoster',
    Component: BenefitsCardPoster,
    thumbnail: '/thumbnails/BenefitsCardPoster.png',
  },
  {
    id: 'GrowBrandPoster',
    name: 'GrowBrandPoster',
    Component: GrowBrandPoster,
    thumbnail: '/thumbnails/GrowBrandPoster.png',
  },
  {
    id: 'TestimonialPoster',
    name: 'TestimonialPoster',
    Component: TestimonialPoster,
    thumbnail: '/thumbnails/TestimonialPoster.png',
  },
  {
    id: 'ClientTestimonialPoster',
    name: 'ClientTestimonialPoster',
    Component: ClientTestimonialPoster,
    thumbnail: '/thumbnails/ClientTestimonialPoster.png',
  },
  {
    id: 'WhyCustomersStayPoster',
    name: 'WhyCustomersStayPoster',
    Component: WhyCustomersStayPoster,
    thumbnail: '/thumbnails/WhyCustomersStayPoster.png',
  },
  {
    id: 'MarketValueMissingPoster',
    name: 'MarketValueMissingPoster',
    Component: MarketValueMissingPoster,
    thumbnail: '/thumbnails/PurpleMarketValueMissingPoster.png',
  },
  {
    id: 'MarketValueCompassPoster',
    name: 'MarketValueCompassPoster',
    Component: MarketValueCompassPoster,
    thumbnail: '/thumbnails/PurpleMarketValueCompassPoster.png',
  },
  {
    id: 'ShowValuePoster',
    name: 'ShowValuePoster',
    Component: ShowValuePoster,
    thumbnail: '/thumbnails/PurpleShowValuePoster.png',
  },
  {
    id: 'PurpleMarketValuePoster',
    name: 'PurpleMarketValuePoster',
    Component: PurpleMarketValuePoster,
    thumbnail: '/thumbnails/PurpleMarketValuePoster.png',
  },
  {
    id: 'UnlockTrueValuePoster',
    name: 'UnlockTrueValuePoster',
    Component: UnlockTrueValuePoster,
    thumbnail: '/thumbnails/UnlockTrueValuePoster.png',
  },
  {
    id: 'StrategyValuationPoster',
    name: 'StrategyValuationPoster',
    Component: StrategyValuationPoster,
    thumbnail: '/thumbnails/StrategyValuationPoster.png',
  },
  {
    id: 'MoreThanNumbersPoster',
    name: 'MoreThanNumbersPoster',
    Component: MoreThanNumbersPoster,
    thumbnail: '/thumbnails/MoreThanNumbersPoster.png',
  },
  {
    id: 'ClientSuccessStoryPoster',
    name: 'ClientSuccessStoryPoster',
    Component: ClientSuccessStoryPoster,
    thumbnail: '/thumbnails/ClientSuccessStoryPoster.png',
  },
  {
    id: 'BoostMarketValuePoster',
    name: 'BoostMarketValuePoster',
    Component: BoostMarketValuePoster,
    thumbnail: '/thumbnails/BoostMarketValuePoster.png',
  },
  {
    id: 'BuildTrustValuePoster',
    name: 'BuildTrustValuePoster',
    Component: BuildTrustValuePoster,
    thumbnail: '/thumbnails/BuildTrustValuePoster.png',
  },
  {
    id: 'SitBackRelaxPoster',
    name: 'SitBackRelaxPoster',
    Component: SitBackRelaxPoster,
    thumbnail: '/thumbnails/SitBackRelaxPoster.png',
  },
  {
    id: 'RealizeDreamsPoster',
    name: 'RealizeDreamsPoster',
    Component: RealizeDreamsPoster,
    thumbnail: '/thumbnails/RealizeDreamsPoster.png',
  },
  {
    id: 'TestimonialWordPoster',
    name: 'TestimonialWordPoster',
    Component: TestimonialWordPoster,
    thumbnail: '/thumbnails/TestimonialWordPoster.png',
  },
  {
    id: 'FamilyDreamsPoster',
    name: 'FamilyDreamsPoster',
    Component: FamilyDreamsPoster,
    thumbnail: '/thumbnails/FamilyDreamsPoster.png',
  },
  {
    id: 'HappyHomeGuidePoster',
    name: 'HappyHomeGuidePoster',
    Component: HappyHomeGuidePoster,
    thumbnail: '/thumbnails/HappyHomeGuidePoster.png',
  },
  {
    id: 'LuxuryHouseSalePoster',
    name: 'LuxuryHouseSalePoster',
    Component: LuxuryHouseSalePoster,
    thumbnail: '/thumbnails/LuxuryHouseSalePoster.png',
  },
  {
    id: 'MarketCompassTimelinePoster',
    name: 'MarketCompassTimelinePoster',
    Component: MarketCompassTimelinePoster,
    thumbnail: '/thumbnails/MarketCompassTimelinePoster.png',
  },
  {
    id: 'SpeakerGuestStarPoster',
    name: 'SpeakerGuestStarPoster',
    Component: SpeakerGuestStarPoster,
    thumbnail: '/thumbnails/SpeakerGuestStarPoster.png',
  },
  {
    id: 'CustomersAttractionPoster',
    name: 'CustomersAttractionPoster',
    Component: CustomersAttractionPoster,
    thumbnail: '/thumbnails/CustomersAttractionPoster.png',
  },
  {
    id: 'MarketValuesMissingPoster',
    name: 'MarketValuesMissingPoster',
    Component: MarketValuesMissingPoster,
    thumbnail: '/thumbnails/MarketValuesMissingPoster.png',
  },
  {
    id: 'HonestyTestimonialsPoster',
    name: 'HonestyTestimonialsPoster',
    Component: HonestyTestimonialsPoster,
    thumbnail: '/thumbnails/HonestyTestimonialsPoster.png',
  },
  {
    id: 'EmbedValuesPoster',
    name: 'EmbedValuesPoster',
    Component: EmbedValuesPoster,
    thumbnail: '/thumbnails/EmbedValuesPoster.png',
  },
  {
    id: 'StoriesProveGrowthPoster',
    name: 'StoriesProveGrowthPoster',
    Component: StoriesProveGrowthPoster,
    thumbnail: '/thumbnails/StoriesProveGrowthPoster.png',
  },
  {
    id: 'TrustedTeamsTestimonialPoster',
    name: 'TrustedTeamsTestimonialPoster',
    Component: TrustedTeamsTestimonialPoster,
    thumbnail: '/thumbnails/TrustedTeamsTestimonialPoster.png',
  },
  {
    id: 'BrandFeelsAlivePoster',
    name: 'BrandFeelsAlivePoster',
    Component: BrandFeelsAlivePoster,
    thumbnail: '/thumbnails/BrandFeelsAlivePoster.png',
  },
  {
    id: 'RealStoriesImpactPoster',
    name: 'RealStoriesImpactPoster',
    Component: RealStoriesImpactPoster,
    thumbnail: '/thumbnails/RealStoriesImpactPoster.png',
  },
  {
    id: 'GrowthCampaignViralPoster',
    name: 'GrowthCampaignViralPoster',
    Component: GrowthCampaignViralPoster,
    thumbnail: '/thumbnails/GrowthCampaignViralPoster.png',
  }

];

export default function DesignsLayout() {
  const [selectedDesign, setSelectedDesign] = useState(null);

  const openModal = (design) => setSelectedDesign(design);
  const closeModal = () => setSelectedDesign(null);

  return (
    <div className="min-h-screen py-10 px-13">
      <div className=" mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-10 ">My Designs</h1>

        {/* Grid of Design Thumbnails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {designComponents.map((design) => (
            <div
              key={design.id}
              onClick={() => openModal(design)}
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-white"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal(design)}
            >
              {/* Thumbnail Container with modern aspect ratio */}
              <div className="w-full h-full overflow-hidden bg-gray-200"> {/* Fallback gray if image fails */}
                <img
                  src={design.thumbnail}
                  alt={design.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
              </div>


            </div>
          ))}
        </div>
      </div>

      {/* Modal remains the same */}
      {selectedDesign && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative  rounded-lg  max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-0 cursor-pointer right-20 z-10 bg-black/70 rounded-full p-2  text-white hover:text-black transition-all duration-300"
            >
              <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-2 ">
              <selectedDesign.Component />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}