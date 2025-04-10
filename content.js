

const CONVENTIONAL_COMMENT_LABELS = [
    { label: 'praise', desc: 'Highlight something positive.', color: '#28A745' }, // Green - Standard for success/positive feedback
    { label: 'nitpick', desc: 'Minor, non-blocking issues (style, naming...).', color: '#F59E0B' }, // Amber/Dark Yellow - Suggests caution, minor warning
    { label: 'suggestion', desc: 'Suggest specific improvements.', color: '#3B82F6' }, // Blue - Often used for informational/suggestions
    { label: 'issue', desc: 'Point out a blocking problem.', color: '#EF4444' }, // Red - Standard for errors/critical problems
    { label: 'question', desc: 'Ask for clarification.', color: '#8B5CF6' }, // Violet/Purple - Distinct color often used for queries/info
    { label: 'thought', desc: 'Share a reflection or idea.', color: '#6B7280' }, // Cool Gray - Neutral, less prominent, for reflections
    { label: 'chore', desc: 'Request a minor, non-code task.', color: '#F97316' }, // Orange - Action-oriented but distinct from critical red/amber
];

const DECORATIONS = [
    { label: 'non-blocking', desc: 'Optional change, doesn\'t block merge.', color: '#9CA3AF' }, // Light/Medium Gray - Indicates reduced severity/optionality
    { label: 'blocking', desc: 'Must be addressed before merge.', color: '#374151' }, // Dark Gray/Charcoal - Serious, indicates high importance/blocker
    { label: 'if-minor', desc: 'Address if the effort is small.', color: '#14B8A6' } // Teal - Represents conditionality, distinct suggestion tone
];

// Helper function for badge colors using hex values
function getBadgeColor(type) {
    // Find the label object
    const label = CONVENTIONAL_COMMENT_LABELS.find(l => l.label === type);
    // Return the color if found, otherwise default to gray
    return label ? label.color.substring(1) : '6B7280'; // Remove # from hex color for shields.io
}

// Helper function to create badge markdown
function createBadgeMarkdown(type, decoration) {
    // Get the label color (without #)
    const labelColor = getBadgeColor(type);
    let label = type;
    let message = decoration || ''; // Use decoration as message if present
    let decorationColor = '';
    
    // Get decoration color if a decoration is specified
    if (decoration) {
        const decorObj = DECORATIONS.find(d => d.label === decoration);
        if (decorObj) {
            decorationColor = decorObj.color.substring(1); // Remove # from hex color
        }
    }
    
    let badgeUrl;

    // Simple URL encoding for badge parts
    const encode = (str) => encodeURIComponent(str.replace(/-/g, '--').replace(/_/g, '__')); // Shields.io escaping

    if (message) {
        // If we have both a label and decoration with their colors
        if (decorationColor) {
            // Format: https://img.shields.io/badge/<LABEL>-<MESSAGE>-<DECORATION_COLOR>?labelColor=<LABEL_COLOR>
            // Use decoration color for the badge background and labelColor for the label part
            badgeUrl = `https://img.shields.io/badge/${encode(label)}-${encode(message)}-${decorationColor}?labelColor=${labelColor}`;
        } else {
            // If decoration has no specific color, use the label color for the whole badge
            badgeUrl = `https://img.shields.io/badge/${encode(label)}-${encode(message)}-${labelColor}`;
        }
    } else {
        // Format: https://img.shields.io/badge/<LABEL>-<COLOR> (No message part)
        badgeUrl = `https://img.shields.io/badge/${encode(label)}-${labelColor}`;
    }

    // Create the badge markdown
    const badge = `![](${badgeUrl})`; // Simplified alt text since we're wrapping in a link

    // Always create pullpo.io URL with query params
    // If decoration exists, include it, otherwise just use the label
    const pullpoUrl = `https://pullpo.io/cc?l=${encodeURIComponent(type)}${decoration ? `&d=${encodeURIComponent(decoration)}` : ''}`;
    return `[${badge}](${pullpoUrl}) `; // Wrap badge in link with trailing space
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

}

// --- Core Function: Update Comment Prefix (Handles Text or Badge) ---
function updateCommentPrefix(textarea, newType, newDecoration) {
    const currentValue = textarea.value;
    const originalSelectionStart = textarea.selectionStart; // Store original cursor position
    const originalSelectionEnd = textarea.selectionEnd; // Store original selection end (if any)

    // Find the start index of the line the cursor is currently on
    const lineStartIndex = 0; // ALWAYS TARGET THE BEGINNING OF THE TEXTAREA

    // Regex to match existing conventional comment prefix (type + optional decoration OR badge OR linked badge)
    // Group 1: Plain text type
    // Group 2: Plain text decoration
    // Group 3-4: Not used in new format
    // The regex now handles three formats:
    // 1. Plain text: type(decoration): 
    // 2. Badge: ![...](https://img.shields.io/...)
    // 3. Linked badge: [![](https://img.shields.io/...)](https://pullpo.io/...)
    const EXISTING_PREFIX_REGEX = /^(?:(\w+)(?:\((non-blocking|blocking|if-minor)\))?:|(?:\[)?!\[(?:\w+)?(?:\s*\((?:non-blocking|blocking|if-minor)\))?\]\(https?:\/\/img\.shields\.io\/badge\/.*?\)(?:\]\(https?:\/\/pullpo\.io\/cc\?.*?\))?)/;

    // Check if the current line already starts with a known prefix
    const currentLineContent = currentValue.substring(lineStartIndex); // Get text from line start onwards

    const match = currentLineContent.match(EXISTING_PREFIX_REGEX);

    let existingPrefix = '';
    let subject = currentLineContent; // Default to the whole line content
    let isReplacing = false;

    if (match) {
        // Existing prefix found, replace it
        isReplacing = true;
        existingPrefix = match[0]; // The full matched prefix (text or badge)
        subject = currentLineContent.substring(existingPrefix.length); // Content after the prefix

    } else {
        // No existing prefix, insert the new one

    }

    // Determine the final prefix string based on current state
    let finalPrefixString;
    if (getPrettifyState()) {
        finalPrefixString = createBadgeMarkdown(newType, newDecoration);

    } else {
        finalPrefixString = newType;
        if (newDecoration) {
            finalPrefixString += `(${newDecoration})`;
        }
        finalPrefixString += ': ';

    }

    // Construct the new value by replacing the old prefix (if any) with the new one
    // In prettify mode, ensure there's a newline after the badge
    let newValue;
    if (getPrettifyState() && newType && newType !== '') {
        if (!subject.startsWith('\n')) {
            newValue = finalPrefixString + '\n' + subject.trimStart();
        } else {
            newValue = finalPrefixString + subject;
        }
    } else {
        newValue = finalPrefixString + subject; // Since lineStartIndex is 0
    }

    // Calculate new cursor position based on the state
    let newSelectionStart = 0;
    let newSelectionEnd = 0;
    
    // If we're removing the label (finalPrefixString is empty)
    if (!newType || newType === '') {
        // Position cursor at the beginning of the first line
        newSelectionStart = 0;
        newSelectionEnd = 0;
    } else if (getPrettifyState()) {
        // In prettify mode with badge
        // Add a newline after the badge if there isn't one already
        if (!subject.startsWith('\n')) {
            subject = '\n' + subject;
        }
        // Position cursor at the beginning of the line after the badge
        newSelectionStart = finalPrefixString.length + 1; // +1 for the newline
        newSelectionEnd = newSelectionStart;
    } else {
        // In text mode
        // Position cursor after the prefix
        newSelectionStart = finalPrefixString.length;
        newSelectionEnd = newSelectionStart;
    }

    // Update the textarea value
    textarea.value = newValue;

    // Set cursor position based on our calculations
    textarea.selectionStart = Math.max(0, newSelectionStart);
    textarea.selectionEnd = Math.max(0, newSelectionEnd);

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
   <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" class="">
<path d="M7.375 7.75C7.375 7.84946 7.33549 7.94484 7.26517 8.01517C7.19484 8.08549 7.09946 8.125 7 8.125C6.90054 8.125 6.80516 8.08549 6.73484 8.01517C6.66451 7.94484 6.625 7.84946 6.625 7.75C6.625 7.65055 6.66451 7.55516 6.73484 7.48484C6.80516 7.41451 6.90054 7.375 7 7.375C7.09946 7.375 7.19484 7.41451 7.26517 7.48484C7.33549 7.55516 7.375 7.65055 7.375 7.75ZM7.375 7.75H7M11.125 7.75C11.125 7.84946 11.0855 7.94484 11.0152 8.01517C10.9448 8.08549 10.8495 8.125 10.75 8.125C10.6505 8.125 10.5552 8.08549 10.4848 8.01517C10.4145 7.94484 10.375 7.84946 10.375 7.75C10.375 7.65055 10.4145 7.55516 10.4848 7.48484C10.5552 7.41451 10.6505 7.375 10.75 7.375C10.8495 7.375 10.9448 7.41451 11.0152 7.48484C11.0855 7.55516 11.125 7.65055 11.125 7.75ZM11.125 7.75H10.75M14.875 7.75C14.875 7.84946 14.8355 7.94484 14.7652 8.01517C14.6948 8.08549 14.5995 8.125 14.5 8.125C14.4005 8.125 14.3052 8.08549 14.2348 8.01517C14.1645 7.94484 14.125 7.84946 14.125 7.75C14.125 7.65055 14.1645 7.55516 14.2348 7.48484C14.3052 7.41451 14.4005 7.375 14.5 7.375C14.5995 7.375 14.6948 7.41451 14.7652 7.48484C14.8355 7.55516 14.875 7.65055 14.875 7.75ZM14.875 7.75H14.5M1 10.76C1 12.36 2.123 13.754 3.707 13.987C4.794 14.147 5.892 14.27 7 14.356V19L11.184 14.817C11.3912 14.6107 11.6697 14.4918 11.962 14.485C13.9136 14.437 15.8605 14.2707 17.792 13.987C19.377 13.754 20.5 12.361 20.5 10.759V4.741C20.5 3.139 19.377 1.746 17.793 1.513C15.461 1.17072 13.107 0.99926 10.75 1C8.358 1 6.006 1.175 3.707 1.513C2.123 1.746 1 3.14 1 4.741V10.759V10.76Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> 
</svg>
`

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
                const currentSelectedType = toolbar.dataset.selectedType;
                
                // Toggle off if clicking the same type
                if (currentSelectedType === item.label) {
                    // Clear type and decoration
                    toolbar.dataset.selectedType = '';
                    toolbar.dataset.selectedDecoration = '';
                    toolbar.dataset.state = 'initial';
                    
                    // Remove the prefix from textarea - handles both text format and badge format (including linked badges)
                    textarea.value = textarea.value.replace(/^(?:(?:\w+)(?:\((?:non-blocking|blocking|if-minor)\))?:|(?:\[)?!\[(?:[^\]]*?)\]\(https?:\/\/img\.shields\.io\/badge\/[^)]*?\)(?:\]\(https?:\/\/pullpo\.io\/cc\?[^)]*?\))?)\s*/, '');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    // Select new type
                    const newSelectedType = item.label;
                    toolbar.dataset.selectedType = newSelectedType;
                    toolbar.dataset.selectedDecoration = ''; // Reset decoration
                    toolbar.dataset.state = 'typeSelected';

                    // Update the comment in the textarea
                    updateCommentPrefix(textarea, newSelectedType, null);
                }

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
                const currentSelectedDecoration = toolbar.dataset.selectedDecoration;
                
                // Toggle off if clicking the same decoration
                if (currentSelectedDecoration === decItem.label) {
                    toolbar.dataset.selectedDecoration = '';
                    updateCommentPrefix(textarea, selectedType, null);
                } else {
                    // Select new decoration
                    const newSelectedDecoration = decItem.label;
                    toolbar.dataset.selectedDecoration = newSelectedDecoration;
                    updateCommentPrefix(textarea, selectedType, newSelectedDecoration);
                }

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

            // NO LONGER MANIPULATES TOOLBAR DISPLAY HERE
        });
    } else if (!githubToolbar) {

    }
}

// --- Main Execution & Mutation Observer ---

// Find all comment textareas and process them
function processCommentAreas() {

    // Enhanced selector to target known GitHub comment textareas
    const commentTextareas = document.querySelectorAll(
        'textarea[name="comment[body]"]:not(.cc-toolbar-added), ' + // Standard comments
        'textarea[id^="pull_request_review_body_"]:not(.cc-toolbar-added), ' + // PR review comments
        'textarea[id="commit-description-textarea"]:not(.cc-toolbar-added)' // Commit descriptions
    );

    

    commentTextareas.forEach(textarea => {
        if (!textarea || textarea.classList.contains(TOOLBAR_MARKER_CLASS)) {
            return; // Skip if already processed or not found
        }

        // Remove placeholder text and element
        textarea.placeholder = 'Add your comment here...';
        
        // Find and remove the placeholder element if it exists
        const commentBoxContainer = textarea.closest('.CommentBox-container');
        if (commentBoxContainer) {
            const placeholderElement = commentBoxContainer.querySelector('.CommentBox-placeholder');
            if (placeholderElement) {
                placeholderElement.remove();
            }
        }

        // Ensure textarea has an ID for association
        if (!textarea.id) {
            textarea.id = `cc-textarea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        }

        injectSettingsButton(textarea); // Inject settings
        initializeToolbarForTextarea(textarea); // Initialize toolbar (visibility depends on prettify state)
    });
}

// Enhanced initialization with multiple strategies
let lastUrl = location.href;
let isProcessing = false;

// Function to handle URL changes
function handleUrlChange() {

    // Reset processing flag
    isProcessing = false;
    // Multiple attempts to catch late-loaded content
    processCommentAreas();
    setTimeout(processCommentAreas, 500);
    setTimeout(processCommentAreas, 1000);
    setTimeout(processCommentAreas, 2000);
}

// Listen for History API changes
window.addEventListener('popstate', handleUrlChange);
window.addEventListener('pushstate', handleUrlChange);
window.addEventListener('replacestate', handleUrlChange);

// Intercept History API methods
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
};

history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
};

// Periodic check for new textareas
setInterval(() => {
    if (!isProcessing) {
        const textareas = document.querySelectorAll(
            'textarea[name="comment[body]"]:not(.cc-toolbar-added), ' +
            'textarea[id^="pull_request_review_body_"]:not(.cc-toolbar-added), ' +
            'textarea[id="commit-description-textarea"]:not(.cc-toolbar-added)'
        );
        if (textareas.length > 0) {

            processCommentAreas();
        }
    }
}, 1000);

// Process comment areas on initial load
processCommentAreas();

// Main observer for dynamic content
const observer = new MutationObserver((mutationsList) => {
    if (isProcessing) return;
    isProcessing = true;
    
    // Use setTimeout to debounce multiple rapid changes
    setTimeout(() => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node itself is a relevant textarea
                        if (node.matches('textarea[name="comment[body]"]') ||
                            node.matches('textarea[id^="pull_request_review_body_"]') ||
                            node.matches('textarea[id="commit-description-textarea"]')) {
                            if (!node.classList.contains(TOOLBAR_MARKER_CLASS)) {

                                node.placeholder = ''; // Remove placeholder
                                injectSettingsButton(node);
                                initializeToolbarForTextarea(node);
                            }
                        } else if (node.querySelectorAll) {
                            // Check if the added node contains relevant textareas
                            const textareas = node.querySelectorAll(
                                'textarea[name="comment[body]"]:not(.cc-toolbar-added), ' +
                                'textarea[id^="pull_request_review_body_"]:not(.cc-toolbar-added), ' +
                                'textarea[id="commit-description-textarea"]:not(.cc-toolbar-added)'
                            );
                            textareas.forEach(textarea => {

                                // Find and remove the placeholder element if it exists
                                const commentBoxContainer = textarea.closest('.CommentBox-container');
                                if (commentBoxContainer) {
                                    const placeholderElement = commentBoxContainer.querySelector('.CommentBox-placeholder');
                                    if (placeholderElement) {
                                        placeholderElement.remove();
                                    }
                                }
                                textarea.placeholder = 'Add your comment here...'; // Remove placeholder
                                injectSettingsButton(textarea);
                                initializeToolbarForTextarea(textarea);
                            });
                        }
                    }
                }
            }
        }
        isProcessing = false;
    }, 100);
});

// Configure the observer with more specific targeting
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id']
});

// Force check when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {

        processCommentAreas();
    }
});