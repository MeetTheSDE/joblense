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
		const words = textarea.value
		.split(',')
		.map(w => w.trim())
		.filter(Boolean);
		chrome.storage.sync.set({ keywords: words }, () => {
			alert('Keywords saved!');
		});
	});
});