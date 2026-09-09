import { boot, mount } from './boot';
import { renderCasePage } from './sections/case';
import { content } from './content-case-trading';

mount(() => renderCasePage(content, '/work/trading-infrastructure/', 'latency'));
boot();
