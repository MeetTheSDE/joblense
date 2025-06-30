document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('keywords');
    const saveBtn = document.getElementById('save');

    // Load saved keywords
    chrome.storage.sync.get('keywords', (data) => {
        if (data.keywords) {
            textarea.value = data.keywords.join(', ');
        }
    });

    // Save keywords on button click
    saveBtn.addEventListener('click', () => {
        const newKeywords = textarea.value
            .split(',')
            .map(w => w.trim())
            .filter(Boolean);

        chrome.storage.sync.set({ keywords: newKeywords }, () => {
            alert('Keywords saved!');

            // Send message to active tab to update highlights
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateKeywords",
                    keywords: newKeywords
                });
            });
        });
    });
});