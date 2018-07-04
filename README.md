<!-- -*- coding: utf-8 -*- -->

# Silence of the Tabs - Suspending inactive tabs since 2017

This chrome extension helps keeping your PC sane, by suspending
inactive tabs, saving memory, CPU cycles and stopping ads and videos
from making noise. 

## Comparison to other software

Alternatives include 
[The Great Suspender][1]
and 
[TabMemFree](2), 
the latter being the primary motivation for this addon.

### The Great Suspender

[The Great Suspender][1] uses the `chrome-extension://` protocol to
store parked tabs. This enables it's advanced features, but

  - Loses tabs, when uninstalling the extension
  - Breaks synchronization of opened tabs to Chrome on mobile devices

### TabMemFree

[TabMemFree][2] suspends tabs by redirecting to a webpage, which
simply toggles the `[Back]` button when the tab is focused again
(technically `history.back()`).

This mostly works well, but 

  - sometimes left me losing tabs after crashes.
  - might lose the required webpage at any time, given that
    the [Github repository][3] hasn't been active since 2012.
  - might break third-party synchronization services, that don't
    synchronize the full tab history.

In order to solve the perceived issues (and learn JavaScript along the
way) I chose to write an alternative from scratch, storing the
suspended tab in a `data:` url, which also encodes the full URL of the
parked tab. Since data-urls are local, no private information is
leaked.

  - Data URLs can be easily synced, as long as they are not too long 
    (see [Limitations](#limitations)).
  - Data URLs don't depend on external resources; The extension will
    work even without access to the internet.
    
Compared to [TamMemFree][2], this addon adds the subsequent features:

  - The extension-icon allows suspending the current tab, or all other
    tabs in the current window which can be suspended.

## Limitations
<a name='sec-limitations'>

Because chrome will only synchronize tabs with URLs up to some maximum
length, data-URLs must be kept short. This has prevented the inclusion
of a webpage-screenshot in the data url.

### Known Issues
<a name='knownissues'>

Currently, no major issues are known. 

If you want to report a new bug, check [the issue tracker][4].


## Change Log

**2018-07-04** (v0.2.2) Quick update with icon.png to conform with new policies
of Chrome extension store.

**2017-10-02** Bugfix: Suspended tabs didn't use history.back() if only one
entry before suspension.

**2017-08-15** (v0.2.1)

   
## Developer Notes

 - All code is contained in `main.js` for simplicity. 
 - Background page, options page, popup page, ... all delegate to
   `main.html` and thus `main.js`, which decide page-content and 
   activity based on the `#HashTag`.
 - The tab-suspension mechanism is handled entirely by
   `main.js/tabs.suspend`, allowing simple replacement.
 - As of writing, the addon code doesn't depend on any external
   libraries. It is pure [Vanilla JS](http://vanilla-js.com/), except
   for browser-provided APIs (`chrome.tabs`, `chrome.storage`).

## Open Ideas

 - **Screenshots**
   Sadly it seems that there is no viable way to include a screenshot.
   The [html2canvas](https://github.com/niklasvh/html2canvas) library
   allows creating the screenshot, 
   but currently no way 
   for including it into the suspension-page is known.
   Multiple variations have previously failed:
   
     1. **Blob URIs** The `data:` uri scheme counts as an isolated 
        origin, and therefore has no access to the blobs. 
     2. **Data URIs** Image can be included as `<img src='data:...'`>, 
        but this results in an extremely long page url
        for the "suspended tab" data URI, 
        which would break synchrnozation with mobile.
     3. **Image injection** With appropriate permissions, 
        `chrome.tabs.executeScript` could insert the data URI image
        from within the extension. Sadly, no combination of permissions 
        seems to allow content-script access to data URIs.
   

<!-- LINK TARGETS -->

[1]: https://chrome.google.com/webstore/detail/the-great-suspender/klbibkeccnjlkjkiokjodocebajanakg
[2]: https://chrome.google.com/webstore/detail/tabmemfree/pdanbocphccpmidkhloklnlfplehiikb
[3]: https://github.com/glukki/TabMemFree
[4]: https://github.com/kbauer/Silence-of-the-Tabs/issues
