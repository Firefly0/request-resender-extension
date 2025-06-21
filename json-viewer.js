/**
 * Creates an interactive, collapsible tree view from a JSON object.
 * @param {object | Array} jsonData The JSON data to render.
 * @returns {HTMLElement} A div element containing the rendered tree.
 */
 function createJsonTreeView(jsonData) {
    const container = document.createElement('div');
    container.className = 'json-viewer';

    const rootContent = buildTree(jsonData, true);
    container.appendChild(rootContent);

    return container;
}

/**
 * Recursively builds the HTML for the JSON tree.
 * @param {*} data The data to process (can be any type).
 * @param {boolean} isRoot Whether this is the root level of the tree.
 * @returns {HTMLElement} The element representing the data.
 */
function buildTree(data, isRoot = false) {
    // Handle primitive types
    if (data === null) return createValueElement('null', 'null');
    if (typeof data !== 'object') return createValueElement(data, typeof data);

    const isArray = Array.isArray(data);
    const container = document.createElement('div');
    const content = document.createElement('div');

    // Add expand/collapse functionality
    if (!isRoot) {
        container.className = 'collapsible';
        content.className = 'nested-content';
        
        const toggle = document.createElement('span');
        toggle.className = 'toggle';

        const keyText = document.createElement('span');
        keyText.className = 'bracket';
        keyText.textContent = isArray ? '[' : '{';
        
        const ellipsis = document.createElement('span');
        ellipsis.className = 'bracket';
        ellipsis.textContent = '...';

        const closingBracket = document.createElement('span');
        closingBracket.className = 'bracket';
        closingBracket.textContent = isArray ? ']' : '}';

        container.appendChild(toggle);
        container.appendChild(keyText);
        container.appendChild(ellipsis);
        container.appendChild(closingBracket);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('expanded');
            content.classList.toggle('expanded');
            ellipsis.style.display = content.classList.contains('expanded') ? 'none' : 'inline';
            closingBracket.style.display = content.classList.contains('expanded') ? 'none' : 'inline';
        });

    } else {
        content.classList.add('expanded'); // Root is always expanded
    }

    // Recursively build for children
    for (const key in data) {
        const propertyDiv = document.createElement('div');
        propertyDiv.className = 'property';

        // Add the key if it's an object
        if (!isArray) {
            const keySpan = document.createElement('span');
            keySpan.className = 'key';
            keySpan.textContent = `"${key}":`;
            propertyDiv.appendChild(keySpan);
        }

        const child = buildTree(data[key]);
        propertyDiv.appendChild(child);
        content.appendChild(propertyDiv);
    }
    
    container.appendChild(content);

    // Add closing bracket for expanded view
    if (!isRoot) {
         const closingBracketExpanded = document.createElement('span');
         closingBracketExpanded.className = 'bracket';
         closingBracketExpanded.textContent = isArray ? ']' : '}';
         content.appendChild(closingBracketExpanded);
    }


    return container;
}

/**
 * Creates a styled span for a primitive value.
 * @param {*} value The primitive value.
 * @param {string} type The type of the value (string, number, boolean, null).
 * @returns {HTMLElement} A span element.
 */
function createValueElement(value, type) {
    const span = document.createElement('span');
    span.className = `value ${type}`;
    span.textContent = type === 'string' ? `"${value}"` : String(value);
    return span;
}
