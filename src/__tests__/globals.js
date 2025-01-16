const _navigator = {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  vendor: "Apple Computer, Inc.",
  platform: "iPhone",
  languages: [ "fr-FR", "en" ],
  language: "fr-FR",
  keyboard: undefined,
};

// eslint-disable-next-line no-undef
Object.defineProperty(window, 'navigator', {
  value: _navigator,
  writable: true
});
