# columns-media

Custom **columns** block. Purpose: image beside text bands, image on either side per row.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row per band, 2 cells; one cell holds only an image, the other the text (heading, paragraphs, optional bulleted list, optional button paragraphs).

## Supported variations

| Variation | Option class |
| --- | --- |
| Text First | `text-first` |
| Image First | `image-first` |

Without an option, rows stack in authored order on mobile.

- `text-first` (table name "Columns Media (text-first)"): on mobile every row shows its text above
  its image, whichever side the image is on at desktop widths.
- `image-first` (table name "Columns Media (image-first)"): on mobile every row shows its image above
  its text, whichever side it is authored on. From 768px the cells keep the authored order side by side:
  image column 3/12 (the image fills it), text 9/12, 32px gutter, top-aligned. H3 headings in the text
  render at 26px in the book weight. A link inside a sentence ("Start browsing parts »") stays a text
  link; only a paragraph holding nothing but a bold/italic link becomes a button.

## Universal Editor fields

N/A (Document Authoring project)
