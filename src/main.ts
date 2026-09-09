import { boot, mount } from './boot';
import { renderPage } from './sections/home';

mount(renderPage);
boot();
