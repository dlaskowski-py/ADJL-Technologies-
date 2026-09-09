import { boot, mount } from './boot';
import { renderCasePage } from './sections/case';
import { content } from './content-case-real-estate';

mount(() => renderCasePage(content, '/work/real-estate-intelligence/', 'survey'));
boot();
