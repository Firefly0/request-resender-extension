export function createInteractiveEditor(container, initialData = []) {
    container.innerHTML = ""; // Clear previous content

    // Render initial rows
    initialData.forEach((item) =>
        container.appendChild(createRow(item.name, item.value))
    );

    // Add the "Add header" button
    const addButton = document.createElement("button");
    addButton.textContent = "Add Header";
    addButton.className = "btn btn-primary add-row-btn";
    addButton.style.padding = "4px 12px"; // Smaller padding
    addButton.style.fontSize = "12px";
    addButton.onclick = () => {
        container.insertBefore(createRow("", ""), addButton);
    };
    container.appendChild(addButton);
}

export function getEditorData(container) {
    const data = {};
    container.querySelectorAll(".editor-row").forEach((row) => {
        const keyEl = row.querySelector('[data-type="key"]');
        const valueEl = row.querySelector('[data-type="value"]');
        const key = keyEl.textContent.trim();
        if (key) {
            data[key] = valueEl.textContent.trim();
        }
    });
    return data;
}

function createRow(key, value) {
    const row = document.createElement("div");
    row.className = "editor-row";

    const keyCell = createCell(key, "key", "Header name");
    const valueCell = createCell(value, "value", "Header value");

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn";
    deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
    deleteBtn.onclick = () => row.remove();

    row.appendChild(keyCell);
    row.appendChild(valueCell);
    row.appendChild(deleteBtn);
    return row;
}

function createCell(content, type, placeholder) {
    const cell = document.createElement("div");
    cell.className = "editor-cell";
    cell.contentEditable = "true";
    cell.textContent = content;
    cell.dataset.type = type;
    cell.dataset.placeholder = placeholder;
    return cell;
}
