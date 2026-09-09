import { renderLegalPage } from '../src/sections/legal';
import { terms as doc } from '../src/content-legal';

export const render = () => renderLegalPage(doc);
export const meta = doc.meta;
