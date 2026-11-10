/**
 * ADJL Technology: /work/mobile-app/, the ADJL Capital investor app.
 *
 * The app is real and privately distributed. This page describes how it's
 * built and how it stays in step with the website. It carries no
 * investment content, no figures and no screenshots of positions, anywhere.
 *
 * Same conventions as src/content.ts: headlines are arrays of lines,
 * {em}…{/em} marks one emphasized phrase per headline, and {k}…{/k} marks a
 * technical term in body copy. Edit words here, never in a renderer.
 */

import type { SectionPage } from './content-types';

export const content: SectionPage = {
  meta: {
    title: 'Offline React Native App, iOS and Android | ADJL Technology',
    description:
      'A native iOS and Android app built with Expo and React Native. The full underwriting engine runs offline on the phone, held to the web by tests.',
    ogTitle: 'The whole engine, on the phone.',
    ogDescription:
      'A native app for ADJL Capital’s investors, built with Expo and React Native for iOS and Android from one codebase. The underwriting engine runs on the device with no network.',
  },
  hero: {
    eyebrow: 'Case study · Native app',
    headline: ['The whole engine,', '{em}on the phone.{/em}'],
    lead: 'A native app for ADJL Capital’s investors, built with Expo and React Native for iOS and Android from one codebase. The underwriting engine runs on the device with no network. Its files are the same ones the website runs, and tests hold both to the same answers. It’s distributed privately, not through a public store listing.',
    secondary: { label: 'Talk to Daniel', href: '#contact' },
    specs: [
      { label: 'Platform', value: 'iOS and Android, one codebase' },
      { label: 'Built with', value: 'Expo, React Native, TypeScript' },
      { label: 'Runs offline', value: 'The full underwriting engine' },
      { label: 'Distribution', value: 'Private, not a public store listing' },
    ],
  },
  sections: [
    {
      id: 'why',
      eyebrow: 'Why native',
      headline: ['Why an app', 'and not a {em}bookmark.{/em}'],
      body: [
        'A web page needs a connection to compute anything. This app doesn’t. Paste a listing or type the numbers in, drag an assumption, and the result recomputes under your thumb with no network at all.',
      ],
    },
    {
      id: 'parity',
      eyebrow: 'Shared engine',
      headline: ['Same files.', '{em}Same answers.{/em}'],
      body: [
        'The engine modules are copied byte for byte from the website. They aren’t ported, because a port is a chance to mistype a number. Golden scenarios produced by the original prototype run against the copy, so any drift fails a test.',
      ],
      instrument: 'leaders-parity',
    },
    {
      id: 'purity',
      eyebrow: 'Pure modules',
      headline: ['A rule the', '{em}tests enforce.{/em}'],
      body: [
        'Every engine module is pure. No network calls, no filesystem and no access to the process. A test reads the vendored source and fails if one appears. A single import added on the website would otherwise break the app on a device, where no type checker sees it.',
      ],
    },
    {
      id: 'server',
      eyebrow: 'Server side',
      headline: ['What stays', '{em}on the server.{/em}'],
      body: [
        'Property lookups and the written narrative stay behind authenticated endpoints, because they need secrets. So do the large market datasets. They’re too big to ship in an app someone downloads over cellular.',
      ],
    },
    {
      id: 'private',
      eyebrow: 'Distribution',
      headline: ['Shipped', '{em}privately.{/em}'],
      body: [
        'The app reaches investors through private distribution, not a public store listing. Its icon, splash screen and in-app mark are all generated from one file that holds the three-bar mark’s geometry.',
      ],
    },
  ],
  foot: {
    builtUnder: [{ label: 'Websites & Apps', href: '/services/software/' }],
    next: { label: 'How Loep works', href: '/work/loep/' },
  },
};

export const meta = content.meta;
