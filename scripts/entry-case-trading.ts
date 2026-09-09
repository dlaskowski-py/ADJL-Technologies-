import { renderCasePage } from '../src/sections/case';
import { content } from '../src/content-case-trading';

export const render = () => renderCasePage(content, '/work/trading-infrastructure/', 'latency');
export const meta = content.meta;
