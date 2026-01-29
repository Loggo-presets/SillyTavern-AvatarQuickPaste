
const MODULE_NAME = 'AvatarQuickPaste';

/**
 * Finds the file input associated with the clicked element.
 * Supports: Character Avatar only
 */
function findAssociatedFileInput(element) {
    // Main Character Avatar (Sidebar)
    if (element.closest('#avatar_div')) {
        return document.getElementById('avatar_upload') ||
            document.getElementById('add_avatar_button') ||
            document.querySelector('#avatar_div input[type="file"]');
    }

    return null;
}

/**
 * Creates and shows the Quick Paste Modal.
 */
function openQuickPasteModal(targetInput) {
    const existing = document.getElementById('quick-paste-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'quick-paste-modal';
    modal.className = 'quick-paste-modal';

    const content = document.createElement('div');
    content.className = 'quick-paste-content';

    content.innerHTML = `
        <div class="quick-paste-icon">📋</div>
        <h2>Paste Avatar Here</h2>
        <p>Press <strong>Ctrl + V</strong> to paste image.</p>
        <div class="quick-paste-hint">(Click anywhere else to cancel)</div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cleanup();
    });

    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') cleanup();
    };
    document.addEventListener('keydown', escHandler);

    // Handle Paste
    const pasteHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        let blob = null;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                blob = items[i].getAsFile();
                break;
            }
        }

        if (blob) {
            applyFileToInput(blob, targetInput);
            cleanup();
        } else {
            toastr.warning('No image found in clipboard.', 'Avatar Quick Paste');
        }
    };

    document.addEventListener('paste', pasteHandler, { capture: true });

    function cleanup() {
        modal.remove();
        document.removeEventListener('paste', pasteHandler, { capture: true });
        document.removeEventListener('keydown', escHandler);
    }
}

/**
 * Assigns the blob to the input and triggers the change event.
 */
function applyFileToInput(blob, input) {
    const file = new File([blob], "pasted_avatar.png", { type: blob.type });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;

    // Trigger change event so ST detects the file and opens its crop/convert dialog
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);
}

// Use mousedown instead of click to intercept earlier
document.addEventListener('mousedown', (e) => {
    // Check for Ctrl Key + Left Click (button 0)
    if (!e.ctrlKey || e.button !== 0) return;

    // Check if target is relevant
    const targetInput = findAssociatedFileInput(e.target);

    if (targetInput) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => openQuickPasteModal(targetInput), 50);
    }
}, { capture: true });

console.log(`[${MODULE_NAME}] Initialized. Ctrl+Click character avatar to paste image.`);
