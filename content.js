const defaultKeywords = ["sponsorship", "visa", "citizen", "sponsor", "authorized"];

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
  });

  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  parent.replaceChild(frag, textNode);
}

// Walk through all text nodes in the root and highlight matches
function scanAndHighlight(root = document.body, regex) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    highlightTextNode(node, regex);
  }
}

// Setup highlighting with dynamic content observation
function setupHighlighting(keywords) {
  const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

  // Initial scan
  scanAndHighlight(document.body, regex);

  // Observe DOM changes and scan new content
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          setTimeout(() => scanAndHighlight(node, regex), 0);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start everything
getKeywords(setupHighlighting);