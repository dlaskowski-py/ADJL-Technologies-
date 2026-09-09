import { renderCasePage } from '../src/sections/case';
import { content } from '../src/content-case-real-estate';

export const render = () => renderCasePage(content, '/work/real-estate-intelligence/', 'survey');
export const meta = content.meta;
