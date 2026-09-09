import { boot, mount } from './boot';
import { renderLegalPage } from './sections/legal';
import { privacy as doc } from './content-legal';

mount(() => renderLegalPage(doc));
boot();
