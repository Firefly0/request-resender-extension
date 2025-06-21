// --- UI Module ---

// Caching DOM elements for performance
const elements = {
    requestList: document.getElementById('request-list'),
    welcomeMessage: document.getElementById('welcome-message'),
    requestEditor: document.getElementById('request-editor'),
    methodSelect: document.getElementById('request-method'),
    urlInput: document.getElementById('request-url'),
    headersTextarea: document.getElementById('request-headers'),
    bodyTextarea: document.getElementById('request-body'),
    responseSection: document.getElementById('response-section'),
    responseStatus: document.getElementById('response-status'),
    
    // Tabs
    tabNav: document.querySelector('.tab-nav'),
    tabButtons: document.querySelectorAll('.tab-item'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Type Filter Buttons
    typeFilterContainer: document.getElementById('filter-type-container'),

    // Tab content areas
    headersContent: document.getElementById('response-headers-content'),
    previewContent: document.getElementById('response-preview-content'),
    rawResponseContent: document.getElementById('response-raw-content'),
};

export function renderRequestList(requests, selectedUrl, onSelectCallback) {
    elements.requestList.innerHTML = '';
    requests.forEach((req, index) => {
        const item = document.createElement('div');
        item.className = 'request-item p-2 cursor-pointer flex items-center space-x-3';
        // Check URL to maintain selection across filters
        if (req.request.url === selectedUrl) {
            item.classList.add('selected');
        }
        
        const method = document.createElement('span');
        method.textContent = req.request.method;
        method.className = 'method-badge';
        method.style.backgroundColor = getMethodColor(req.request.method);

        const url = document.createElement('span');
        url.textContent = req.request.url;
        url.className = 'flex-grow truncate';
        url.title = req.request.url;

        item.appendChild(method);
        item.appendChild(url);
        
        item.addEventListener('click', () => onSelectCallback(index, req.request.url));
        elements.requestList.appendChild(item);
    });
    // Don't autoscroll if a selection is active, to avoid jarring jumps
    if (!selectedUrl) {
        elements.requestList.scrollTop = elements.requestList.scrollHeight;
    }
}

export function populateEditor(requestData) {
    elements.methodSelect.value = requestData.request.method;
    elements.urlInput.value = requestData.request.url;
    
    elements.headersTextarea.value = requestData.request.headers
        .filter(h => !h.name.startsWith(':'))
        .map(h => `${h.name}: ${h.value}`).join('\n');
    
    elements.bodyTextarea.value = '';
    if (requestData.request.postData && requestData.request.postData.text) {
         elements.bodyTextarea.value = requestData.request.postData.text;
         formatJSONTextarea(elements.bodyTextarea);
    }
}

export function updateResponseView(response, responseBody) {
    // Status
    const statusText = `${response.status} ${response.statusText}`;
    elements.responseStatus.innerHTML = `Status: <span class="font-bold ${response.ok ? 'text-green-400' : 'text-red-400'}">${statusText}</span>`;

    // Headers Tab
    elements.headersContent.innerHTML = '';
    const headersTable = document.createElement('table');
    for (const [key, value] of response.headers.entries()) {
        const row = headersTable.insertRow();
        const keyCell = row.insertCell();
        keyCell.textContent = key;
        keyCell.className = 'font-bold pr-4 py-1';
        const valueCell = row.insertCell();
        valueCell.textContent = value;
    }
    elements.headersContent.appendChild(headersTable);
    
    // Preview Tab
    elements.previewContent.innerHTML = '';
    try {
        const jsonData = JSON.parse(responseBody);
        const jsonTreeView = createJsonTreeView(jsonData); // From json-viewer.js
        elements.previewContent.appendChild(jsonTreeView);
    } catch (e) {
        elements.previewContent.textContent = 'No preview available (not valid JSON).';
    }
    
    // Raw Response Tab
    elements.rawResponseContent.querySelector('pre').textContent = responseBody || '(No response body)';
}

export function showWelcomeMessage() {
    elements.welcomeMessage.classList.remove('hidden');
    elements.requestEditor.classList.add('hidden');
}

export function showEditor() {
    elements.welcomeMessage.classList.add('hidden');
    elements.requestEditor.classList.remove('hidden');
}

export function showResponseSection() {
    elements.responseSection.classList.remove('hidden');
}

export function formatJSONTextarea(textarea) {
    try {
        textarea.value = JSON.stringify(JSON.parse(textarea.value), undefined, 2);
    } catch (e) {
        // Silently fail if not JSON
    }
}

export function setupTabEvents() {
    elements.tabNav.addEventListener('click', (e) => {
        const clickedTab = e.target.closest('.tab-item');
        if (!clickedTab) return;
        
        elements.tabButtons.forEach(tab => tab.classList.remove('active'));
        elements.tabContents.forEach(content => content.classList.remove('active'));
        
        clickedTab.classList.add('active');
        const activeContentId = clickedTab.getAttribute('data-tab');
        document.getElementById(activeContentId).classList.add('active');
    });
}

export function updateActiveTypeFilter(clickedButton) {
    elements.typeFilterContainer.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');
}

function getMethodColor(method) {
    switch (method.toUpperCase()) {
        case 'GET': return '#61AFFE';
        case 'POST': return '#49CC90';
        case 'PUT': return '#FCA130';
        case 'DELETE': return '#F93E3E';
        case 'PATCH': return '#A975E0';
        case 'OPTIONS': return '#00bcd4';
        case 'HEAD': return '#90a4ae';
        default: return '#9E9E9E';
    }
}
