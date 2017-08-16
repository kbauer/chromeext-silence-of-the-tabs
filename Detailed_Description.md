;; -*- coding: utf-8; fill-column:99999; eval:(adaptive-wrap-prefix-mode +1) -*-

Text for the Chrome Webstore below

============================================================



!! BETA VERSION !!
==================

The extension is currently in testing. Some minor issues remain:

 - Sometimes tabs don't reload automatically when they should, and the user has to manually press the back button.
 - Using the "Suspend other Tabs" feature accidentally closes some tabs.



How Tabs are Stored
===================

The suspended tab is stored in a "Data-URL", which can be synchronized by Chrome's builtin Synchronization feature, such that the "Recent Tabs" feature on mobile devices and other PCs can be used. Since Data-URLs are local, no browsing information is sent to any server (other than, if enabled, Google's sync servers), so no privacy-issues should arise.

Tabs that have been suspended by the timer, or by "Suspend Other Tabs" will reload automatically, when they are revisted.



Comparison to similar Extensions
================================

Compared to "The Great Suspender", the Data-URLs enable synchronization with mobile devices, where the extension cannot be installed.

Compared to "TabMemFree", the Data-URLs prevent loss of browsing information, when something deletes the tab's history (e.g. due to a crash). 



Developer Mode
==============

The app includes a "Developer Mode" option, which adds a lot of debug information to the interface and to the JavaScript console.
