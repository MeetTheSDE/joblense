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
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateKeywords",
                    keywords: newKeywords
                });
            });
        });
    });
});