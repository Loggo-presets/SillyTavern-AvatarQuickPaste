
const MODULE_NAME = 'AvatarQuickPaste';

// Selectors for avatars we want to enable Quick Paste on.
// 1. Sidebar Character Avatar: #avatar_div (the container) or #avatar_div img
// 2. User Settings Avatar: .user_avatar, #user_avatar_display
// 3. Character Edit Popup: #character_popup .avatar-container (approximate, refined below)
const TARGET_SELECTORS = [
    '#avatar_div',            // Main Sidebar Avatar Container
    '#avatar_div img',        // Main Sidebar Image
    '#user_avatar_display',   // User Settings Avatar Display
    '.user_avatar_display',   // Alternative class for user avatar
    '.avatar-uploader',       // Common class for uploaders
    '#character_popup_avatar',// Character Popup Avatar (if ID exists)
    // Refined: The standard ST character popup uploader usually involves a label or div wrapping the input
];

/**
 * Checks if the clicked element is a valid target for Quick Paste.
 * @param {HTMLElement} element 
 * @returns {HTMLElement|null} The associated file input or null if not valid.
 */
function findAssociatedFileInput(element) {
    // 1. Check Main Sidebar: #avatar_div
    const avatarDiv = element.closest('#avatar_div');
    if (avatarDiv) {
        // Try to find the input INSIDE the div first (most reliable)
        const innerInput = avatarDiv.querySelector('input[type="file"]');
        if (innerInput) return innerInput;

        // Fallback to known IDs if not found inside (legacy/variant support)
        const addBtn = document.getElementById('add_avatar_button');
        if (addBtn) return addBtn;

        const uploadBtn = document.getElementById('avatar_upload');
        if (uploadBtn) return uploadBtn;
    }

    // 2. Check Persona Management Avatar Button
    // Each persona card has its own avatar button and file input
    // This includes: the main button, toolbar buttons, and icon buttons
    const isPersonaButton = element.closest('#persona_set_image_button') ||
        element.id === 'persona_set_image_button' ||
        element.classList?.contains('menu_button.fa-image') ||
        (element.classList?.contains('fa-image') && element.closest('.rm_ch_create_block, [id*="persona"]'));

    if (isPersonaButton) {
        // Find the specific persona card that was clicked
        // The button structure is typically: persona card > button
        // We need to find the card first, then look for its specific input
        const personaCard = element.closest('.persona_card, [id*="persona"], .rm_ch_create_block, .rm_ch_create_block_avatar');
        if (personaCard) {
            // Look for the file input within THIS specific persona card
            const personaInput = personaCard.querySelector('input[type="file"]');
            if (personaInput) return personaInput;
        }

        // Alternative: the button might be a sibling or nearby element to the input
        // Search in parent containers going up a few levels
        let searchParent = element.parentElement;
        for (let i = 0; i < 5; i++) {
            if (!searchParent) break;
            const nearbyInput = searchParent.querySelector('input[type="file"]');
            if (nearbyInput) return nearbyInput;
            searchParent = searchParent.parentElement;
        }
    }

    // 3. Check User Settings
    if (element.closest('#user_avatar_display') || element.closest('.user_avatar_display')) {
        return document.getElementById('user_avatar_upload');
    }

    // 3. Check Character Edit Popup
    // The popup structure varies, but usually has an input[type=file] nearby or related.
    // We look for the popup container and then the avatar upload input within it.
    const popup = element.closest('#character_popup');
    if (popup) {
        return popup.querySelector('input[type="file"][accept*="image"]');
    }

    // 4. Generic "Persona" or other avatar containers
    // Recursive search up 4 levels to find a container that MIGHT hold a file input
    let parent = element;
    for (let i = 0; i < 4; i++) {
        if (!parent) break;

        // Look for typical wrapper classes
        if (parent.classList && (parent.classList.contains('avatar') || parent.classList.contains('avatar-container') || parent.id.includes('avatar'))) {
            // Found a potential container. Look inside for input.
            const input = parent.querySelector('input[type="file"]');
            if (input) return input;

            // Or look for a sibling input (common in some layouts)
            if (parent.parentElement) {
                const siblingInput = parent.parentElement.querySelector('input[type="file"]');
                if (siblingInput) return siblingInput;
            }
        }

        parent = parent.parentElement;
    }

    // 5. Special Case: Character Management / Import (avatar_load_preview)
    // The screenshot shows this maps to 'add_avatar_button'
    if (element.id === 'avatar_load_preview' || element.closest('#avatar_load_preview')) {
        const directInput = document.getElementById('add_avatar_button');
        if (directInput) return directInput;
    }

    // 6. Robust Label Check (The "Gold Standard")
    // If the clicked element is inside a label that points to a file input
    const parentLabel = element.closest('label');
    if (parentLabel && parentLabel.htmlFor) {
        const input = document.getElementById(parentLabel.htmlFor);
        if (input && input.type === 'file') return input;
    } else if (parentLabel) {
        // Label might contain the input directly without 'for'
        const innerInput = parentLabel.querySelector('input[type="file"]');
        if (innerInput) return innerInput;
    }

    // Fallback: Direct Label check (if we clicked the label itself)
    if (element.tagName === 'LABEL') {
        const inputId = element.getAttribute('for');
        if (inputId) {
            const input = document.getElementById(inputId);
            if (input && input.type === 'file') return input;
        }
    }

    return null;
}

/**
 * Creates and shows the Quick Paste Modal.
 * @param {HTMLElement} targetInput - The file input to receive the pasted file.
 */
function openQuickPasteModal(targetInput) {
    // Remove existing modal if any
    const existing = document.getElementById('quick-paste-modal');
    if (existing) existing.remove();

    // Create Modal Elements
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

    // Event Listeners for the Modal

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cleanup();
        }
    });

    // Handle Paste (The Core Logic)
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

    // Cleanup function
    function cleanup() {
        modal.remove();
        document.removeEventListener('paste', pasteHandler, { capture: true });
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

document.addEventListener('contextmenu', (e) => {
    // If we want to blocking context menu on ctrl+click, we might need this.
    // But let's stick to mousedown for now.
});

// Use mousedown instead of click to intercept earlier
document.addEventListener('mousedown', (e) => {
    // Check for Ctrl Key + Left Click (button 0)
    if (!e.ctrlKey || e.button !== 0) return;



    // Check if target is relevant
    const targetInput = findAssociatedFileInput(e.target);

    if (targetInput) {
        // Stop default behavior (e.g. opening file explorer or dragging)
        e.preventDefault();
        e.stopPropagation();



        // We use a slight timeout to ensure we don't conflict with other immediate handlers
        // and to allow the mouseup to clear cleanly if needed
        setTimeout(() => openQuickPasteModal(targetInput), 50);
    }
}, { capture: true });

console.log(`[${MODULE_NAME}] Initialized v1.3. Listening for Ctrl+LeftClick.`);
