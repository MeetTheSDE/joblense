const defaultKeywords = ["sponsorship", "citizen", "sponsor", "authorized"];

function getKeywords(callback) {
    chrome.storage.sync.get('keywords', (data) => {
        callback(data.keywords && data.keywords.length ? data.keywords : defaultKeywords);
    });
}

// Function to highlight target words in text nodes
function highlightTextNode(textNode, regex) {
    const parent = textNode.parentNode;

    if (
        !parent ||
        parent.classList?.contains("word-highlighted") ||  // skip if already highlighted
        parent.closest(".word-highlighted") ||            // prevent nested highlights
        parent.nodeName === "SCRIPT" ||
        parent.nodeName === "STYLE" ||
        parent.nodeName === "TEXTAREA" ||
        parent.isContentEditable
    ) return;

    const text = textNode.textContent;
    if (!regex.test(text)) return;  // no match, skip

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let hasMatch = false; // Flag to check if any match was made in this text node

    // Loop through matches and wrap them in <mark>
    text.replace(regex, (match, _, offset) => {
        if (offset > lastIndex) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        const mark = document.createElement("mark");
        mark.className = "word-highlighted";
        mark.textContent = match;
        frag.appendChild(mark);
        lastIndex = offset + match.length;
        hasMatch = true; // A match was found
    });

    if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (hasMatch) { // Only replace if a highlight was actually made
        parent.replaceChild(frag, textNode);
    }
}

// Walk through all text nodes in the root and highlight matches
function scanAndHighlight(root = document.body, regex) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        highlightTextNode(node, regex);
    }
}

// Function to scroll to the first highlighted element
function scrollToFirstMatch() {
    const firstMatch = document.querySelector(".word-highlighted");
    if (firstMatch) {
        // Using a timeout to ensure rendering is complete before scrolling
        setTimeout(() => {
            firstMatch.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100); // Small delay
    }
}

// Setup highlighting with dynamic content observation
function setupHighlighting(keywords) {
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    // Initial scan
    scanAndHighlight(document.body, regex);
    scrollToFirstMatch(); // Scroll after initial scan

    // Observe DOM changes and scan new content
    const observer = new MutationObserver(mutations => {
        let newContentAdded = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    setTimeout(() => scanAndHighlight(node, regex), 0);
                    newContentAdded = true;
                }
            }
        }
        // If new content was added, and it might contain highlights, re-evaluate scrolling
        if (newContentAdded) {
            // You might want to be careful here not to scroll too aggressively on every small change.
            // For page load/major changes, scrolling once is usually enough.
            // For dynamically loaded content, you might want to scroll only if the *first* match
            // is within the newly added content or if no match was previously found.
            // For simplicity here, we'll just re-evaluate if new content was added.
            // Consider adding a more sophisticated check if this causes undesired scrolling.
            setTimeout(scrollToFirstMatch, 200); // Give a bit more time for dynamic content to render and highlight
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listen for page navigation events (though for SPA, MutationObserver covers most)
    // This is more for traditional page reloads/navigations if the script runs again.
    // For single-page applications that might change content without a full reload
    // you might need more specific event listeners depending on the SPA framework.
}

// Start everything
getKeywords(setupHighlighting);
