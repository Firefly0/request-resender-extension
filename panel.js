// This script contains the logic for the panel UI (panel.html).
// For a larger app, we could split this into:
// - ui.js (DOM manipulation, rendering)
// - network.js (request handling, resending)
// - state.js (managing the 'requests' array and selected index)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const requestList = document.getElementById('request-list');
    const welcomeMessage = document.getElementById('welcome-message');
    const requestEditor = document.getElementById('request-editor');
    const clearButton = document.getElementById('clear-button');
    
    const methodSelect = document.getElementById('request-method');
    const urlInput = document.getElementById('request-url');
    const headersTextarea = document.getElementById('request-headers');
    const bodyTextarea = document.getElementById('request-body');
    const resendButton = document.getElementById('resend-button');
    
    const formatHeadersBtn = document.getElementById('format-headers-btn');
    const formatBodyBtn = document.getElementById('format-body-btn');
    
    const responseSection = document.getElementById('response-section');
    const responseStatus = document.getElementById('response-status');
    const responseOutput = document.getElementById('response-output');

    // --- State Management ---
    let requests = []; // Array to store captured request data
    let selectedRequestIndex = -1; // Index of the currently selected request

    // --- Core Logic ---

    // Listen for network requests and add them to our list
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
    
    function handleRequest(request) {
        if (request.request.url.startsWith('http')) {
            requests.push(request);
            renderRequestList();
        }
    }
    
    // Clear the list of requests
    clearButton.addEventListener('click', () => {
        requests = [];
        selectedRequestIndex = -1;
        renderRequestList();
        hideEditor();
    });

    // --- UI Rendering & Event Handlers ---
    
    function renderRequestList() {
        requestList.innerHTML = ''; // Clear current list
        requests.forEach((req, index) => {
            const item = document.createElement('div');
            item.className = 'request-item p-2 cursor-pointer flex items-center space-x-3';
            if (index === selectedRequestIndex) {
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
            
            item.addEventListener('click', () => selectRequest(index));
            requestList.appendChild(item);
        });
        requestList.scrollTop = requestList.scrollHeight;
    }

    function selectRequest(index) {
        selectedRequestIndex = index;
        const requestData = requests[index];
        
        welcomeMessage.classList.add('hidden');
        requestEditor.classList.remove('hidden');
        responseSection.classList.add('hidden');

        methodSelect.value = requestData.request.method;
        urlInput.value = requestData.request.url;
        
        headersTextarea.value = requestData.request.headers
            .filter(h => !h.name.startsWith(':'))
            .map(h => `${h.name}: ${h.value}`).join('\n');
        
        bodyTextarea.value = ''; // Clear previous body
        if (requestData.request.postData && requestData.request.postData.text) {
             bodyTextarea.value = requestData.request.postData.text;
             formatJSONTextarea(bodyTextarea); // Attempt to format on load
        }

        renderRequestList();
    }
    
    function hideEditor() {
        welcomeMessage.classList.remove('hidden');
        requestEditor.classList.add('hidden');
    }

    // --- Formatting Logic ---
    formatBodyBtn.addEventListener('click', () => formatJSONTextarea(bodyTextarea));
    formatHeadersBtn.addEventListener('click', () => formatJSONTextarea(headersTextarea));

    function formatJSONTextarea(textarea) {
        try {
            const ugly = textarea.value;
            const obj = JSON.parse(ugly);
            const pretty = JSON.stringify(obj, undefined, 2);
            textarea.value = pretty;
        } catch (e) {
            // Not valid JSON, do nothing.
            console.log("Could not format text as JSON.", e.message);
        }
    }


    // --- Resend Logic ---
    
    resendButton.addEventListener('click', async () => {
        // (logic is identical to previous version, just included for completeness)
        const url = urlInput.value;
        const method = methodSelect.value;
        
        const headers = {};
        headersTextarea.value.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                if (key) headers[key] = value;
            }
        });

        const body = bodyTextarea.value.trim() === '' ? null : bodyTextarea.value;
        
        resendButton.disabled = true;
        resendButton.textContent = 'Sending...';
        responseOutput.textContent = 'Waiting for response...';
        responseStatus.innerHTML = '';
        responseSection.classList.remove('hidden');

        try {
            const startTime = performance.now();
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body,
            });
            const endTime = performance.now();

            const statusText = `${response.status} ${response.statusText}`;
            const duration = `${Math.round(endTime - startTime)} ms`;

            responseStatus.innerHTML = `Status: <span class="font-bold ${response.ok ? 'text-green-400' : 'text-red-400'}">${statusText}</span> | Time: <span class="font-bold">${duration}</span>`;

            const responseBody = await response.text();
            
            // Apply syntax highlighting
            responseOutput.textContent = responseBody; // Set text content first
            try {
                // Check if it's JSON and then highlight
                JSON.parse(responseBody); 
                responseOutput.innerHTML = hljs.highlight(responseBody, { language: 'json', ignoreIllegals: true }).value;
            } catch (e) {
                // Not JSON, just display as plain text
                // The textContent is already set, so no action needed.
            }

        } catch (error) {
            responseStatus.innerHTML = `Status: <span class="font-bold text-red-400">Network Error</span>`;
            responseOutput.textContent = error.message;
        } finally {
            resendButton.disabled = false;
            resendButton.textContent = 'Resend Request';
        }
    });
    
    // --- Helper Functions ---
    
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
});
