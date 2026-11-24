# Executive Research Readout

Interactive Carleton University / Ross Video capstone presentation, separate from the React/Vite assessment MVP.

## Preview and hosting

- Source: `public/executive-readout/index.html`
- Netlify build (Vite): the file is copied to `dist/executive-readout/index.html`.
- Once this branch is merged and the host deploys `main`, the route will be **/executive-readout/** on the existing Netlify site.
- The site includes presentation and explore modes and does **not** alter the MVP's code, data, or workflows.

## Content and distribution

This is an executive research readout, not a verified certification of Ross engineering controls or an independently validated assessment system. The page summarizes three activities (A1, A2, A3), four research deliverables, and evidence limitations. Review with Ross before making the route publicly accessible.

The official Carleton artwork is embedded in the HTML. Ross Video's logo is referenced from an external source; the text fallback displays when it is unavailable, including where hosting security policies block external images.

Note: Private GitHub repository visibility does not make an already configured Netlify website private. Confirm deployment access controls before merging.

## Local preview

From the repository root, run `npm ci && npm run dev` and open `http://localhost:5173/executive-readout/` (or the URL/port shown by Vite). Build with `npm run build` to verify the static page is copied to `dist/executive-readout/`.
