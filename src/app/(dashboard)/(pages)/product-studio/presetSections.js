// Artwork for the Product Studio landing page's "Get started" row, and the
// Pexels helper the preset catalogue (studioPresets.js) builds its photo URLs
// with.
//
// Every Pexels id here was fetched and eyeballed before it landed in this file;
// dead ids on that CDN answer 200 with a ~27-byte body rather than a 404, so a
// broken one shows up as an empty tile, not an error. Re-check before swapping.

export const px = (id, w = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// The portrait the Photo Editing Classics tiles preview their treatments on.
export const PRESET_PORTRAIT = px(5310745, 400);

export const getStarted = [
  { label: "Remove a background", img: px(11324548) }, // sneakers on a red sweep
  { label: "Generate AI backgrounds", img: px(9267583) }, // bags styled on foliage
  { label: "Edit hundreds of images at once", img: px(8335273) }, // a row of bags
  { label: "Retouch an image", img: px(7290611) }, // cosmetics flat lay
];
