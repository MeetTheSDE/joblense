const defaultKeywords = ["sponsorship", "citizen", "sponsor", "authorized"];

function getKeywords(callback) {
    chrome.storage.sync.get('keywords', (data) => {
        callback(data.keywords && data.keywords.length ? data.keywords : defaultKeywords);
    });
}

function highlightTextNode(textNode, regex) {
    const parent = textNode.parentNode;
    if (
        !parent ||
        parent.classList?.contains("word-highlighted") ||
        parent.closest(".word-highlighted") ||
        parent.nodeName === "SCRIPT" ||
        parent.nodeName === "STYLE" ||
        parent.nodeName === "TEXTAREA" ||
        parent.isContentEditable
    ) return;

    const text = textNode.textContent;
    if (!regex.test(text)) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let hasMatch = false;

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
        hasMatch = true;
    });

    if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    if (hasMatch) {
        parent.replaceChild(frag, textNode);
    }
}

function scanAndHighlight(root = document.body, regex) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        highlightTextNode(node, regex);
    }
}

function scrollToFirstMatch() {
    const firstMatch = document.querySelector(".word-highlighted");
    if (firstMatch) {
        setTimeout(() => {
            firstMatch.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }
}

function setupHighlighting(keywords) {
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    scanAndHighlight(document.body, regex);
    scrollToFirstMatch();

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
        if (newContentAdded) {
            setTimeout(scrollToFirstMatch, 200);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

getKeywords(setupHighlighting);
