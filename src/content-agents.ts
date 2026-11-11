/**
 * ADJL Technology: /agents/, the front door for AI agents (the MCP
 * endpoint at /mcp, how to connect, its tools).
 *
 * STUB written by the foundation so the route builds. WS-M (agents)
 * replaces every word here, and the page module's body with it.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'MCP Endpoint for AI Agents | ADJL Technology',
    description:
      'An MCP endpoint at /mcp is being built, so AI agents can ask about ADJL Technology, get answers with sources, and reach Daniel.',
    ogTitle: 'A front door for AI agents.',
  },
  hero: {
    eyebrow: 'For AI agents',
    headline: ['A front door', 'for {em}AI agents.{/em}'],
    lead: 'We’re building an MCP endpoint at /mcp. An agent will be able to ask about ADJL Technology, get answers with sources, and start a conversation with Daniel. It isn’t live yet. Until it is, llms.txt lists every page.',
    primary: { label: 'Read llms.txt', href: '/llms.txt' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
  },
  sections: [
    {
      id: 'endpoint',
      eyebrow: 'The endpoint',
      headline: ['Not live', '{em}yet.{/em}'],
      body: ['This page will say how to connect and what each tool does once the endpoint answers. Today, /mcp replies that it isn’t built yet.'],
    },
  ],
};
