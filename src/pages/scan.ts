/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /scan/: the scanner's form, a recorded scan of this site, and the way on
   to the audit. The renderer writes [data-scan], the contract
   src/motion/scan.ts loads on. */
import { content } from '../content-scan';
import { renderScanPage } from '../sections/scan';

export const meta = content.meta;
export const render = renderScanPage;
