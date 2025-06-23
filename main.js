import * as UI from "./ui.js";
import * as Editor from "./interactive-editor.js";
import { generateCurlCommand, copyToClipboard } from "./utils.js";

let allRequests = [];
let selectedRequestUrl = null;
let filters = { keyword: "", method: "", status: "", type: "all" };
const KNOWN_TYPES = [
    "xhr",
    "script",
    "stylesheet",
    "image",
    "font",
    "document",
];

const DOMElements = {
    clearButton: document.getElementById("clear-button"),
    resendButton: document.getElementById("resend-button"),
    copyCurlBtn: document.getElementById("copy-curl-btn"),
    headersEditor: document.getElementById("interactive-headers-editor"),
    bodyTextarea: document.getElementById("request-body"),
    urlInput: document.getElementById("request-url"),
    methodSelect: document.getElementById("request-method"),
    resizer: document.getElementById("resizer"),
    leftPane: document.getElementById("left-pane"),
    filterKeywordInput: document.getElementById("filter-keyword"),
    filterMethodSelect: document.getElementById("filter-method"),
    filterStatusInput: document.getElementById("filter-status"),
    filterTypeContainer: document.getElementById("filter-type-container"),
};

function init() {
    UI.setupTabEvents();
    setupEventListeners();
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
}

function setupEventListeners() {
    DOMElements.clearButton.addEventListener("click", () => {
        allRequests = [];
        selectedRequestUrl = null;
        applyFiltersAndRender();
        UI.showWelcomeMessage();
    });

    DOMElements.resendButton.addEventListener("click", handleResend);

    DOMElements.copyCurlBtn.addEventListener("click", () => {
        if (!selectedRequestUrl) return;
        const requestData = allRequests.find(
            (req) => req.request.url === selectedRequestUrl
        );
        const headers = Editor.getEditorData(DOMElements.headersEditor);
        const body = DOMElements.bodyTextarea.value;
        const curlCommand = generateCurlCommand(requestData, headers, body);
        copyToClipboard(curlCommand);
    });

    const filterInputs = [
        DOMElements.filterKeywordInput,
        DOMElements.filterStatusInput,
    ];
    filterInputs.forEach((input) =>
        input.addEventListener("keyup", () => {
            filters[input.id.split("-")[1]] = input.value.toLowerCase();
            applyFiltersAndRender();
        })
    );

    DOMElements.filterMethodSelect.addEventListener("change", () => {
        filters.method = DOMElements.filterMethodSelect.value;
        applyFiltersAndRender();
    });

    DOMElements.filterTypeContainer.addEventListener("click", (e) => {
        const button = e.target.closest(".type-filter-btn");
        if (button) {
            filters.type = button.dataset.type;
            UI.updateActiveTypeFilter(button);
            applyFiltersAndRender();
        }
    });

    setupResizerEvents();
}

function handleRequest(request) {
    if (request.request.url.startsWith("http")) {
        allRequests.push(request);
        applyFiltersAndRender();
    }
}

function handleRequestSelection(url) {
    selectedRequestUrl = url;
    const requestData = allRequests.find((req) => req.request.url === url);
    if (requestData) {
        UI.showEditor();
        UI.populateEditor(requestData);
        applyFiltersAndRender();
    }
}

function applyFiltersAndRender() {
    let filtered = [...allRequests];
    if (filters.keyword)
        filtered = filtered.filter((r) =>
            r.request.url.toLowerCase().includes(filters.keyword)
        );
    if (filters.method)
        filtered = filtered.filter((r) => r.request.method === filters.method);
    if (filters.status)
        filtered = filtered.filter((r) =>
            String(r.response.status).startsWith(filters.status)
        );
    if (filters.type !== "all") {
        if (filters.type === "other") {
            filtered = filtered.filter(
                (r) => !KNOWN_TYPES.includes(r._resourceType)
            );
        } else {
            filtered = filtered.filter((r) => r._resourceType === filters.type);
        }
    }
    UI.renderRequestList(filtered, selectedRequestUrl, handleRequestSelection);
}

async function handleResend() {
    DOMElements.resendButton.disabled = true;
    DOMElements.resendButton.textContent = "Sending...";
    UI.showResponseSection();

    const requestPayload = {
        url: DOMElements.urlInput.value,
        method: DOMElements.methodSelect.value,
        headers: Editor.getEditorData(DOMElements.headersEditor),
        body:
            DOMElements.bodyTextarea.value.trim() === ""
                ? null
                : DOMElements.bodyTextarea.value,
    };

    try {
        const response = await fetch(requestPayload.url, { ...requestPayload });
        const responseBody = await response.text();
        UI.updateResponseView(response, responseBody);
    } catch (error) {
        console.error("Resend Error:", error);
    } finally {
        DOMElements.resendButton.disabled = false;
        DOMElements.resendButton.textContent = "Resend Request";
    }
}

function setupResizerEvents() {
    DOMElements.resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    });

    function handleMouseMove(e) {
        const newLeftWidth = e.clientX;
        const totalWidth = document.body.clientWidth;
        if (newLeftWidth > 300 && newLeftWidth < totalWidth * 0.8) {
            DOMElements.leftPane.style.width = `${newLeftWidth}px`;
        }
    }

    function handleMouseUp() {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    }
}

init();
