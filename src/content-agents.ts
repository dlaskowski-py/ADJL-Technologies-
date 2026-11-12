/**
 * ADJL Technology: /agents/, the front door for AI agents, and every word
 * the MCP endpoint at /mcp says to one.
 *
 * Two exports, one source:
 *
 *   content   the page: who it's for, how to connect, the tools, the
 *             rules, and the plain-text routes that need no protocol
 *   mcp       what netlify/functions/mcp.mjs sends: the server's name and
 *             instructions, each tool's title, description and argument
 *             text, and the sentences its results are made of
 *
 * The page lists the tools from `mcp.tools`, so the description an agent
 * reads in tools/list is the one a person reads here, and the two can't
 * drift apart. The function imports this module, so it keeps no runtime
 * imports (types only): Node and the function bundler can both load it
 * as it is. That's why the contact address is written out below.
 *
 * Agent-facing text is plain: no {em} or {k} markers (an agent would get
 * the braces), straight to the point, and nothing the site doesn't say.
 * The house rules still apply: US English, contractions, ’ apostrophes,
 * no em-dashes, no hype.
 *
 * Same conventions as src/content.ts for the page: headlines are arrays of
 * lines, {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k}
 * marks a technical term in body copy. Edit words here, never in a
 * renderer or in the function.
 */

import type { AgentsPage, AgentsServer } from './sections/agents';

/** Kept literal (see above). check-contact holds every page to it. */
const CONTACT = 'daniel@adjlcapital.com';

/** The endpoint's public address. */
const ENDPOINT = 'https://adjltechnology.com/mcp';

/** The intake form's topics, exactly as its <select> sends them
 *  (src/content-start.ts). start_conversation accepts these and no others. */
const TOPICS = ['AI Engineering', 'SEO & AI Search', 'Websites & Apps', 'Website audit', 'Something else'];

export const mcp: AgentsServer = {
  name: 'adjl-technology',
  title: 'ADJL Technology',
  /** Raise it when a tool's name, arguments or results change. */
  version: '1.0.0',
  endpoint: ENDPOINT,
  page: 'https://adjltechnology.com/agents/',
  contact: CONTACT,
  topics: TOPICS,
  description:
    'Answers questions about ADJL Technology from its own website, with a source for each answer, and can pass a message to Daniel Laskowski.',
  instructions:
    'ADJL Technology is an AI engineering, technical SEO and software studio, founded and led by Daniel Laskowski. This server answers from the firm’s own website, adjltechnology.com, and from nothing else. Use search_site for questions and cite the link that comes with each passage. Use get_page to read a whole page, and list_services or list_work for an overview. If the site doesn’t answer a question, say so instead of filling the gap. Every tool only reads, except start_conversation, which sends Daniel a message. Use it only when the person you’re helping asks to get in touch and has approved the exact message.',

  tools: [
    {
      name: 'search_site',
      title: 'Search this site',
      kind: 'read',
      description:
        'Search adjltechnology.com and get back the passages that answer a question, quoted word for word. Each passage comes with its page and a link to the exact section, so you can cite it. It uses the same index and confidence floor as the site’s own Ask This Site box. When nothing clears the floor, it returns no passages and says so. Treat that as something the site doesn’t say, and don’t fill the gap.',
      params: [
        { name: 'query', required: true, text: 'What to look for, in plain words. A whole question works.' },
        { name: 'limit', required: false, text: 'The most passages to return, from 1 to 8. The default is 5.' },
      ],
      returns:
        'Passages, best first: the quote, its heading, the page it’s on and a link to that section. Or no passages, and the pages that came closest.',
    },
    {
      name: 'get_page',
      title: 'Read a page',
      kind: 'read',
      description:
        'Get one page of adjltechnology.com as markdown: its title, its description and all of its text, without the layout. Takes the page’s path, like /services/seo/. Every search_site result, and every entry from list_services and list_work, carries one.',
      params: [
        {
          name: 'path',
          required: true,
          text: 'The page’s path, like /services/ai-engineering/. A full https://adjltechnology.com address works too.',
        },
      ],
      returns: 'The page as markdown, with its address and the date its content last changed.',
    },
    {
      name: 'list_services',
      title: 'List services',
      kind: 'read',
      description:
        'List what ADJL Technology offers: each practice and the services under it, with the summary from its page and its address.',
      params: [],
      returns: 'Each service: its name, the summary from its page and its address.',
    },
    {
      name: 'list_work',
      title: 'List work',
      kind: 'read',
      description:
        'List the work ADJL Technology has written up on its site, one case page each, with the summary from that page and its address.',
      params: [],
      returns: 'Each case page: its name, the summary from its page and its address.',
    },
    {
      name: 'start_conversation',
      title: 'Send Daniel a message',
      kind: 'send',
      description:
        'Send a message to Daniel Laskowski, who founded and leads ADJL Technology. It goes through the same intake form as the site’s start page, marked as sent by an AI agent, and Daniel answers by email. Use it only when the person you’re acting for has asked to get in touch, and has seen and approved the exact name, email address and message. Never send on your own initiative. Sending the same message twice in one day has no effect.',
      params: [
        { name: 'name', required: true, text: 'The person’s name, the way they want it on the message.' },
        { name: 'email', required: true, text: 'The address Daniel should reply to. It must be the person’s own.' },
        {
          name: 'message',
          required: true,
          text: 'What they want, in their own words: what it is, who it’s for, and any timing or budget they mentioned. From 20 to 5,000 characters.',
        },
        {
          name: 'topic',
          required: false,
          text: 'The closest topic, if one fits. Left out, it’s sent as Something else.',
        },
      ],
      returns: 'Whether it was sent, and what happens next.',
    },
  ],

  /* The sentences results are made of. {name} slots are filled by the
     function; everything else is sent as written. */
  replies: {
    unavailable: 'The site’s text couldn’t be loaded just now, so nothing was searched or read. Try again in a minute.',
    searchHead: 'Passages from adjltechnology.com for “{query}”, best first. Quote them as they are, and cite the link that comes with each one.',
    searchNone: 'Nothing on adjltechnology.com answers “{query}” clearly enough to quote. Treat it as something the site doesn’t say.',
    searchClosest: 'These pages came closest. Read one with get_page if it might help:',
    servicesHead: 'What ADJL Technology offers, from its own pages. The overview is at {url}.',
    workHead: 'The work ADJL Technology has written up, one case page each. The overview is at {url}.',
    notFound: 'There’s no page at {path} on adjltechnology.com. Use list_services, list_work or search_site to find the right path.',
    offSite: 'get_page reads pages on adjltechnology.com only.',
    sent:
      'Sent. The site’s host has the message, checks it for spam and emails it to Daniel Laskowski, marked as sent by an AI agent. He reads every message himself and answers by email to {email}, usually within a day or two. If the person wants to add something or take it back, they can email {contact}.',
    duplicate: 'This exact message was already sent today, so it wasn’t sent again. Daniel will answer the first one.',
    limited:
      'This IP address has sent as many messages today as the endpoint allows, so nothing was sent. Try again after midnight UTC, or the person can email Daniel directly at {contact}.',
    full: 'Agents have sent as many messages today as the endpoint takes for the whole site, so nothing was sent. Try again after midnight UTC, or the person can email Daniel directly at {contact}.',
    paused: 'Messages from agents are switched off right now, so nothing was sent. The person can email Daniel directly at {contact}.',
    failed:
      'The message couldn’t be delivered just now, so nothing was sent. Try once more in a few minutes, or the person can email Daniel directly at {contact}.',
    invalid: {
      args: 'Unexpected argument: {arg}. This tool takes {args}.',
      noArgs: 'Unexpected argument: {arg}. This tool takes no arguments.',
      query: 'query must be text, from 1 to 300 characters.',
      limit: 'limit must be a whole number from 1 to 8.',
      path: 'path must be a page path, like /services/seo/.',
      name: 'name must be the person’s name: one line, up to 120 characters.',
      email: 'email must be the person’s own address, like name@example.com, up to 200 characters.',
      messageShort: 'message is too short to act on. Ask the person what they want built or fixed, then send at least 20 characters.',
      messageLong: 'message is over 5,000 characters. Shorten it and send it again.',
      topic: 'topic must be one of: {topics}. Or leave it out.',
    },
  },
};

export const content: AgentsPage = {
  meta: {
    title: 'MCP Server for AI Agents | ADJL Technology',
    description:
      'Connect an AI agent to ADJL Technology over MCP at /mcp. It searches this site’s own pages, cites each source, and can send Daniel a message.',
    ogTitle: 'A front door for AI agents.',
  },
  hero: {
    eyebrow: 'For AI agents',
    headline: ['A front door', 'for {em}AI agents.{/em}'],
    lead: 'If an AI assistant is doing your research, it can ask this site directly. Our MCP server answers from these pages, links each answer to its source, and can pass Daniel a message when you ask it to.',
    primary: { label: 'Connect an agent', href: '#connect' },
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Endpoint', value: 'adjltechnology.com/mcp' },
      { label: 'Protocol', value: 'MCP, over Streamable HTTP' },
      { label: 'Sign-in', value: 'None' },
    ],
  },

  who: {
    id: 'who',
    eyebrow: 'Who it’s for',
    headline: ['For the assistant', 'doing the {em}legwork.{/em}'],
    body: [
      'Some people hand the first round of research to an AI assistant. Find a studio, check what it does, draft the first message. This page is for that assistant, and for whoever sets it up.',
      'The endpoint speaks MCP, the Model Context Protocol. It’s an open standard for connecting AI assistants to outside tools. Through it, an assistant can search this site, read any page as plain text, and list what we offer and what we’ve built.',
      'Every answer comes from this site’s own words, with a link to the page and section it came from. If the site doesn’t cover something, the search says so. It doesn’t guess.',
    ],
  },

  connect: {
    id: 'connect',
    eyebrow: 'Connect',
    headline: ['One address,', '{em}no sign-in.{/em}'],
    body: [
      'Point an MCP client at the address below. There’s no key and no account. Each request is a single POST, and each answer is a single JSON reply.',
    ],
    factsLabel: 'The endpoint',
    facts: [
      { label: 'Address', value: ENDPOINT },
      { label: 'Protocol', value: 'Model Context Protocol, version 2026-07-28' },
      { label: 'Also accepts', value: 'The older handshake: 2025-11-25, 2025-06-18 and 2025-03-26' },
      { label: 'Transport', value: 'Streamable HTTP, JSON replies, no sessions' },
      { label: 'Sign-in', value: 'None' },
    ],
    snippets: [
      {
        label: 'Client config',
        lang: 'json',
        caption: 'Many clients read a block like this. Where the file lives, and its exact shape, depends on the client.',
        code: `{
  "mcpServers": {
    "adjl-technology": {
      "type": "http",
      "url": "${ENDPOINT}"
    }
  }
}`,
      },
      {
        label: 'Claude Code',
        lang: 'shell',
        caption: 'In Claude Code it’s one command.',
        code: `claude mcp add --transport http adjl-technology ${ENDPOINT}`,
      },
      {
        label: 'By hand',
        lang: 'shell',
        caption: 'Or ask for the tool list with curl, no client at all.',
        code: `curl -s ${ENDPOINT} \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'MCP-Protocol-Version: 2026-07-28' \\
  -H 'Mcp-Method: tools/list' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{
    "io.modelcontextprotocol/protocolVersion":"2026-07-28",
    "io.modelcontextprotocol/clientCapabilities":{}}}}'`,
      },
    ],
  },

  tools: {
    id: 'tools',
    eyebrow: 'Tools',
    headline: ['What an agent can do,', 'and {em}what comes back.{/em}'],
    body: [
      'All but one of them only read. The exception is start_conversation, and it acts only when the person behind the agent asks.',
    ],
    labels: {
      takes: 'Takes',
      returns: 'Returns',
      none: 'Nothing',
      optional: 'optional',
      read: 'Read-only',
      send: 'Sends a message',
    },
  },

  rules: {
    id: 'rules',
    eyebrow: 'The rules',
    headline: ['Read-only,', 'with {em}one exception.{/em}'],
    list: [
      'start_conversation is the only tool that sends anything. It passes Daniel a message through the same form as the start page, marked as sent by an agent.',
      'An agent should send one only when the person it works for asks to get in touch and has read the exact message. The tool’s own description tells the agent so.',
      'Each IP address gets 60 requests a minute. Past that, the endpoint answers 429 until the minute is up.',
      'Three messages a day can come from one IP address, and there’s a daily cap for the whole site. Past either, the tool says so and points to email.',
      'No tracking. No cookies, no accounts, and no record of what an agent searches for or reads. When a message is sent, the endpoint keeps two one-way hashes for that day: one of the IP address it came from, to count messages, and one of the message, so a repeat isn’t sent twice. Both are deleted after that day, the next time an agent uses one of the tools.',
      'Answers come only from this site’s published text, through the same index and confidence floor as Ask This Site.',
    ],
    links: [
      { label: 'What happens to a message', href: '/legal/privacy/#form' },
      { label: 'Write to Daniel yourself', href: '/start/' },
    ],
  },

  text: {
    id: 'text',
    eyebrow: 'Plain text',
    headline: ['No MCP client?', 'Read the {em}plain text.{/em}'],
    body: [
      'The same pages are published as text an agent can fetch with one ordinary request. No protocol, no tools, nothing to install.',
    ],
    dl: [
      { label: '/llms.txt', value: 'An index of every page, one line each, with what the page covers.' },
      { label: '/llms-full.txt', value: 'Every page’s text as markdown, in one file.' },
      { label: 'index.md', value: 'Any page on its own: add index.md to its address, like /agents/index.md.' },
      { label: '/sitemap.xml', value: 'Every page, with the date its content last changed.' },
    ],
    links: [
      { label: 'Read llms.txt', href: '/llms.txt' },
      { label: 'Read llms-full.txt', href: '/llms-full.txt' },
      { label: 'This page as markdown', href: '/agents/index.md' },
    ],
  },
};
