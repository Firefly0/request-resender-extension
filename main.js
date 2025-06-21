import * as UI from './ui.js';

// --- State Management ---
let allRequests = []; 
let selectedRequestUrl = null; // Use URL as a stable identifier
let filters = {
    keyword: '',
    method: '',
    status: '',
    type: 'all'
};
const KNOWN_TYPES = ['xhr', 'script', 'stylesheet', 'image', 'font', 'document'];

// --- DOM Element References ---
const clearButton = document.getElementById('clear-button');
const resendButton = document.getElementById('resend-button');
const formatHeadersBtn = document.getElementById('format-headers-btn');
const formatBodyBtn = document.getElementById('format-body-btn');
const headersTextarea = document.getElementById('request-headers');
const bodyTextarea = document.getElementById('request-body');
const urlInput = document.getElementById('request-url');
const methodSelect = document.getElementById('request-method');
const resizer = document.getElementById('resizer');
const leftPane = document.getElementById('left-pane');
const filterKeywordInput = document.getElementById('filter-keyword');
const filterMethodSelect = document.getElementById('filter-method');
const filterStatusInput = document.getElementById('filter-status');
const filterTypeContainer = document.getElementById('filter-type-container');

// --- Initialization ---
function init() {
    UI.setupTabEvents();
    setupEventListeners();
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
}

// --- Event Handlers ---
function setupEventListeners() {
    clearButton.addEventListener('click', () => {
        allRequests = [];
        selectedRequestUrl = null;
        applyFiltersAndRender();
        UI.showWelcomeMessage();
    });

    resendButton.addEventListener('click', handleResend);
    formatHeadersBtn.addEventListener('click', () => UI.formatJSONTextarea(headersTextarea));
    formatBodyBtn.addEventListener('click', () => UI.formatJSONTextarea(bodyTextarea));
    
    // Filter listeners
    filterKeywordInput.addEventListener('keyup', () => {
        filters.keyword = filterKeywordInput.value.toLowerCase();
        applyFiltersAndRender();
    });
    filterMethodSelect.addEventListener('change', () => {
        filters.method = filterMethodSelect.value;
        applyFiltersAndRender();
    });
    filterStatusInput.addEventListener('keyup', () => {
        filters.status = filterStatusInput.value;
        applyFiltersAndRender();
    });
    filterTypeContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.type-filter-btn');
        if (button) {
            filters.type = button.dataset.type;
            UI.updateActiveTypeFilter(button);
            applyFiltersAndRender();
        }
    });

    
    setupResizerEvents();
}

function handleRequest(request) {
    if (request.request.url.startsWith('http')) {
        allRequests.push(request);
        applyFiltersAndRender();
    }
}

function handleRequestSelection(index, url) {
    selectedRequestUrl = url;
    const originalIndex = allRequests.findIndex(req => req.request.url === url);

    if (originalIndex !== -1) {
        const requestData = allRequests[originalIndex];
        UI.showEditor();
        UI.populateEditor(requestData);
        applyFiltersAndRender(); 
    }
}

function applyFiltersAndRender() {
    let filteredRequests = [...allRequests];

    if (filters.keyword) {
        filteredRequests = filteredRequests.filter(req => req.request.url.toLowerCase().includes(filters.keyword));
    }
    if (filters.method) {
        filteredRequests = filteredRequests.filter(req => req.request.method === filters.method);
    }
    if (filters.status) {
        filteredRequests = filteredRequests.filter(req => String(req.response.status).startsWith(filters.status));
    }
    if (filters.type && filters.type !== 'all') {
        if (filters.type === 'other') {
            filteredRequests = filteredRequests.filter(req => !KNOWN_TYPES.includes(req._resourceType));
        } else {
            filteredRequests = filteredRequests.filter(req => req._resourceType === filters.type);
        }
    }
    
    UI.renderRequestList(filteredRequests, selectedRequestUrl, handleRequestSelection);
}


async function handleResend() {
    resendButton.disabled = true;
    resendButton.textContent = 'Sending...';
    UI.showResponseSection();

    const requestPayload = {
        url: urlInput.value,
        method: methodSelect.value,
        headers: {},
        body: bodyTextarea.value.trim() === '' ? null : bodyTextarea.value,
    };

    headersTextarea.value.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            if (key) requestPayload.headers[key] = value;
        }
    });

    try {
        const response = await fetch(requestPayload.url, { 
            method: requestPayload.method, 
            headers: requestPayload.headers, 
            body: requestPayload.body 
        });
        const responseBody = await response.text();
        UI.updateResponseView(response, responseBody);
    } catch (error) {
        console.error("Resend Error:", error);
    } finally {
        resendButton.disabled = false;
        resendButton.textContent = 'Resend Request';
    }
}

// --- Resizer Logic ---
function setupResizerEvents() {
    resizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    function handleMouseMove(e) {
        const newLeftWidth = e.clientX;
        const totalWidth = document.body.clientWidth;

        if (newLeftWidth > 250 && newLeftWidth < (totalWidth * 0.8)) {
            leftPane.style.width = `${newLeftWidth}px`;
        }
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

// --- Start the app ---
init();
