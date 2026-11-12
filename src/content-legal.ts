/**
 * ADJL Technology: the legal pages.
 *
 * These are short because the site is genuinely simple, and that's worth
 * stating instead of padding around. It's static HTML on a CDN, with no
 * login, no analytics script, no advertising pixel and no cookie. Reading
 * it tells us nothing about you.
 *
 * Three tools send what a visitor types, and each has its own section:
 * the intake form on /start/ (Netlify Forms: stored by Netlify, filtered
 * for spam, emailed to Daniel), the scoping assistant on /start/ (the
 * conversation goes to Anthropic through netlify/functions/assistant.mjs;
 * nothing is stored but per-visitor daily counts under a salted hash of
 * the IP) and the scanner on /scan/ (it fetches the page named and stores
 * nothing, per netlify/functions/scan.mjs). The form section also covers
 * the MCP endpoint's start_conversation (netlify/functions/mcp.mjs, WS-M):
 * per day, one record per message under a hash of the caller's IP mixed
 * with a daily random value, and a hash of each message to send it once,
 * all deleted after the day. Re-check those against mcp.mjs if it changes.
 *
 * What the site keeps in the browser is described too: the Pause motion
 * preference and the opening note (session storage), the reading switch
 * (local storage), the same-origin measurement fetches, and Ask This Site,
 * which never sends the question anywhere. If any of those changes, or a
 * function starts keeping something, this page changes with it.
 *
 * A boilerplate policy listing cookie categories and third-party processors
 * this site does not have would be longer, more professional-looking, and
 * false. If any of that ever gets added, this file is what has to change
 * first, and scripts/check-claims.mjs fails the build if an analytics or
 * tag script appears in the output while this page still says there is none.
 */

import type { LegalDoc } from './sections/legal';
import { CONTACT } from './content';

const UPDATED = 'November 2026';
const LABELS = { updated: 'Last updated', toc: 'On this page' };

export const privacy: LegalDoc = {
  meta: {
    title: 'Privacy | ADJL Technology',
    description:
      'What this site collects. No analytics, no cookies, no tracking. What the form, the assistant and the scanner send, and where it goes.',
    ogTitle: 'Privacy',
    ogDescription:
      'This site doesn’t track you. No analytics script, no advertising pixel, no cookie set by us. Here’s what the form, the assistant and the scanner send.',
  },
  route: '/legal/privacy/',
  eyebrow: 'Legal',
  title: 'Privacy',
  updated: UPDATED,
  labels: LABELS,
  secondary: { label: 'Talk to Daniel', href: '/#contact' },
  intro:
    'This site doesn’t track you. There’s no analytics script, no advertising pixel and no cookie set by us, and reading it tells us nothing about you. Three tools send what you type: the form, which goes to Daniel, the scoping assistant, which uses Anthropic’s model to reply, and the scanner, which fetches the page you name. Each one is described below.',
  sections: [
    {
      id: 'collect',
      heading: 'What this site collects',
      paragraphs: [
        'Nothing, just from reading. These pages are static files served from a content delivery network. No script here sets a cookie. No analytics or session-recording service is loaded, and no third-party embed appears on any page.',
        'Your browser may keep the usual local cache of images, fonts and scripts so pages load faster on a second visit. That cache lives on your device. Your browser controls it, and we can’t read it.',
      ],
    },
    {
      id: 'motion',
      heading: 'Preferences kept in your browser',
      paragraphs: [
        'If you press Pause motion, your browser remembers the choice in its own session storage so the next page stays still. The home page’s opening animation plays once per visit, and your browser notes there that it has played. Neither note leaves your device, and both are erased when you close the tab.',
        'The reading switch (Plain or Technical) is remembered in your browser’s local storage so the next page reads the same way. It never leaves your device.',
      ],
    },
    {
      id: 'measure',
      heading: 'Measurements on the page',
      paragraphs: [
        'Some sections measure the page you’re reading. They use your browser’s own performance APIs, and they fetch this site’s files again from this site and nowhere else. The results are shown to you and aren’t sent anywhere. Those fetches are ordinary requests, so they appear in the host’s standard logs like any page view. The status bar also counts any cookies your browser holds for this site. There should be none. It reads that count from document.cookie, shows it to you and sends it nowhere.',
      ],
    },
    {
      id: 'ask',
      heading: 'Ask This Site',
      paragraphs: [
        'The question you type into Ask This Site is matched against an index of this site’s own text, inside your browser. It isn’t sent to us or to anyone else.',
      ],
    },
    {
      id: 'form',
      heading: 'If you send the form',
      paragraphs: [
        'The form on the start page asks for your name, your email, a topic and a message. It also notes how the message was written: by you, drafted with the assistant, or sent for you by an AI agent through this site’s MCP endpoint.',
        'Netlify, which hosts this site, receives the form. It runs each submission through a spam filter (Akismet), stores it in this site’s Netlify account and emails it to Daniel. We use it to reply to you, and to do the work if we end up working together. It isn’t added to a mailing list, and it isn’t sold, rented or shared.',
        'If an AI agent sends the form for you through this site’s MCP endpoint, the endpoint keeps two kinds of record for that day: one for each message, so no single caller can send more than a few, and a fingerprint of each message, so the same one isn’t sent twice. Both are one-way hashes mixed with a random value made each day. Neither holds the caller’s IP address or the words of the message, and both are deleted after that day. What an agent searches for or reads through the endpoint isn’t stored.',
        `To have a submission deleted, write to ${CONTACT}. Daniel deletes it from Netlify and from his inbox.`,
      ],
    },
    {
      id: 'assistant',
      heading: 'The scoping assistant',
      paragraphs: [
        'The assistant on the start page sends what you type, with the conversation so far, to a function on this site. The function passes it to Anthropic, along with this site’s own pages, and Anthropic’s Claude model writes the reply. Anthropic handles that data under its own terms and privacy policy, not this one.',
        'This site doesn’t store the conversation. It lives in your browser tab and is gone when you close or reload the page. If something goes wrong, the function’s log notes the kind of error, never your words. If you press Draft my brief, the draft goes into the form on the same page, and it reaches Daniel only if you send the form.',
        'To keep the assistant from being overused, the function counts requests for each visitor, per day. For each request it records the time and a one-way hash of your IP address, mixed with a secret and the date, and never the address itself. Each day’s records are deleted after that day, the next time the assistant runs.',
      ],
    },
    {
      id: 'scan',
      heading: 'The scanner',
      paragraphs: [
        'The address you type into the scanner goes to a function on this site. It fetches that page from Netlify’s servers, the way a crawler would, and shows you what came back. Nothing is stored: not the address, not the page and not your IP address.',
      ],
    },
    {
      id: 'hosting',
      heading: 'Hosting and server logs',
      paragraphs: [
        'The site is hosted by Netlify. Like any web host, Netlify records standard request logs for delivery, security and abuse prevention: an IP address, a timestamp, the page requested and a user-agent string. That’s a function of connecting to any server on the internet, and it happens before this site sees the request. Those logs are held under Netlify’s own policy, not ours, and we don’t build profiles from them.',
      ],
    },
    {
      id: 'email',
      heading: 'If you email us',
      paragraphs: [
        `You can also write to ${CONTACT}, which opens your own mail client. We receive whatever you send, which means your address, your name if you sign it, and the content of your message.`,
        'We use that message to reply to you, and to do the work if we end up working together. It isn’t added to a mailing list, fed to any sequence or drip campaign, or sold, rented or shared with anyone. If you’d like it deleted, ask, and it will be.',
      ],
    },
    {
      id: 'clients',
      heading: 'Client data during an engagement',
      paragraphs: [
        'Work with a client is a separate matter from this website, and it’s governed by the written agreement for that engagement, not by this page.',
        'Those agreements carry a standing position. Client data stays in the client’s own environment wherever that’s technically possible. Where some part of it has to leave, say to a model provider’s API, the client is told before anything is built exactly what leaves, where it goes, and how long it’s retained there. That disclosure happens during scoping, not in an appendix afterward.',
      ],
    },
    {
      id: 'rights',
      heading: 'Your rights',
      paragraphs: [
        'Depending on where you live, you may have the right to ask what personal data is held about you, to have it corrected, to have it deleted, or to object to its processing. What exists here is what you sent us, an email or a form, and, for a day, the hashed records described above if you used the assistant or an agent sent the form for you. Exercising any of those just means asking.',
        `Write to ${CONTACT} and Daniel Laskowski handles it directly. He’s the person responsible for this site and for the firm.`,
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this page',
      paragraphs: [
        'If the site adds anything that collects data, this page changes first and says exactly what was added. The form, the assistant and the scanner were added that way. The date at the top is the date of the last change.',
      ],
    },
  ],
};

export const terms: LegalDoc = {
  meta: {
    title: 'Terms | ADJL Technology',
    description:
      'The terms for using this website. What the content is, what it isn’t, and what governs an actual engagement.',
    ogTitle: 'Terms of use',
    ogDescription:
      'These terms cover this website and nothing else. Actual work is governed by a written agreement signed for that engagement.',
  },
  route: '/legal/terms/',
  eyebrow: 'Legal',
  title: 'Terms of use',
  updated: UPDATED,
  labels: LABELS,
  secondary: { label: 'Talk to Daniel', href: '/#contact' },
  intro:
    'These terms cover this website and nothing else. Actual work is governed by a written agreement signed for that engagement. Where the two ever disagree, the agreement wins.',
  sections: [
    {
      id: 'site',
      heading: 'What this site is',
      paragraphs: [
        'A description of an AI engineering, SEO and software studio, published so that someone deciding whether to make contact can find out what the firm does and how it works. It’s marketing material, written to be accurate. That still isn’t a contract.',
        'Descriptions of systems on this site are general by design. Where a system is described, its parameters, thresholds and configuration are deliberately omitted. That restraint is carried from ADJL Capital. It isn’t an oversight.',
      ],
    },
    {
      id: 'not',
      heading: 'What it isn’t',
      paragraphs: ['Specifically, nothing on this site is any of the following.'],
      list: [
        'An offer to sell, or a solicitation of an offer to buy, any security or interest in any fund. ADJL Technology is an engineering practice and doesn’t offer securities.',
        'Investment, legal, tax or accounting advice. Nothing here should be relied on to make a financial decision.',
        'A quotation, an estimate, or an offer of services on any particular terms. Scope and price come out of a conversation, and they’re set out in writing.',
        'A guarantee that any technique described will produce a particular result in your business.',
        'An endorsement of anything on a site this one links to. Where this site links out, the link is a reference. What’s at the other end belongs to whoever published it.',
      ],
    },
    {
      id: 'accuracy',
      heading: 'Accuracy',
      paragraphs: [
        'The content here is written to be correct when it’s published, and it’s kept current, but it’s provided as-is and without warranty. Software, model providers and market data all change. A page written in good faith can go out of date before anyone notices.',
        'If you find something here that’s wrong, we’d genuinely like to know.',
      ],
    },
    {
      id: 'ip',
      heading: 'Intellectual property',
      paragraphs: [
        'The text, design, code and diagrams on this site belong to ADJL Technology. You’re welcome to link to any page, quote it with attribution, and print it for your own use.',
        'Work produced during a client engagement is a different question, and it’s answered the other way around. The client owns the code, the prompts, the evaluation set and the documentation. That’s set out in the engagement agreement, and the Approach page describes it in plain terms.',
      ],
    },
    {
      id: 'liability',
      heading: 'Liability',
      paragraphs: [
        'To the extent the law allows, ADJL Technology isn’t liable for loss arising from use of this website or reliance on its content. Liability arising from actual work is dealt with in the agreement covering that work, where it belongs.',
        'Nothing here limits liability for fraud, or for anything else that can’t lawfully be limited.',
      ],
    },
    {
      id: 'relationship',
      heading: 'Relationship to ADJL Capital',
      paragraphs: [
        'ADJL Capital is a private investment firm. ADJL Technology is the engineering practice that built and runs its software. They’re separate companies with separate obligations, and this website speaks only for ADJL Technology.',
        'The software described here can be described in detail because it’s our own. There’s no client confidentiality to breach in explaining how our own underwriting engine works.',
        'ADJL Capital publishes its own site, linked below. That site speaks for that firm. Nothing on it forms part of this site, and nothing here is an offer of anything the firm sells.',
      ],
      /* The site's only outbound link, and the only place one belongs: this
         section exists to describe the relationship, so the link is the
         citation for a claim the paragraphs already make. A bare domain as
         the label, because a domain cannot read as an invitation the way
         "Invest with ADJL Capital" would. scripts/check-links.mjs holds
         both rules. */
      link: { label: 'adjlcapital.com', href: 'https://adjlcapital.com/' },
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
