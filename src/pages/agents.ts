/* One page: its renderer and its meta. Imported by the prerender entry in
   scripts/ and, in the dev shell only, lazily by src/main.ts.

   /agents/ has its own renderer (src/sections/agents.ts): the endpoint,
   its code panes and one card per tool. The tools come from the same list
   the MCP endpoint (netlify/functions/mcp.mjs) sends to agents. */
import { content, mcp } from '../content-agents';
import { renderAgents } from '../sections/agents';

export const meta = content.meta;
export const render = () => renderAgents(content, mcp.tools);
