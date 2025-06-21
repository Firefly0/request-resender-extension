import * as UI from './ui.js';

// --- State Management ---
let requests = []; 
let selectedRequestIndex = -1;

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

// --- Initialization ---
function init() {
    UI.setupTabEvents();
    setupEventListeners();
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
}

// --- Event Handlers ---
function setupEventListeners() {
    clearButton.addEventListener('click', () => {
        requests = [];
        selectedRequestIndex = -1;
        UI.renderRequestList(requests, selectedRequestIndex, handleRequestSelection);
        UI.showWelcomeMessage();
    });

    resendButton.addEventListener('click', handleResend);
    formatHeadersBtn.addEventListener('click', () => UI.formatJSONTextarea(headersTextarea));
    formatBodyBtn.addEventListener('click', () => UI.formatJSONTextarea(bodyTextarea));
    
    setupResizerEvents();
}

function handleRequest(request) {
    if (request.request.url.startsWith('http')) {
        requests.push(request);
        UI.renderRequestList(requests, selectedRequestIndex, handleRequestSelection);
    }
}

function handleRequestSelection(index) {
    selectedRequestIndex = index;
    const requestData = requests[index];
    
    UI.showEditor();
    UI.populateEditor(requestData);
    UI.renderRequestList(requests, selectedRequestIndex, handleRequestSelection);
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

        // Apply constraints
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
