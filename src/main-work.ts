import { boot, mount } from './boot';
import { renderWorkHubPage } from './sections/workhub';
import { content } from './content-work';

mount(() => renderWorkHubPage(content));
boot();
