# Avatar Quick Paste

Small extension for SillyTavern that allows you to paste avatars directly from your clipboard without saving files locally first.

## Features

- **Ctrl + Click** on any avatar (Main Sidebar, User Profile, Character Edit) to open a "Quick Paste" modal.
- Paste your image (Ctrl+V) into the modal.
- SillyTavern's native cropping/convert window will open automatically.

## How to Use

1. Copy an image to your clipboard (e.g. from a web browser or image editor).
2. Hold **Ctrl** and **Left Click** on the avatar you want to change (e.g., the large character image on the left).
3. A dark overlay will appear saying "Paste Avatar Here".
4. Press **Ctrl + V**.
5. The extension will pass the image to SillyTavern, allowing you to crop and confirm the change.

## Compatibility

- Works with the specific ID/Class structure of specific SillyTavern versions. 
- Targets: `#avatar_div`, `#user_avatar_display`, `#character_popup`.
