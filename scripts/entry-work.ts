import { renderWorkHubPage } from '../src/sections/workhub';
import { content } from '../src/content-work';

export const render = () => renderWorkHubPage(content);
export const meta = content.meta;
