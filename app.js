/**
 * Application Controller
 * Connects UI Model, Editor, Generator, and File Manager modules together.
 */

import { createInitialModel, serializeModel, loadModel } from './ui-model.js';
import { initEditor, setModel, renderCanvas } from './editor.js';
import { generateProject, generateHTML, generateCSS, generateJavaScript } from './generator.js';
import { saveProject, loadProject, exportProject } from './file-manager.js';

let activeModel = createInitialModel();

// History state stack for Undo / Redo
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 40;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Attempt loading saved project from localStorage
    const saved = loadProject();
    if (saved) {
        activeModel = saved;
        updateStatus("Project restored from local storage.");
    } else {
        updateStatus("Ready");
    }

    // Push initial snapshot
    pushHistoryState(activeModel);

    // Initialize visual canvas editor
    initEditor(activeModel, onModelChange);

    // Connect Topbar Controls
    setupToolbar();

    // Connect Component Search Box
    setupSearch();

    // Connect Bottom Navigation Tabs
    setupTabs();

    // Refresh status displays
    updateModelCounter();
}

/**
 * Callback passed to editor when model updates.
 * @param {Object} updatedModel
 */
function onModelChange(updatedModel) {
    activeModel = updatedModel;
    pushHistoryState(activeModel);
    updateModelCounter();
}

/**
 * Push snapshot onto history stack for undo/redo.
 * @param {Object} model
 */
function pushHistoryState(model) {
    const jsonStr = serializeModel(model);

    // If pushing after an undo, remove future states
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    // Avoid duplicate adjacent states
    if (historyStack.length > 0 && historyStack[historyStack.length - 1] === jsonStr) {
        return;
    }

    historyStack.push(jsonStr);
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
    }
    historyIndex = historyStack.length - 1;
}

/**
 * Connects top action buttons.
 */
function setupToolbar() {
    const buttons = document.querySelectorAll('.toolbar-actions button');
    
    // Wire Undo (1st button) and Redo (2nd button)
    if (buttons[0]) buttons[0].addEventListener('click', handleUndo);
    if (buttons[1]) buttons[1].addEventListener('click', handleRedo);

    // Save button
    const saveBtn = document.querySelector('.toolbar-btn:nth-child(3)');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveProject(activeModel);
            updateStatus("Project saved.");
        });
    }

    // Preview button
    const previewBtn = document.querySelector('.preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', handlePreview);
    }

    // Generate button
    const generateBtn = document.querySelector('.generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }
}

function handleUndo() {
    if (historyIndex > 0) {
        historyIndex--;
        activeModel = loadModel(historyStack[historyIndex]);
        setModel(activeModel);
        updateModelCounter();
        updateStatus("Undo performed.");
    }
}

function handleRedo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        activeModel = loadModel(historyStack[historyIndex]);
        setModel(activeModel);
        updateModelCounter();
        updateStatus("Redo performed.");
    }
}

function handlePreview() {
    const project = generateProject(activeModel);
    const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${project['style.css']}</style>
        </head>
        <body>
            ${project['index.html'].replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '')}
            <script>${project['script.js']}</script>
        </body>
        </html>
    `;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    if (win) {
        updateStatus("Preview opened in new tab.");
    } else {
        // Fallback to preview tab inside editor if popup was blocked
        switchTab('Preview');
        updateStatus("Preview tab opened.");
    }
}

function handleGenerate() {
    const files = generateProject(activeModel);
    exportProject(files);
    updateStatus("Code generated and downloaded.");
}

/**
 * Filter left panel components on query input.
 */
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const components = document.querySelectorAll('.component');

        components.forEach(comp => {
            const name = comp.querySelector('small')?.textContent?.toLowerCase() || '';
            if (name.includes(query)) {
                comp.style.display = 'flex';
            } else {
                comp.style.display = 'none';
            }
        });
    });
}

/**
 * Binds bottom navigation tabs.
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.bottom-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.textContent.trim();
            switchTab(tabName);
        });
    });
}

/**
 * Handles switching active view based on tab selection.
 * @param {string} tabName
 */
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.bottom-tab');
    tabs.forEach(t => {
        if (t.textContent.trim() === tabName) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    const workspace = document.querySelector('.workspace');
    if (!workspace) return;

    if (tabName === 'Design') {
        renderCanvas();
        return;
    }

    const files = generateProject(activeModel);

    if (tabName === 'HTML') {
        renderCodeView(workspace, files['index.html'], 'html');
    } else if (tabName === 'CSS') {
        renderCodeView(workspace, files['style.css'], 'css');
    } else if (tabName === 'JavaScript') {
        renderCodeView(workspace, files['script.js'], 'javascript');
    } else if (tabName === 'Preview') {
        renderIframePreview(workspace, files);
    }
}

function renderCodeView(container, code, language) {
    container.innerHTML = `
        <div style="width: 100%; height: 100%; background: #1e293b; color: #f8fafc; padding: 20px; border-radius: 8px; font-family: monospace; overflow: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;"><code>${escapeHTML(code)}</code></pre>
        </div>
    `;
}

function renderIframePreview(container, files) {
    const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${files['style.css']}</style>
        </head>
        <body>
            ${files['index.html'].replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '')}
            <script>${files['script.js']}</script>
        </body>
        </html>
    `;

    container.innerHTML = `
        <iframe id="preview-frame" style="width: 100%; height: 100%; min-height: 500px; border: 1px solid #cbd5e1; border-radius: 8px; background: white;"></iframe>
    `;

    const iframe = document.getElementById('preview-frame');
    if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(fullHTML);
        doc.close();
    }
}

function updateModelCounter() {
    const countEl = document.querySelector('.statusbar div:last-child strong');
    if (countEl && activeModel) {
        const count = activeModel.children ? activeModel.children.length : 0;
        countEl.textContent = `${count} element${count === 1 ? '' : 's'}`;
    }
}

function updateStatus(msg) {
    const statusEl = document.querySelector('.statusbar div:first-child');
    if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot"></span>${msg}`;
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