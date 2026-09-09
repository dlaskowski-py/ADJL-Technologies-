/**
 * ADJL Technologies — the legal pages.
 *
 * These are short because the site is genuinely simple, and that is worth
 * stating rather than padding around. It is static HTML on a CDN. There is
 * no form, no login, no analytics script, no advertising pixel and no
 * cookie — the only way to contact the firm is an email address, so the
 * only personal data involved is the message you choose to send.
 *
 * A boilerplate policy listing cookie categories and third-party processors
 * this site does not have would be longer, more professional-looking, and
 * false. If any of that ever gets added, this file is what has to change
 * first — scripts/check-claims.mjs fails the build if an analytics or tag
 * script appears in the output while this page still says there is none.
 */

import type { LegalDoc } from './sections/legal';
import { CONTACT } from './content';

const UPDATED = 'September 2026';

export const privacy: LegalDoc = {
  meta: {
    title: 'Privacy — ADJL Technologies',
    description:
      'What this site collects, which is almost nothing: no analytics, no cookies, no tracking. The only personal data involved is an email you choose to send.',
    ogTitle: 'Privacy — ADJL Technologies',
    ogDescription: 'No analytics, no cookies, no tracking. What happens to an email you send.',
  },
  route: '/legal/privacy/',
  eyebrow: 'Legal',
  title: 'Privacy',
  updated: UPDATED,
  intro:
    'This site does not track you. There is no analytics script, no advertising pixel and no cookie set by us, and there is no form to fill in — so unless you email us, we do not learn anything about you at all.',
  sections: [
    {
      id: 'collect',
      heading: 'What this site collects',
      paragraphs: [
        'Nothing, through the site itself. These pages are static files served from a content delivery network. No script here reads or writes a cookie, no analytics or session-recording service is loaded, and no third-party embed is present on any page.',
        'Your browser may keep the usual local cache of images, fonts and video so pages load faster on a second visit. That cache lives on your device, is controlled by your browser, and is not readable by us.',
      ],
    },
    {
      id: 'hosting',
      heading: 'Hosting and server logs',
      paragraphs: [
        'The site is hosted by Netlify. Like any web host, Netlify records standard request logs — an IP address, a timestamp, the page requested and a user-agent string — for delivery, security and abuse prevention. That is a function of connecting to any server on the internet, and it happens before this site sees the request. Those logs are held under Netlify’s own policy, not ours, and we do not build profiles from them.',
      ],
    },
    {
      id: 'email',
      heading: 'If you email us',
      paragraphs: [
        `The only way to contact the firm from this site is the address ${CONTACT}, which opens your own mail client. We receive whatever you send: your address, your name if you sign it, and the content of your message.`,
        'That message is used to reply to you and to do the work if we end up working together. It is not added to a mailing list, not fed to any sequence or drip campaign, and not sold, rented or shared with anyone. If you would like it deleted, ask, and it will be.',
      ],
    },
    {
      id: 'clients',
      heading: 'Client data during an engagement',
      paragraphs: [
        'Work with a client is a separate matter from this website, and it is governed by the written agreement for that engagement rather than by this page.',
        'The standing position, which is written into those agreements: client data stays in the client’s own environment wherever that is technically possible. Where some part of it has to leave — a model provider’s API, for instance — the client is told before anything is built exactly what leaves, where it goes, and how long it is retained there. That disclosure happens during scoping, not in an appendix afterwards.',
      ],
    },
    {
      id: 'rights',
      heading: 'Your rights',
      paragraphs: [
        'Depending on where you live you may have the right to ask what personal data is held about you, to have it corrected, to have it deleted, or to object to its processing. Since the only thing that exists is an email you sent, exercising any of these is a matter of asking.',
        `Write to ${CONTACT} and it will be handled directly by Daniel Laskowski, who is the person responsible for this site and for the firm.`,
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this page',
      paragraphs: [
        'If the site ever gains a form, an analytics tool or anything else that collects data, this page changes first and says exactly what was added. The date at the top is the date of the last change.',
      ],
    },
  ],
};

export const terms: LegalDoc = {
  meta: {
    title: 'Terms — ADJL Technologies',
    description:
      'The terms for using this website: what the content is, what it is not, and what governs an actual engagement.',
    ogTitle: 'Terms — ADJL Technologies',
    ogDescription: 'Terms of use for the ADJL Technologies website.',
  },
  route: '/legal/terms/',
  eyebrow: 'Legal',
  title: 'Terms of use',
  updated: UPDATED,
  intro:
    'These terms cover this website and nothing else. Actual work is governed by a written agreement signed for that engagement, and where the two ever disagree, the agreement wins.',
  sections: [
    {
      id: 'site',
      heading: 'What this site is',
      paragraphs: [
        'A description of a consulting and engineering practice, published so that someone deciding whether to make contact can find out what the firm does and how it works. It is marketing material written to be accurate, which is not the same thing as a contract.',
        'Descriptions of systems on this site are general by design. Where a system is described, its parameters, thresholds and configuration are deliberately omitted — that restraint is carried from ADJL Capital and it is not an oversight.',
      ],
    },
    {
      id: 'not',
      heading: 'What it is not',
      paragraphs: ['Specifically, nothing on this site is any of the following.'],
      list: [
        'An offer to sell, or a solicitation of an offer to buy, any security or interest in any fund. ADJL Technologies is an engineering practice and does not offer securities.',
        'Investment, legal, tax or accounting advice, and nothing here should be relied on to make a financial decision.',
        'A quotation, an estimate, or an offer of services on any particular terms. Scope and price come from a conversation and are set out in writing.',
        'A guarantee that any technique described will produce a particular result in your business.',
      ],
    },
    {
      id: 'accuracy',
      heading: 'Accuracy',
      paragraphs: [
        'The content here is written to be correct at the time it is published and is kept current, but it is provided as-is and without warranty. Software, model providers and market data all change, and a page written in good faith can go out of date before it is noticed.',
        'If you find something here that is wrong, we would genuinely like to know.',
      ],
    },
    {
      id: 'ip',
      heading: 'Intellectual property',
      paragraphs: [
        'The text, design, code and generated films on this site belong to ADJL Technologies. You are welcome to link to any page, quote it with attribution, and print it for your own use.',
        'Work produced during a client engagement is a different question and is answered the other way round: the client owns the code, the prompts, the evaluation set and the documentation. That is set out in the engagement agreement, and the Approach page describes it in plain terms.',
      ],
    },
    {
      id: 'liability',
      heading: 'Liability',
      paragraphs: [
        'To the extent the law allows, ADJL Technologies is not liable for loss arising from use of this website or reliance on its content. Liability arising from actual work is dealt with in the agreement covering that work, where it belongs.',
        'Nothing here limits liability for fraud, or for anything else that cannot lawfully be limited.',
      ],
    },
    {
      id: 'relationship',
      heading: 'Relationship to ADJL Capital',
      paragraphs: [
        'ADJL Capital is a private investment firm. ADJL Technologies is the engineering practice that built and runs its software. They are separate companies with separate obligations, and this website speaks only for the latter.',
        'The software described here can be described in detail precisely because it is our own — there is no client confidentiality to breach in explaining how our own underwriting engine works.',
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      paragraphs: [
        `Questions about these terms, or about anything on this site, go to ${CONTACT}.`,
      ],
    },
  ],
};
