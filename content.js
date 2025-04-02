console.log("Conventional Comments Helper v0.4.0 activated");

const CONVENTIONAL_COMMENT_LABELS = [
    { label: 'praise', desc: 'Highlight something positive.' },
    { label: 'nitpick', desc: 'Minor, non-blocking issues (style, naming...).' },
    { label: 'suggestion', desc: 'Suggest specific improvements.' },
    { label: 'issue', desc: 'Point out a blocking problem.' },
    { label: 'question', desc: 'Ask for clarification.' },
    { label: 'thought', desc: 'Share a reflection or idea.' },
    { label: 'chore', desc: 'Request a minor, non-code task.' },
    { label: 'if-minor', desc: 'Address if the effort is small.' }
];

const DECORATIONS = [
    { label: 'non-blocking', desc: 'Optional change, doesn\'t block merge.' },
    { label: 'blocking', desc: 'Must be addressed before merge.' },
    { label: 'if-minor', desc: 'Address if the effort is small.' }
];

// Helper function for badge colors (can be expanded)
function getBadgeColor(type) {
    switch (type) {
        case 'praise': return 'brightgreen';
        case 'nitpick': return 'yellow';
        case 'suggestion': return 'blue';
        case 'issue': return 'red';
        case 'question': return 'purple';
        case 'thought': return 'lightgrey';
        case 'chore': return 'orange';
        default: return 'lightgrey';
    }
}

// Helper function to create badge markdown
function createBadgeMarkdown(type, decoration) {
    const color = getBadgeColor(type);
    let label = type;
    let message = decoration || ''; // Use decoration as message if present
    let badgeUrl;

    // Simple URL encoding for badge parts
    const encode = (str) => encodeURIComponent(str.replace(/-/g, '--').replace(/_/g, '__')); // Shields.io escaping

    if (message) {
        // Format: https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>
        badgeUrl = `https://img.shields.io/badge/${encode(label)}-${encode(message)}-${color}`;
    } else {
        // Format: https://img.shields.io/badge/<LABEL>-<COLOR> (No message part)
        badgeUrl = `https://img.shields.io/badge/${encode(label)}-${color}`;
    }

    // Alt text for the image
    const altText = decoration ? `${type} (${decoration})` : type;

    return `![${altText}](${badgeUrl}) `; // Markdown image syntax with a trailing space
}

const TOOLBAR_ID_PREFIX = 'conventional-comments-toolbar-'; // Use prefix for uniqueness
const TOOLBAR_MARKER_CLASS = 'cc-toolbar-added';
const SETTINGS_MARKER_CLASS = 'cc-settings-injected'; // Marker for GitHub toolbars we've added settings to
const SETTINGS_BUTTON_ID_PREFIX = 'cc-settings-button-'; // Prefix for settings button IDs
const SETTINGS_DROPDOWN_ID_PREFIX = 'cc-settings-dropdown-'; // Prefix for settings dropdown IDs
let toolbarCounter = 0; // Ensure unique IDs if multiple textareas load simultaneously
let settingsCounter = 0; // Unique IDs for settings elements

// --- Global Selector for Textareas ---
const COMMENT_TEXTAREA_SELECTOR = 'textarea[aria-label*="comment"], textarea[name="comment[body]"], textarea[name="pull_request_review[body]"], textarea#new_commit_comment_field';

// --- LocalStorage Helpers ---
function getPrettifyState() {
    // Defaults to true if not set
    const storedValue = localStorage.getItem('conventionalCommentsHelper_prettifyEnabled');
    return storedValue === null ? true : storedValue === 'true';
}

function setPrettifyState(enabled) {
    localStorage.setItem('conventionalCommentsHelper_prettifyEnabled', enabled);
    console.log('Prettify state saved:', enabled);
}

// --- Core Function: Update Comment Prefix (Handles Text or Badge) ---
function updateCommentPrefix(textarea, newType, newDecoration) {
    const currentValue = textarea.value;
    const selectionStart = textarea.selectionStart;

    // Find the start index of the line the cursor is currently on
    let lineStartIndex = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;

    // Build the new prefix string based on Prettify state
    let newPrefixString;
    if (getPrettifyState()) {
        // Prettify ON: Use badge markdown
        newPrefixString = createBadgeMarkdown(newType, newDecoration);
        console.log("Prettify ON - Using badge:", newPrefixString);
    } else {
        // Prettify OFF: Use plain text
        newPrefixString = newType;
        if (newDecoration) {
            newPrefixString += `(${newDecoration})`;
        }
        newPrefixString += ': ';
        console.log("Prettify OFF - Using text:", newPrefixString);
    }

    // Regex to match existing conventional comment prefix (type + optional decoration OR badge)
    // Group 1: Plain text type OR Badge alt text type part
    // Group 3: Plain text decoration OR Badge alt text decoration part
    // Group 5: Full badge markdown ![...](...)
    const EXISTING_PREFIX_REGEX = /^(?:(\w+)(?:\((non-blocking|blocking|if-minor)\))?:\s*|(\!\[\((\w+)(?:\s*\((non-blocking|blocking|if-minor)\))?)?\]\(https?:\/\/img\.shields\.io\/badge\/.*?\)\s*)/;

    // Note: \u005B is [ and \u005D is ], escaped for regex safety.

    // Check if the current line already starts with a known prefix
    const currentLineContent = currentValue.substring(lineStartIndex); // Get text from line start onwards
    const match = currentLineContent.match(EXISTING_PREFIX_REGEX);

    let newValue;
    let newCursorPos;

    if (match) {
        // Existing prefix found, replace it
        const existingPrefix = match[0];
        const subject = currentLineContent.substring(existingPrefix.length);
        newValue = currentValue.substring(0, lineStartIndex) + newPrefixString + subject;
        newCursorPos = lineStartIndex + newPrefixString.length;
        console.log(`Replaced prefix: "${existingPrefix.trim()}" -> "${newPrefixString.trim()}"`);
    } else {
        // No existing prefix, insert the new one
        newValue = currentValue.substring(0, lineStartIndex) + newPrefixString + currentValue.substring(lineStartIndex);
        newCursorPos = lineStartIndex + newPrefixString.length;
        console.log(`Inserted prefix: "${newPrefixString.trim()}"`);
    }

    // Update the textarea value
    textarea.value = newValue;

    // Set cursor position after the prefix
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;

    // Dispatch events for framework compatibility & placeholder handling
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    textarea.focus();
}

// --- Settings UI --- //

// Function to create the settings dropdown HTML
function createSettingsDropdown(id, initialState) {
    const dropdown = document.createElement('div');
    dropdown.id = id;
    dropdown.classList.add('cc-settings-dropdown');
    // Start hidden, CSS will handle transition
    dropdown.style.visibility = 'hidden';
    dropdown.style.opacity = '0';

    const label = document.createElement('label');
    label.classList.add('cc-settings-toggle-label');
    label.textContent = 'Prettify: ';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = initialState;
    toggle.classList.add('cc-settings-toggle');

    toggle.addEventListener('change', (event) => {
        setPrettifyState(event.target.checked);
        // Optional: Add visual feedback or trigger other actions if needed
    });

    label.appendChild(toggle);
    // Simple visual indicator for the switch (can be enhanced with CSS)
    const switchSpan = document.createElement('span');
    switchSpan.classList.add('cc-settings-toggle-switch');
    label.appendChild(switchSpan);

    dropdown.appendChild(label);
    return dropdown;
}

// Function to create the settings button
function createSettingsButton(textarea, toolbarId) {
    const button = document.createElement('button');
    button.id = `${SETTINGS_BUTTON_ID_PREFIX}${settingsCounter}`;
    button.type = 'button';
    button.classList.add('cc-settings-button', 'tooltipped', 'tooltipped-n'); // Use GitHub tooltip classes
    button.setAttribute('aria-label', 'Conventional Comments Settings');
    button.innerHTML = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-gear">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm6.5-5.25a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V3.5a.75.75 0 0 1 .75-.75ZM8 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm-5.01-.031a3 3 0 1 1 5.05 2.471 3.51 3.51 0 0 0-5.051-2.47Z"></path>
        </svg>`; // Simple gear icon placeholder

    const dropdownId = `${SETTINGS_DROPDOWN_ID_PREFIX}${settingsCounter}`;
    const prettifyEnabled = getPrettifyState();
    const dropdown = createSettingsDropdown(dropdownId, prettifyEnabled);

    // Append dropdown to the body initially to handle potential overflow issues
    // It will be positioned relative to the button via CSS
    document.body.appendChild(dropdown);

    button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering outside click listener immediately
        const currentlyActive = dropdown.classList.contains('active');
        closeAllSettingsDropdowns(); // Close others
        if (!currentlyActive) {
            // Position and show
            const btnRect = button.getBoundingClientRect();
            dropdown.style.top = `${window.scrollY + btnRect.bottom + 5}px`; // Position below button
            dropdown.style.left = `${window.scrollX + btnRect.left}px`; // Align left
            dropdown.style.visibility = 'visible';
            dropdown.style.opacity = '1';
            dropdown.classList.add('active');
        }
    });

    settingsCounter++;
    return { button, dropdown }; // Return both for management
}

// Function to close all open settings dropdowns
function closeAllSettingsDropdowns() {
    document.querySelectorAll('.cc-settings-dropdown.active').forEach(dd => {
        dd.style.visibility = 'hidden';
        dd.style.opacity = '0';
        dd.classList.remove('active');
    });
}

// Add listener to close dropdowns when clicking outside
document.addEventListener('click', closeAllSettingsDropdowns);

// --- Core Function: Render Toolbar UI based on State ---
function renderToolbar(toolbar, textarea) {
    // Read state from toolbar's dataset
    const state = toolbar.dataset.state || 'initial';
    const selectedType = toolbar.dataset.selectedType || null;
    const selectedDecoration = toolbar.dataset.selectedDecoration || null;

    toolbar.innerHTML = ''; // Clear previous content

    // --- State 1: Initial or Change Type ---
    if (state === 'initial' || state === 'changeType') {
        console.log(`renderToolbar (${toolbar.id}): state is '${state}', adding type buttons.`);
        CONVENTIONAL_COMMENT_LABELS.forEach(item => {
            const button = document.createElement('button');
            button.textContent = item.label;
            button.title = item.desc;
            button.type = 'button';
            button.classList.add('cc-button', `cc-button-${item.label}`);

            // Highlight if it's the currently selected one during 'changeType'
            if (state === 'changeType' && item.label === selectedType) {
                button.classList.add('cc-type-selected-highlight');
            }

            // --- Type Button Click Handler ---
            button.addEventListener('click', () => {
                const newSelectedType = item.label;
                // Update state: Now a type is selected, reset decoration
                toolbar.dataset.selectedType = newSelectedType;
                toolbar.dataset.selectedDecoration = ''; // Reset decoration
                toolbar.dataset.state = 'typeSelected';

                // Update the comment in the textarea
                updateCommentPrefix(textarea, newSelectedType, null); // Pass null for decoration initially

                // Re-render the toolbar for the new state
                renderToolbar(toolbar, textarea);
            });
            toolbar.appendChild(button);
        });
    }
    // --- State 2: Type Selected (Show Type > Decorations) ---
    else if (state === 'typeSelected') {
        // Display the selected type (as a clickable label)
        const typeLabel = document.createElement('span'); // Using span now
        typeLabel.textContent = selectedType;
        typeLabel.title = `Click to change type from '${selectedType}'`;
        typeLabel.classList.add('cc-selected-type-label');
        typeLabel.dataset.type = selectedType; // Store type for potential use

        // --- Selected Type Click Handler (to initiate change) ---
        typeLabel.addEventListener('click', () => {
            // Don't change the comment prefix here, just the UI state
            toolbar.dataset.state = 'changeType';
            // No need to change selectedType/Decoration yet
            renderToolbar(toolbar, textarea);
        });
        toolbar.appendChild(typeLabel);

        // Separator
        const separator = document.createElement('span');
        separator.textContent = ' > ';
        separator.classList.add('cc-separator');
        toolbar.appendChild(separator);

        // Display decoration buttons
        DECORATIONS.forEach(decItem => {
            const button = document.createElement('button');
            button.textContent = decItem.label;
            button.title = decItem.desc;
            button.type = 'button';
            button.classList.add('cc-button', `cc-button-dec-${decItem.label}`);

            // Highlight if it's the currently selected decoration
            if (decItem.label === selectedDecoration) {
                button.classList.add('cc-decoration-selected-highlight');
            }

            // --- Decoration Button Click Handler ---
            button.addEventListener('click', () => {
                const newSelectedDecoration = decItem.label;
                // Update state: Keep 'typeSelected', update decoration
                toolbar.dataset.selectedDecoration = newSelectedDecoration;
                // State remains 'typeSelected'

                // Update the comment prefix with the new decoration
                updateCommentPrefix(textarea, selectedType, newSelectedDecoration);

                // Re-render toolbar to update decoration highlight
                renderToolbar(toolbar, textarea);
            });
            toolbar.appendChild(button);
        });
    }
}

// --- Function to Initialize Toolbar for a Textarea ---
function initializeToolbarForTextarea(textarea) {
    const textareaId = textarea.id || textarea.name || `cc-textarea-${Math.random().toString(36).substring(2, 9)}`; // Ensure some ID
    if (!textarea.id) textarea.id = textareaId; // Assign ID if it doesn't have one

    // Use marker class on textarea to prevent re-initialization (like original version)
    if (textarea.classList.contains(TOOLBAR_MARKER_CLASS)) {
        // console.log(`initializeToolbarForTextarea: Textarea ${textarea.id} already marked.`);
        // Ensure it's visible if somehow hidden (shouldn't happen with new logic)
        const existingToolbar = textarea.parentNode?.querySelector(`.cc-toolbar[data-textarea-id="${textarea.id}"]`);
        if (existingToolbar) existingToolbar.style.display = 'flex';
        return;
    }

    console.log(`Initializing Conventional Comments Toolbar for: ${textarea.id}`);

    const toolbar = document.createElement('div');
    // Assign unique ID AND a way to link it back to the textarea
    toolbar.id = `${TOOLBAR_ID_PREFIX}${toolbarCounter++}`;
    toolbar.dataset.textareaId = textarea.id; // Link to textarea using its ID
    toolbar.classList.add('cc-toolbar');
    // Initialize state
    toolbar.dataset.state = 'initial'; // Start in initial state
    toolbar.dataset.selectedType = '';
    toolbar.dataset.selectedDecoration = '';

    // Set initial visibility - ALWAYS VISIBLE NOW
    toolbar.style.display = 'flex';

    // Initial rendering
    console.log(` -> Calling renderToolbar for ${toolbar.id} (textarea: ${textarea.id})`);
    renderToolbar(toolbar, textarea);

    // Insert toolbar *before* the textarea
    textarea.parentNode?.insertBefore(toolbar, textarea); // Safer insertion

    textarea.classList.add(TOOLBAR_MARKER_CLASS); // Mark textarea
}

// --- Function to Inject Settings Button --- //
function injectSettingsButton(textarea) {
    // Find the associated GitHub Markdown toolbar
    // This selector might need adjustment based on GitHub's current structure.
    // Common patterns: `textarea.previousElementSibling`, specific classes like `.md-header`, traversing up to a common parent.
    // Let's try finding a toolbar related to the textarea's ID or name, or a nearby toolbar element.
    let githubToolbar = textarea.closest('form')?.querySelector('markdown-toolbar, .ActionBar'); // Look within the form for toolbar elements

    // Fallback: Look for toolbar immediately preceding the textarea's container (common in PR reviews)
    if (!githubToolbar) {
        const parentWrapper = textarea.closest('.comment-form-textarea-wrapper'); // Adjust selector if needed
        if (parentWrapper && parentWrapper.previousElementSibling?.matches('markdown-toolbar, .ActionBar')) {
            githubToolbar = parentWrapper.previousElementSibling;
        }
    }
    // Fallback 2: Look for toolbar inside a common ancestor like .timeline-comment-header
    if (!githubToolbar) {
        const header = textarea.closest('.js-comment-container, .timeline-comment') ?.querySelector('.timeline-comment-header .ActionBar');
        if (header) {
            githubToolbar = header;
        }
    }

    if (githubToolbar && !githubToolbar.classList.contains(SETTINGS_MARKER_CLASS)) {
        console.log("GitHub Toolbar found, injecting settings button:", githubToolbar);

        // Find the controls container within the toolbar (again, selector might need updates)
        let controlsContainer = githubToolbar.querySelector('.ActionBar-item-container'); // Common in newer UIs
        if (!controlsContainer) {
            controlsContainer = githubToolbar.querySelector('.md-header-controls'); // Older pattern
        }
        if (!controlsContainer) {
            controlsContainer = githubToolbar; // Default to toolbar itself if no specific container found
        }

        const { button, dropdown } = createSettingsButton(textarea);

        // Wrap button in a container if needed for styling/layout within GitHub's toolbar
        const buttonWrapper = document.createElement('div');
        // Try to mimic GitHub's own button wrappers if possible
        buttonWrapper.classList.add('ActionBar-item', 'cc-settings-item');
        buttonWrapper.appendChild(button);

        controlsContainer.appendChild(buttonWrapper); // Append the wrapped button
        githubToolbar.classList.add(SETTINGS_MARKER_CLASS); // Mark toolbar as processed

        // Add listener to the toggle - NOW ONLY SAVES STATE, DOES NOT HIDE/SHOW TOOLBAR
        const toggle = dropdown.querySelector('.cc-settings-toggle');
        const textareaId = textarea.id; // Capture textarea ID for the listener
        toggle.addEventListener('change', (event) => {
            setPrettifyState(event.target.checked); // Save state to localStorage
            console.log(`Toggle changed for ${textareaId}. Prettify Enabled: ${event.target.checked}`);
            // NO LONGER MANIPULATES TOOLBAR DISPLAY HERE
        });
    } else if (!githubToolbar) {
        // console.log("Could not find GitHub toolbar for textarea:", textarea);
    }
}

// --- Main Execution & Mutation Observer ---

// Find all comment textareas and process them
function processCommentAreas() {
    document.querySelectorAll(COMMENT_TEXTAREA_SELECTOR).forEach(textarea => {
        // Ensure textarea has an ID for reliable association
        if (!textarea.id) {
            textarea.id = textarea.name || `cc-textarea-${Math.random().toString(36).substring(2, 9)}`;
        }
        // Inject the settings button next to GitHub's toolbar
        // This happens first so the toggle listener is ready
        injectSettingsButton(textarea);

        // Initialize the toolbar (function itself checks marker class and prettify state for visibility)
        initializeToolbarForTextarea(textarea);
    });
}

processCommentAreas(); // Initial run

const observer = new MutationObserver((mutationsList) => {
    let needsProcessing = false;
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                // Check if the added node is a textarea or contains one
                if (node.nodeType === 1) { // Check if it's an element
                    if (node.matches(COMMENT_TEXTAREA_SELECTOR) || node.querySelector(COMMENT_TEXTAREA_SELECTOR)) {
                        needsProcessing = true;
                    }
                    // Also check if a relevant toolbar was added dynamically
                    if (node.matches('markdown-toolbar, .ActionBar, .md-header') || node.querySelector('markdown-toolbar, .ActionBar, .md-header')) {
                        needsProcessing = true;
                    }
                }
            });
        }
    }
    if (needsProcessing) {
        // console.log("Mutation detected, reprocessing comment areas...");
        processCommentAreas();
    }
});
observer.observe(document.body, { childList: true, subtree: true });