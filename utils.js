export function generateCurlCommand(requestData, headers, body) {
    let curl = `curl '${requestData.request.url}' \\\n`;

    curl += `  -X ${requestData.request.method} \\\n`;

    for (const key in headers) {
        curl += `  -H '${key}: ${headers[key]}' \\\n`;
    }

    if (body) {
        // Escape single quotes in the body
        const escapedBody = body.replace(/'/g, "'\\''");
        curl += `  --data-raw $'${escapedBody}' \\\n`;
    }

    curl += "  --compressed";

    return curl;
}

// Basic clipboard copy function that works in the extension sandbox
export function copyToClipboard(text) {
    const input = document.createElement("textarea");
    input.style.position = "fixed";
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
}
