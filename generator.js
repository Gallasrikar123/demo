/**
 * Code Generator Module
 * Converts internal UI Model JSON structure into standalone HTML, CSS, and JS files.
 */

/**
 * Generates semantic HTML code.
 * @param {Object} model
 * @returns {string} HTML string
 */
export function generateHTML(model) {
    const bodyContent = (model.children || []).map(child => renderNodeHTML(child, "  ")).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${bodyContent || "  <!-- No elements added -->"}
    <script src="script.js"></script>
</body>
</html>`;
}

/**
 * Generates CSS rules for all elements in the model.
 * @param {Object} model
 * @returns {string} CSS string
 */
export function generateCSS(model) {
    let cssRules = [];

    cssRules.push(`/* Reset & Base Styles */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #ffffff;
    padding: 20px;
}
`);

    function extractStyles(node) {
        if (node.styles && node.id) {
            const selector = `#${node.id}`;
            const styles = node.styles;
            let rule = `${selector} {\n`;

            if (styles.width) rule += `    width: ${styles.width};\n`;
            if (styles.height) rule += `    height: ${styles.height};\n`;
            if (styles.color) rule += `    color: ${styles.color};\n`;
            if (styles.fontSize) rule += `    font-size: ${styles.fontSize};\n`;
            if (styles.textAlign) rule += `    text-align: ${styles.textAlign};\n`;
            if (styles.padding) rule += `    padding: ${styles.padding};\n`;
            if (styles.margin) rule += `    margin: ${styles.margin};\n`;
            if (styles.border) rule += `    border: ${styles.border};\n`;
            if (styles.background) rule += `    background: ${styles.background};\n`;

            rule += `}`;
            cssRules.push(rule);
        }

        if (node.children && node.children.length > 0) {
            node.children.forEach(extractStyles);
        }
    }

    if (model.children) {
        model.children.forEach(extractStyles);
    }

    return cssRules.join("\n\n");
}

/**
 * Generates client-side JavaScript code.
 * @param {Object} model
 * @returns {string} JavaScript code string
 */
export function generateJavaScript(model) {
    return `// Custom JavaScript for generated project
document.addEventListener('DOMContentLoaded', () => {
    console.log('Generated website fully loaded.');
});`;
}

/**
 * Generates all project code assets.
 * @param {Object} model
 * @returns {Object} Dictionary with filename and file contents
 */
export function generateProject(model) {
    return {
        "index.html": generateHTML(model),
        "style.css": generateCSS(model),
        "script.js": generateJavaScript(model)
    };
}

/**
 * Recursively builds HTML elements matching component types.
 * @param {Object} node
 * @param {string} indent
 * @returns {string}
 */
function renderNodeHTML(node, indent = "") {
    const id = node.id ? ` id="${node.id}"` : '';
    const text = escapeHTML(node.text || '');

    switch (node.type) {
        case 'text':
            return `${indent}<h2${id}>${text}</h2>`;

        case 'button':
            return `${indent}<button${id} class="btn">${text}</button>`;

        case 'image':
            return `${indent}<div${id} class="image-placeholder">${text}</div>`;

        case 'input':
            return `${indent}<input${id} type="text" placeholder="${text}">`;

        case 'card':
            return `${indent}<div${id} class="card">
${indent}  <h3>${text}</h3>
${indent}  <p>This is a generated card component description.</p>
${indent}</div>`;

        case 'navbar':
            return `${indent}<nav${id} class="navbar">
${indent}  <div class="logo">${text}</div>
${indent}  <ul>
${indent}    <li><a href="#">Home</a></li>
${indent}    <li><a href="#">About</a></li>
${indent}  </ul>
${indent}</nav>`;

        case 'section':
            return `${indent}<section${id} class="section-container">
${indent}  <h2>${text}</h2>
${indent}</section>`;

        case 'grid':
            return `${indent}<div${id} class="grid-layout">
${indent}  <div class="grid-col">Col 1</div>
${indent}  <div class="grid-col">Col 2</div>
${indent}  <div class="grid-col">Col 3</div>
${indent}</div>`;

        case 'footer':
            return `${indent}<footer${id}>
${indent}  <p>${text}</p>
${indent}</footer>`;

        case 'container':
        default:
            return `${indent}<div${id} class="container-box">
${indent}  ${text}
${indent}</div>`;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}