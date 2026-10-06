/**
 * File Manager Module
 * Browser-safe localStorage persistence and direct file downloading.
 */

const STORAGE_KEY = 'ui-code-generator-project';

/**
 * Saves current UI Model to LocalStorage.
 * @param {Object} model
 */
export function saveProject(model) {
    try {
        const serialized = JSON.stringify(model);
        localStorage.setItem(STORAGE_KEY, serialized);
        return true;
    } catch (e) {
        console.error("Error saving project to localStorage:", e);
        return false;
    }
}

/**
 * Loads UI Model from LocalStorage if available.
 * @returns {Object|null}
 */
export function loadProject() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading project from localStorage:", e);
    }
    return null;
}

/**
 * Triggers native browser download for text files using Blob URLs.
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 */
export function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Exports each generated project file independently.
 * @param {Object} projectFiles Object containing filenames and content
 */
export function exportProject(projectFiles) {
    const mimeTypes = {
        'index.html': 'text/html',
        'style.css': 'text/css',
        'script.js': 'text/javascript'
    };

    Object.keys(projectFiles).forEach((filename, index) => {
        // Stagger downloads slightly to ensure browser handles multiple triggers cleanly
        setTimeout(() => {
            downloadFile(filename, projectFiles[filename], mimeTypes[filename] || 'text/plain');
        }, index * 200);
    });
}