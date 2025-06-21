// This script is responsible for creating the panel in the DevTools window.
// It is loaded by devtools.html.

chrome.devtools.panels.create(
    "Request Resender", // Title of the panel
    "icons/icon48.png",   // Icon for the panel
    "panel.html",       // The HTML page for the panel's content
    (panel) => {
      // Code that runs when the panel is created (optional)
      console.log("Request Resender panel created");
    }
  );
  