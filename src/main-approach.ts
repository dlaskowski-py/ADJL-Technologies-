import { boot, mount } from './boot';
import { renderApproachPage } from './sections/approach';
import { content } from './content-approach';

mount(() => renderApproachPage(content));
boot();
