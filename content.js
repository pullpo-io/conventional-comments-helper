console.log("Conventional Comments Helper v0.3.0 activated");

const CONVENTIONAL_COMMENT_LABELS = [
    { label: 'praise', desc: 'Highlight something positive.' },
    { label: 'nitpick', desc: 'Minor, non-blocking issues (style, naming...).' },
    { label: 'suggestion', desc: 'Suggest specific improvements.' },
    { label: 'issue', desc: 'Point out a blocking problem.' },
    { label: 'question', desc: 'Ask for clarification.' },
    { label: 'thought', desc: 'Share a reflection or idea.' },
    { label: 'chore', desc: 'Request a minor, non-code task.' }
];

const DECORATIONS = [
    { label: 'non-blocking', desc: 'Optional change, doesn\'t block merge.' },
    { label: 'blocking', desc: 'Must be addressed before merge.' },
    { label: 'if-minor', desc: 'Address if the effort is small.' }
];

// Regex to match existing conventional comment prefix (type + optional decoration)
// Group 1: Type (e.g., "suggestion")
// Group 2: Full decoration including parens (e.g., "(blocking)")
// Group 3: Decoration text only (e.g., "blocking")
const EXISTING_PREFIX_DECO_REGEX = /^(\w+)(\((non-blocking|blocking|if-minor)\))?:\s*/;

const TOOLBAR_ID_PREFIX = 'conventional-comments-toolbar-'; // Use prefix for uniqueness
const TOOLBAR_MARKER_CLASS = 'cc-toolbar-added';
let toolbarCounter = 0; // Ensure unique IDs if multiple textareas load simultaneously

// --- Settings Constants ---
const SETTINGS_BUTTON_ID_PREFIX = 'cc-settings-button-';
const SETTINGS_DROPDOWN_ID_PREFIX = 'cc-settings-dropdown-';
const SETTINGS_MARKER_CLASS = 'cc-settings-injected';
const PRETTIFY_STORAGE_KEY = 'conventionalCommentsHelper_prettifyEnabled';
let settingsCounter = 0; // Unique IDs for settings elements

// --- LocalStorage Helpers ---
function getPrettifyState() {
    // Defaults to true if not set
    const storedValue = localStorage.getItem(PRETTIFY_STORAGE_KEY);
    return storedValue === null ? true : storedValue === 'true';
}

function setPrettifyState(enabled) {
    localStorage.setItem(PRETTIFY_STORAGE_KEY, enabled);
    console.log('Prettify state saved:', enabled);
}

// --- Core Function: Update Comment Prefix ---
function updateCommentPrefix(textarea, newType, newDecoration) {
    // Only run if prettify is enabled
    if (!getPrettifyState()) {
        console.log('Prettify disabled, skipping prefix update.');
        // Maybe clear existing prefix if user manually typed one and disabled?
        // For now, just do nothing.
        return;
    }

    const currentValue = textarea.value;
    const selectionStart = textarea.selectionStart;

    // Find the start index of the line the cursor is currently on
    let lineStartIndex = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;

    // Build the new prefix string
    let newPrefixString = newType;
    if (newDecoration) {
        newPrefixString += `(${newDecoration})`;
    }
    newPrefixString += ': ';

    // Check if the current line already starts with a known prefix
    const currentLineContent = currentValue.substring(lineStartIndex); // Get text from line start onwards
    const match = currentLineContent.match(EXISTING_PREFIX_DECO_REGEX);

    let newValue;
    let newCursorPos;

    if (match) {
        // Existing prefix found, replace it
        const existingPrefix = match[0];
        const subject = currentLineContent.substring(existingPrefix.length);
        const lineEndIndex = currentValue.indexOf('\n', lineStartIndex); // Find end of the current line
        const endOfValue = (lineEndIndex === -1) ? currentValue.length : lineEndIndex;

        newValue = currentValue.substring(0, lineStartIndex) + newPrefixString + subject + currentValue.substring(endOfValue);
        newCursorPos = lineStartIndex + newPrefixString.length;
        // console.log(`Replaced prefix: ${existingPrefix.trim()} -> ${newPrefixString.trim()}`);
    } else {
        // No existing prefix, insert the new one
        newValue = currentValue.substring(0, lineStartIndex) + newPrefixString + currentValue.substring(lineStartIndex);
        newCursorPos = lineStartIndex + newPrefixString.length;
        // console.log(`Inserted prefix: ${newPrefixString.trim()}`);
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
    if (textarea.classList.contains(TOOLBAR_MARKER_CLASS) || !getPrettifyState()) {
        // Don't add conventional comments toolbar if already added OR if prettify is off
        if (!textarea.classList.contains(TOOLBAR_MARKER_CLASS) && !getPrettifyState()){
             // Ensure marker is added even if toolbar isn't, to prevent re-processing
             textarea.classList.add(TOOLBAR_MARKER_CLASS);
        }
        return;
    }

    const toolbar = document.createElement('div');
    // Assign unique ID in case we need to target it later
    toolbar.id = `${TOOLBAR_ID_PREFIX}${toolbarCounter++}`;
    toolbar.classList.add('cc-toolbar');
    // Initialize state
    toolbar.dataset.state = 'initial'; // Start in initial state
    toolbar.dataset.selectedType = '';
    toolbar.dataset.selectedDecoration = '';

    // Initial rendering
    renderToolbar(toolbar, textarea);

    // Insert toolbar *before* the textarea
    textarea.parentNode.insertBefore(toolbar, textarea);
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

        // Initial check: Don't add CC toolbar if prettify is off
        if (!getPrettifyState()) {
           const ccToolbar = textarea.parentNode.querySelector('.cc-toolbar');
           if (ccToolbar) ccToolbar.style.display = 'none';
        }

        // Add listener to the toggle to potentially hide/show the CC toolbar
        const toggle = dropdown.querySelector('.cc-settings-toggle');
        toggle.addEventListener('change', (event) => {
            const conventionalToolbar = textarea.parentNode.querySelector('.cc-toolbar');
            if (conventionalToolbar) {
                 if(event.target.checked) {
                     // If turning on, initialize if needed, or just show
                     if (!textarea.classList.contains(TOOLBAR_MARKER_CLASS)) {
                         initializeToolbarForTextarea(textarea);
                     } else {
                         conventionalToolbar.style.display = 'flex'; // Or default display
                     }
                 } else {
                     conventionalToolbar.style.display = 'none'; // Hide if turning off
                 }
            }
        });

    } else if (!githubToolbar) {
        // console.log("Could not find GitHub toolbar for textarea:", textarea);
    }
}


// --- Main Execution & Mutation Observer ---

// Find all comment textareas and process them
function processCommentAreas() {
    // More specific selector to target GitHub comment textareas
    document.querySelectorAll(
        'textarea[aria-label*="comment"], textarea[name="comment[body]"], textarea[name="pull_request_review[body]"], textarea#new_commit_comment_field'
    ).forEach(textarea => {
        // Initialize the conventional comments toolbar (respects prettify state)
        initializeToolbarForTextarea(textarea);
        // Inject the settings button next to GitHub's toolbar
        injectSettingsButton(textarea);
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
                    if (node.matches('textarea[aria-label*="comment"], textarea[name="comment[body]"], textarea[name="pull_request_review[body]"], textarea#new_commit_comment_field') || node.querySelector('textarea[aria-label*="comment"]')) {
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