# cards-offers

Custom **cards** block. Purpose: image-only promotional offer tiles.

## Authoring (Document Authoring)

Model: `standalone`

Single block table, one row per tile. For dynamic Scene7 offers, cell 1 is the
plain-text product asset name and cell 2 contains exactly five nonempty,
pipe-delimited fields:

`Line1 | Line2 | smallDiscount | largeDiscount | expiryDate`

| Product asset | Offer fields |
| --- | --- |
| CEM/trp-brake-product | TRP Brake Chambers \| Installation of TRP Brake Chambers \| 6 \| 25 \| 10.31.2026 |
| CEM/0-trp-brake-shoe-kit-transparent | TRP Brake Shoe \| TRP Brake Shoe Kits \| 8 \| 20 \| 10.31.2026 |
| CEM/0-trp-air-spring-truck-transparent | TRP Air Spring \| TRP Air Spring \| 10 \| 15 \| 10.31.2026 |

The block constructs the composite Image Serving URL at render time and loads
the image directly from Scene7, without the EDS media pipeline. Line1 supplies
the image alt text. The expiry field is displayed verbatim, without an added
prefix. Authored newlines are preserved; a literal pipe cannot be included in a
field. Malformed rows remain visible and report an error in the browser console.

Legacy rows with an offer image in cell 1 and an optional single link in cell 2
remain supported; a single link makes the whole legacy tile clickable.

The small-discount layout retains its 64 x 150 pixel box for a single character.
For multiple characters (including the required `10`), its nested input/output
width increases from 256 to 500 pixels, its outer width increases to 125 pixels,
and its `OFF` label shifts from x=132 to x=193. Font size, height and discount
position are unchanged. This prevents the specified narrow canvas from clipping
the second digit. Titles use wrapped `textPs` with bold Arial and `expnd2`.

## Runtime checks

Serve the repository with a local HTTP server and open
`/tests/cards-offers.html` in a browser. It checks parsing, URL layer ordering,
nested delimiters, RTF escaping, legacy links, malformed rows, image-error
recovery, and live Scene7 image dimensions. Inspect the three rendered examples
for title wrapping and discount clipping; successful image loading alone does
not prove the layout is correct.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
