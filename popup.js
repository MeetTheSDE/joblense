document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('keywords');
    const saveBtn = document.getElementById('save');
    const statusDiv = document.getElementById('status');

    // Load saved keywords
    chrome.storage.sync.get('keywords', (data) => {
        if (data.keywords) {
            textarea.value = data.keywords.join(', ');
        }
    });

    saveBtn.addEventListener('click', () => {
        const newKeywords = textarea.value
            .split(',')
            .map(w => w.trim())
            .filter(w => w.length > 1);

        chrome.storage.sync.set({ keywords: newKeywords }, () => {
            statusDiv.textContent = 'Keywords saved!';
            statusDiv.style.opacity = 1;

            setTimeout(() => {
                statusDiv.style.opacity = 0;
            }, 2000);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                const url = tab?.url || "";

                const isLinkedInJobs = url.startsWith("https://www.linkedin.com/jobs");

                if (!isLinkedInJobs) {
                    showStatus("Only works on LinkedIn Jobs pages.", "red");
                    return;
                }

                chrome.tabs.sendMessage(tab.id, {
                    action: "updateKeywords",
                    keywords: newKeywords
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        if (chrome.runtime.lastError.message.includes("Receiving end does not exist.")) {
                            console.warn("Content script not present — ignoring.");
                        } else {
                            console.warn("messaging error:", chrome.runtime.lastError.message);
                        }
                        return;
                    }
                    showStatus("Keywords saved!");
                    chrome.tabs.reload(tab.id);
                });
            });
        });
    });
    function showStatus(msg, color = "green") {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = msg;
        statusDiv.style.color = color;
        statusDiv.style.opacity = 1;
        setTimeout(() => statusDiv.style.opacity = 0, 2000);
    }
});