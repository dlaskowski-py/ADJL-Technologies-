/**
 * Copy for the ⌘K palette. Same rules as every content module: US English,
 * contractions, no hype, ’ apostrophes.
 */
export const palette = {
  label: 'Jump to',
  placeholder: 'Type a page, a section or a command',
  close: 'Close',
  empty: 'Nothing matches that.',
  count: { one: '1 result.', many: '{n} results.' },
  groups: { pages: 'Pages', sections: 'On this page', views: 'View', commands: 'Commands' },
  views: { render: 'Render view', source: 'Source view', machine: 'Machine view' },
  commands: {
    measure: 'Measure this page',
    llms: 'Open llms.txt',
    copy: 'Copy email address',
    copied: 'Copied the address.',
    pause: 'Pause motion',
    resume: 'Resume motion',
    curl: 'curl -I this page',
    curlNote: 'Response headers for this page, fetched just now from this site.',
    curlFail: 'The request didn’t complete. You may be offline.',
    curlMissing: 'This preview server doesn’t send it. Production does.',
  },
  hint: '↑↓ to move · enter to run · esc to close',
};
