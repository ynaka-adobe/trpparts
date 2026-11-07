# hero-banner

Custom **hero** block. Purpose: hero.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: background image + title + subheading + CTA.

Two authoring structures are supported (detected by `hero-banner.js` from the rows):

1. One content row: picture + heading + text + CTA in one cell. The first picture
   becomes the full-bleed background (dark scrim, white text).
2. Row 1 = picture only (background), row 2 = content. If the content cell starts
   with a picture (e.g. a logo) followed by text, the block gets
   `hero-banner-has-media` and lays out the picture in a 5/12 column beside a
   6/12 text column (stacked and centered below 768px), with dark text and the
   site's blue button.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
