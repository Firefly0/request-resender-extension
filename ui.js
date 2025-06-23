import { createInteractiveEditor } from "./interactive-editor.js";

const elements = {
    requestList: document.getElementById("request-list"),
    welcomeMessage: document.getElementById("welcome-message"),
    requestEditor: document.getElementById("request-editor"),
    methodSelect: document.getElementById("request-method"),
    urlInput: document.getElementById("request-url"),
    headersEditorContainer: document.getElementById(
        "interactive-headers-editor"
    ),
    bodyTextarea: document.getElementById("request-body"),
    responseSection: document.getElementById("response-section"),
    responseStatus: document.getElementById("response-status"),
    tabNav: document.querySelector(".tab-nav"),
    tabButtons: document.querySelectorAll(".tab-item"),
    tabContents: document.querySelectorAll(".tab-content"),
    typeFilterContainer: document.getElementById("filter-type-container"),
    headersContent: document.getElementById("response-headers-content"),
    previewContent: document.getElementById("response-preview-content"),
    rawResponseContent: document.getElementById("response-raw-content"),
};

export function renderRequestList(requests, selectedUrl, onSelectCallback) {
    elements.requestList.innerHTML = "";
    requests.forEach((req, index) => {
        const item = document.createElement("div");
        item.className = "request-item cursor-pointer";
        if (req.request.url === selectedUrl) {
            item.classList.add("selected");
        }

        const url = new URL(req.request.url);
        const name = url.pathname.split("/").pop() || url.hostname;
        const path = url.pathname;
        const status = req.response.status;

        item.innerHTML = `
            <div class="method-badge" style="color:${getMethodColor(
                req.request.method
            )}">${req.request.method}</div>
            <div class="url-details">
                <div class="url-name" title="${req.request.url}">${name}</div>
                <div class="url-path">${path}</div>
            </div>
            <div class="status-badge ${getStatusClass(status)}">${status}</div>
        `;

        item.addEventListener("click", () => onSelectCallback(req.request.url));
        elements.requestList.appendChild(item);
    });
    if (!selectedUrl) {
        elements.requestList.scrollTop = elements.requestList.scrollHeight;
    }
}

export function populateEditor(requestData) {
    elements.methodSelect.value = requestData.request.method;
    elements.urlInput.value = requestData.request.url;

    const headersArray = requestData.request.headers
        .filter((h) => !h.name.startsWith(":"))
        .map((h) => ({ name: h.name, value: h.value }));
    createInteractiveEditor(elements.headersEditorContainer, headersArray);

    elements.bodyTextarea.value = "";
    if (requestData.request.postData && requestData.request.postData.text) {
        elements.bodyTextarea.value = requestData.request.postData.text;
    }
}

export function updateResponseView(response, responseBody) {
    const statusText = `${response.status} ${response.statusText}`;
    elements.responseStatus.innerHTML = `Status: <span class="font-bold ${getStatusClass(
        response.status
    )}">${statusText}</span>`;

    elements.headersContent.innerHTML = "";
    const headersTable = document.createElement("table");
    for (const [key, value] of response.headers.entries()) {
        const row = headersTable.insertRow();
        const keyCell = row.insertCell();
        keyCell.textContent = key;
        keyCell.className = "font-bold pr-4 py-1";
        row.insertCell().textContent = value;
    }
    elements.headersContent.appendChild(headersTable);

    elements.previewContent.innerHTML = "";
    try {
        const jsonTreeView = createJsonTreeView(JSON.parse(responseBody));
        elements.previewContent.appendChild(jsonTreeView);
    } catch (e) {
        elements.previewContent.textContent =
            "No preview available (not valid JSON).";
    }

    elements.rawResponseContent.querySelector("pre").textContent =
        responseBody || "(No response body)";
}

export function showWelcomeMessage() {
    elements.welcomeMessage.classList.remove("hidden");
    elements.requestEditor.classList.add("hidden");
}

export function showEditor() {
    elements.welcomeMessage.classList.add("hidden");
    elements.requestEditor.classList.remove("hidden");
}

export function showResponseSection() {
    elements.responseSection.classList.remove("hidden");
}

export function setupTabEvents() {
    elements.tabNav.addEventListener("click", (e) => {
        const clickedTab = e.target.closest(".tab-item");
        if (!clickedTab) return;
        elements.tabButtons.forEach((tab) => tab.classList.remove("active"));
        elements.tabContents.forEach((content) =>
            content.classList.remove("active")
        );
        clickedTab.classList.add("active");
        document.getElementById(clickedTab.dataset.tab).classList.add("active");
    });
}

export function updateActiveTypeFilter(clickedButton) {
    elements.typeFilterContainer
        .querySelectorAll(".type-filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
    clickedButton.classList.add("active");
}

function getMethodColor(method) {
    const colors = {
        GET: "#61AFFE",
        POST: "#49CC90",
        PUT: "#FCA130",
        DELETE: "#F93E3E",
        PATCH: "#A975E0",
        OPTIONS: "#00bcd4",
        HEAD: "#90a4ae",
    };
    return colors[method.toUpperCase()] || "#9E9E9E";
}

function getStatusClass(status) {
    if (status >= 400) return "error";
    if (status >= 300) return "redirect";
    return "ok";
}
