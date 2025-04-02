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

// --- Core Function: Update Comment Prefix ---
function updateCommentPrefix(textarea, newType, newDecoration) {
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
    if (textarea.classList.contains(TOOLBAR_MARKER_CLASS)) {
        return; // Already initialized
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


// --- Find Textareas and Initialize Toolbars ---
function processCommentAreas() {
    const textareas = document.querySelectorAll(
        'textarea[name="comment[body]"], textarea[aria-label*="Comment body"], textarea.js-comment-field, textarea[name="pull_request_review[body]"]'
    );
    textareas.forEach(textarea => {
        if (textarea.offsetParent !== null && !textarea.readOnly && !textarea.classList.contains(TOOLBAR_MARKER_CLASS)) {
            initializeToolbarForTextarea(textarea);
        }
    });
}

// --- Main Execution & Mutation Observer ---
processCommentAreas(); // Initial run

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const selector = 'textarea[name="comment[body]"], textarea[aria-label*="Comment body"], textarea.js-comment-field, textarea[name="pull_request_review[body]"]';
                    if (node.matches(selector)) {
                         if (!node.classList.contains(TOOLBAR_MARKER_CLASS)) initializeToolbarForTextarea(node);
                    } else {
                        node.querySelectorAll(selector).forEach(textarea => {
                            if (!textarea.classList.contains(TOOLBAR_MARKER_CLASS)) initializeToolbarForTextarea(textarea);
                        });
                    }
                }
            });
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });