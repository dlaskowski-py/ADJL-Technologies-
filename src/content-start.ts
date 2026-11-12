/**
 * ADJL Technology: /start/ (start a project: the scoping assistant and the
 * intake form) and /start/sent/ (where the form lands, noindex).
 *
 * Every word on both pages is here, including the wordings the browser
 * module shows (copy.*), which the renderer writes into the page as JSON so
 * no copy ships inside src/motion/assistant.ts. The assistant's own replies
 * come from the model through /api/assistant; its instructions live with
 * that function (netlify/functions/assistant.mjs), not here.
 *
 * What these pages may say, and what they may not:
 *   - Daniel reads every message himself and answers by email, usually
 *     within a day or two. That's the shared contact note's promise, and
 *     it's the only timing these pages state.
 *   - Netlify stores form submissions, filters them for spam and emails
 *     them to Daniel. Nothing else happens to them.
 *   - The assistant never quotes a price, never promises a date and never
 *     sends anything. The visitor sends the form.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import { CONTACT } from './content';
import type { SectionPage } from './content-types';
import type { StartPage, Topic } from './sections/start';

/** The intake form's topics, exactly as the form contract names them. The
 *  slug is what a link can preselect: /start/?topic=audit. */
const TOPICS: Topic[] = [
  { label: 'AI Engineering', slug: 'ai' },
  { label: 'SEO & AI Search', slug: 'seo' },
  { label: 'Websites & Apps', slug: 'software' },
  { label: 'Website audit', slug: 'audit' },
  { label: 'Something else', slug: 'other' },
];

const OFF = 'The assistant isn’t switched on yet. The form below works.';
const UNREACHABLE = 'The assistant can’t be reached right now. The form below works.';
const ENDED = 'That’s as long as one conversation can run. Draft your brief now, or finish it in the form.';

export const content: StartPage = {
  meta: {
    title: 'Start a Project | ADJL Technology',
    description:
      'Tell ADJL Technology what you want built. A few lines in the form go straight to Daniel, and he answers by email.',
    ogTitle: 'Tell us what you want built.',
  },
  hero: {
    eyebrow: 'Start a project',
    headline: ['Tell us what', 'you {em}want built.{/em}'],
    lead: 'A few lines in the form below is plenty. Daniel reads every message himself and answers by email.',
    primary: { label: 'Go to the form', href: '#form' },
    secondary: { label: 'Email Daniel', href: `mailto:${CONTACT}` },
  },

  assistant: {
    eyebrow: 'Scoping assistant',
    headline: ['Not sure', 'how to {em}put it?{/em}'],
    body: [
      'Say what you have in mind, in a sentence or two. The assistant asks a few short questions, then drafts your message into the form below. You read it, change what you like, and send it yourself.',
      'It answers from this site’s pages and shows you which ones. It won’t quote a price or promise a date. Daniel does that in writing, once he’s read what you need.',
    ],
    panel: {
      title: 'Assistant',
      status: {
        nojs: 'The assistant needs JavaScript. The form below works without it.',
        loading: 'Checking whether the assistant is on…',
        off: OFF,
        unreachable: UNREACHABLE,
      },
      toForm: { label: 'Go to the form', href: '#form' },
      startersLabel: 'Or start with one of these',
      starters: [
        'We need a website for our business.',
        'We want an app for iPhone and Android.',
        'We’d like AI to read our invoices.',
        'We want to show up in Google and in AI answers.',
      ],
      label: 'Your message',
      placeholder: 'For example: our salon needs a booking page that takes a deposit.',
      send: 'Send',
      draft: 'Draft my brief',
    },
    side: {
      title: 'How it works',
      facts: [
        {
          label: 'Model',
          value:
            'Claude Opus 5.5, made by Anthropic. If it declines a message, Anthropic can hand it to a backup model, and the conversation says which one replied.',
        },
        { label: 'Reads', value: 'This site’s own pages, and nothing else. It doesn’t search the web.' },
        { label: 'Won’t', value: 'Quote a price, promise a date, or send anything for you.' },
        {
          label: 'Can be wrong',
          value:
            'It’s a language model, so it can misread a page or get a detail wrong. It’s told to say “I don’t know” when the pages don’t answer. Daniel reads what you send and answers himself.',
        },
        {
          label: 'Your words',
          value:
            'What you type goes to Anthropic to write the replies. This site doesn’t keep the conversation. Only what you send through the form reaches Daniel.',
        },
      ],
      sources: 'Pages it drew on',
      none: 'None yet. Each page it cites shows up here, linked.',
      privacy: { label: 'Privacy details', href: '/legal/privacy/#assistant' },
    },
  },

  form: {
    eyebrow: 'The form',
    headline: ['Send it', 'to {em}Daniel.{/em}'],
    body: [
      'Your name, your email and a few lines about the project. It goes to Daniel, and he answers by email, usually within a day or two.',
    ],
    list: [
      'Netlify, the site’s host, stores what you send, checks it for spam and emails it to Daniel.',
      'He reads it himself. No sequence, no drip, and nothing sold to anyone.',
      'If it isn’t a fit, you’ll hear that in the reply.',
    ],
    fields: {
      name: 'Your name',
      email: 'Email',
      emailHint: 'Daniel replies here.',
      topic: 'What’s it about?',
      topicPlaceholder: 'Choose one',
      message: 'What do you want built?',
      messageHint: 'What it should do, who it’s for, and anything you already know about timing or budget.',
      honeypot: 'Leave this empty',
    },
    submit: 'Send to Daniel',
    note: 'Netlify stores it and emails it to Daniel.',
    privacy: { label: 'What happens to it', href: '/legal/privacy/#form' },
  },

  copy: {
    ui: {
      you: 'You',
      them: 'Assistant',
      greeting: 'Hi. What would you like built? A sentence or two is plenty to start.',
      writing: 'Writing',
      left: '{n} messages left',
      leftOne: '1 message left',
      count: '{n} / {max}',
      cut: 'This reply was cut short.',
      from: 'From',
      drafting: 'Drafting your brief…',
      drafted: 'Your brief is in the form below. Read it, change anything, then send it.',
      ended: ENDED,
      first: 'Tell the assistant a little about the project first.',
      backup: 'This reply came from {model}, a backup model, because the first one declined.',
    },
    errors: {
      rate_limited: 'That’s a lot of messages in a short time. Wait a minute and try again, or use the form.',
      daily_limit: 'The assistant has reached its limit for today. The form below works, and Daniel reads every message.',
      turn_limit: ENDED,
      too_long: 'That’s over 1,500 characters. Trim it a little, or put the detail in the form.',
      busy: 'The assistant is busy right now. Try again in a moment, or use the form.',
      timeout: 'That took too long to answer. Try again, or use the form.',
      refusal: 'The assistant can’t help with that one. The form below goes straight to Daniel.',
      disabled: OFF,
      unreachable: UNREACHABLE,
      draft: 'The brief didn’t come together. Try again, or write it in the form yourself.',
      generic: 'Something went wrong on our side. The form below still works.',
    },
    brief: {
      want: 'What I want built',
      audience: 'Who it’s for',
      must: 'It has to',
      timeline: 'Timing',
      budget: 'Budget',
      open: 'What I’d like to ask',
    },
    models: {
      'claude-opus-5-5': 'Claude Opus 5.5',
      'claude-opus-5': 'Claude Opus 5',
      'claude-opus-4-8': 'Claude Opus 4.8',
    },
    form: {
      errors: {
        name: 'Add your name, so Daniel knows who he’s writing to.',
        emailMissing: 'Add your email, so Daniel can reply.',
        emailInvalid: 'That email doesn’t look right. Check it for a typo.',
        topic: 'Pick the closest one. “Something else” is fine.',
        message: 'Add a line or two about the project.',
      },
      sending: 'Sending…',
      sentTitle: 'Sent. Daniel has it.',
      sentBody:
        'He reads every message himself and answers by email, usually within a day or two. If you think of something to add, reply to his email when it comes.',
      failed: `That didn’t go through. Check your connection and try again, or email Daniel at ${CONTACT}.`,
      drafted: 'The assistant drafted this from your conversation. Read it, change anything, then send it.',
    },
    topics: TOPICS,
  },
};

/** /start/sent/: where the form lands without a script (its action). */
export const sent: SectionPage = {
  meta: {
    title: 'Message Sent | ADJL Technology',
    description: 'Your message is on its way to Daniel. He reads every one himself and answers by email, usually within a day or two.',
    ogTitle: 'Your message is on its way.',
  },
  hero: {
    eyebrow: 'Message sent',
    headline: ['Your message', '{em}is on its way.{/em}'],
    lead: 'Daniel reads every message himself and answers by email, usually within a day or two.',
    primary: { label: 'Back to the home page', href: '/' },
    secondary: { label: 'See what we’ve built', href: '/work/' },
  },
  sections: [
    {
      id: 'next',
      eyebrow: 'What happens next',
      headline: ['Here’s what', '{em}happens now.{/em}'],
      body: [
        `Something to add, or sent it by mistake? Email Daniel at ${CONTACT}. He’ll take the extra detail, or delete what you sent.`,
      ],
      items: [
        {
          title: 'It’s stored and sent on',
          body: 'Netlify, the site’s host, keeps your message, checks it for spam and emails it to Daniel.',
        },
        {
          title: 'Daniel reads it',
          body: 'He reads every message himself, usually within a day or two. No sequence, no drip, and nothing sold to anyone.',
        },
        {
          title: 'He answers by email',
          body: 'If it’s a fit, he’ll suggest a next step. If it isn’t, you’ll hear that in the reply.',
        },
      ],
      links: [{ label: 'What happens to your message', href: '/legal/privacy/#form' }],
    },
  ],
};
