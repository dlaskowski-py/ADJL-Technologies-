import { boot, mount } from './boot';
import { renderLegalPage } from './sections/legal';
import { terms as doc } from './content-legal';

mount(() => renderLegalPage(doc));
boot();
