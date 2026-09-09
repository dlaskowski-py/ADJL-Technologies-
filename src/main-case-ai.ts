import { boot, mount } from './boot';
import { renderCasePage } from './sections/case';
import { content } from './content-case-ai';

mount(() => renderCasePage(content, '/work/ai-implementation/', 'mesh'));
boot();
