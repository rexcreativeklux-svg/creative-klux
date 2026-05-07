// /lib/integrations/platformResolvers.js

export const platformResolvers = {
    linkedin: handleLinkedIn,
    linkedin_ads: handleLinkedInAds,

    facebook: handleMetaFacebook,
    instagram: handleMetaInstagram,
    meta_ads: handleMetaAds,

    google_ads: handleGoogleAds,
    youtube: handleYouTube,

    pinterest: handlePinterest,
    pinterest_ads: handlePinterestAds,

    snapchat: handleSnapchat,
    snapchat_ads: handleSnapchatAds,
};

export async function resolveIntegrationCredentials(platformId, oauthResult, context) {
    const handler = platformResolvers[platformId];

    if (!handler) {
        throw new Error(`No resolver found for platform: ${platformId}`);
    }

    return handler(oauthResult, context);
}

const context = {
    activeBrandId,
    setFbPages,
    setPendingFbOauth,
    setShowPageModal,
    setFbLoadingPageId,
};