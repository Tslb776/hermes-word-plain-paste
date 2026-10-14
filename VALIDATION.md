# Validation

Version: 1.0.1. Date: 2026-10-14.

## Automated

- JavaScript syntax check and zsh syntax checks passed.
- All 28 React/jsdom event-routing and lifecycle checks passed.
- Install scripts passed clean installation, repeated installation, modified-file refusal, safe uninstall, and preservation of unrelated files.

These tests model the host's image-first paste branch and draft/undo callbacks. Clipboard constructors and the DOM editing command are test doubles. They verify routing and lifecycle, rather than proving OS clipboard compatibility on every Hermes version.

## Real application verification

Environment: macOS, Microsoft Word for Mac, Hermes Desktop v0.19.1.

1. Installed the plugin through Hermes's disk-plugin directory.
2. Confirmed automatic loading and the enabled status button.
3. Opened a dedicated RTF test document in Microsoft Word containing three lines of Chinese text and a decimal amount.
4. Selected and copied the document text, then pasted into the Hermes chat composer with `⌘V`.
5. Observed editable text matching the document, no image attachment, and conversion count increasing from 0 to 1.
6. Pressed `⌘Z` once; the entire paste was removed and the composer became empty.
7. Closed the test document. No test chat message was sent.
8. The user independently confirmed that the original problem was resolved.

## Limits

- Other Hermes versions, Word table selections, and other operating systems were not manually tested.
- The separately launched Electron harness exited with SIGABRT in the restricted authoring environment. It is available for reproduction but was not marked passed.
- Runtime loading uses Hermes's supported disk-plugin mechanism; clipboard filtering relies on an internal DOM marker that may change in future versions.
- Future Hermes releases may change their own large-paste, reference, or undo behavior; this plugin delegates those operations to the host.

## 1.0.1 review

Two added regression tests first failed on 1.0.0: an unhandled forwarded event swallowed the original paste, and a non-cancelable original event caused duplicate handling. Version 1.0.1 forwards first and cancels the original only after the host prevents the replacement's default; it skips non-cancelable originals. Both regressions and all existing checks pass after the fix.

The separate real Word → Hermes verification above was performed on 1.0.0. Version 1.0.1 preserves the same accepted-event path and adds failure fallbacks; the revised version's automated results do not imply fresh manual verification unless recorded separately.
