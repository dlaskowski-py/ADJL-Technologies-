import { renderCasePage } from '../src/sections/case';
import { content } from '../src/content-case-ai';

export const render = () => renderCasePage(content, '/work/ai-implementation/', 'mesh');
export const meta = content.meta;
