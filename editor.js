/**
 * Visual Editor Module
 * Manages canvas rendering, interactions, selection, and properties form updates.
 */

import { createElement, addElement, removeElement, getElement, getAllElements, updateElement } from './ui-model.js';

let selectedElementId = null;
let currentModel = null;
let onModelChangeCallback = null;

/**
 * Initializes the Visual Editor and binds DOM events.
 * @param {Object} model - Active UI model
 * @param {Function} onChange - Callback triggered whenever the model is modified
 */
export function initEditor(model, onChange) {
    currentModel = model;
    onModelChangeCallback = onChange;

    setupComponentPalette();
    setupCanvasEvents();
    setupPropertyInputs();
    setupKeyboardShortcuts();
    renderCanvas();
}

/**
 * Updates internal model reference and re-renders canvas.
 * @param {Object} model
 */
export function setModel(model) {
    currentModel = model;
    renderCanvas();
}

/**
 * Gets currently selected element ID.
 * @returns {string|null}
 */
export function getSelectedId() {
    return selectedElementId;
}

/**
 * Binds click events on component cards in the left panel.
 */
function setupComponentPalette() {
    const componentButtons = document.querySelectorAll('.component');
    
    // Map text labels inside button small elements to types
    const typeMapping = {
        'Container': 'container',
        'Text': 'text',
        'Button': 'button',
        'Image': 'image',
        'Input': 'input',
        'Card': 'card',
        'Navbar': 'navbar',
        'Section': 'section',
        'Grid': 'grid',
        'Footer': 'footer'
    };

    componentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const label = btn.querySelector('small')?.textContent?.trim();
            const type = typeMapping[label] || 'container';
            addComponentToModel(type);
        });
    });

    // Setup empty state button
    const emptyBtn = document.querySelector('.empty-button');
    if (emptyBtn) {
        emptyBtn.addEventListener('click', () => {
            addComponentToModel('text');
        });
    }
}

/**
 * Adds a new component to the model and updates UI.
 * @param {string} type
 */
function addComponentToModel(type) {
    const newElem = createElement(type);
    addElement(currentModel, newElem);
    selectedElementId = newElem.id;
    notifyChange();
}

/**
 * Binds canvas selection clear logic.
 */
function setupCanvasEvents() {
    const workspace = document.querySelector('.workspace');
    if (workspace) {
        workspace.addEventListener('click', (e) => {
            if (e.target.classList.contains('workspace') || e.target.classList.contains('page-canvas')) {
                selectedElementId = null;
                updatePropertiesPanel();
                renderCanvas();
            }
        });
    }
}

/**
 * Dynamically binds and updates property form inputs based on selection.
 */
function setupPropertyInputs() {
    const rightPanel = document.querySelector('.right-panel');
    const propertySection = document.querySelector('.property-section');
    
    if (!propertySection) return;

    // Build functional input elements inside property-section matching requirements
    propertySection.innerHTML = `
        <label>Text / Content</label>
        <input type="text" id="property-text" placeholder="Enter text">

        <label>Width</label>
        <input type="text" id="property-width" placeholder="auto, 100%, 200px">

        <label>Height</label>
        <input type="text" id="property-height" placeholder="auto, 50px">

        <label>Text Color</label>
        <input type="text" id="property-color" placeholder="#000000 or red">

        <label>Font Size</label>
        <input type="text" id="property-font-size" placeholder="16px">

        <label>Text Align</label>
        <input type="text" id="property-alignment" placeholder="left, center, right">

        <label>Padding</label>
        <input type="text" id="property-spacing" placeholder="8px or 10px 20px">

        <label>Border</label>
        <input type="text" id="property-border" placeholder="1px solid #ccc or none">

        <label>Background</label>
        <input type="text" id="property-background" placeholder="#ffffff or transparent">
    `;

    const inputs = [
        { id: 'property-text', key: 'text', isStyle: false },
        { id: 'property-width', key: 'width', isStyle: true },
        { id: 'property-height', key: 'height', isStyle: true },
        { id: 'property-color', key: 'color', isStyle: true },
        { id: 'property-font-size', key: 'fontSize', isStyle: true },
        { id: 'property-alignment', key: 'textAlign', isStyle: true },
        { id: 'property-spacing', key: 'padding', isStyle: true },
        { id: 'property-border', key: 'border', isStyle: true },
        { id: 'property-background', key: 'background', isStyle: true }
    ];

    inputs.forEach(({ id, key, isStyle }) => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.addEventListener('input', (e) => {
                if (!selectedElementId) return;
                const value = e.target.value;

                if (isStyle) {
                    updateElement(currentModel, selectedElementId, { styles: { [key]: value } });
                } else {
                    updateElement(currentModel, selectedElementId, { [key]: value });
                }
                notifyChange();
            });
        }
    });
}

/**
 * Handles Delete and Escape keyboard events.
 */
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Prevent deleting element when typing inside form fields
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
            removeElement(currentModel, selectedElementId);
            selectedElementId = null;
            notifyChange();
        }

        if (e.key === 'Escape') {
            selectedElementId = null;
            updatePropertiesPanel();
            renderCanvas();
        }
    });
}

/**
 * Triggers callback and re-renders.
 */
function notifyChange() {
    renderCanvas();
    updatePropertiesPanel();
    if (typeof onModelChangeCallback === 'function') {
        onModelChangeCallback(currentModel);
    }
}

/**
 * Refreshes canvas DOM representation from current UI model.
 */
export function renderCanvas() {
    const pageCanvas = document.querySelector('.page-canvas');
    if (!pageCanvas) return;

    pageCanvas.innerHTML = '';

    const allElements = getAllElements(currentModel);

    // Toggle Empty State visibility
    if (!currentModel.children || currentModel.children.length === 0) {
        pageCanvas.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">+</div>
                <h2>Start designing your website</h2>
                <p>Select a component from the left panel and add it to your canvas.</p>
                <button class="empty-button">Add your first component</button>
            </div>
        `;
        setupComponentPalette();
        return;
    }

    // Render components recursively
    currentModel.children.forEach(child => {
        const renderedNode = createDOMNode(child);
        pageCanvas.appendChild(renderedNode);
    });
}

/**
 * Maps model element to visual DOM element on canvas.
 * @param {Object} item - Element object from UI model
 * @returns {HTMLElement}
 */
function createDOMNode(item) {
    const wrapper = document.createElement('div');
    wrapper.dataset.id = item.id;
    wrapper.style.position = 'relative';
    wrapper.style.margin = '8px 0';
    wrapper.style.cursor = 'pointer';
    wrapper.style.boxSizing = 'border-box';

    // Selection border
    if (item.id === selectedElementId) {
        wrapper.style.outline = '2px solid #2563eb';
        wrapper.style.outlineOffset = '2px';
    } else {
        wrapper.style.outline = '1px dashed #cbd5e1';
    }

    // Apply model styles
    const styles = item.styles || {};
    wrapper.style.width = styles.width || 'auto';
    wrapper.style.height = styles.height || 'auto';
    wrapper.style.color = styles.color || 'inherit';
    wrapper.style.fontSize = styles.fontSize || 'inherit';
    wrapper.style.textAlign = styles.textAlign || 'left';
    wrapper.style.padding = styles.padding || '0';
    wrapper.style.border = styles.border || 'none';
    wrapper.style.background = styles.background || 'transparent';

    // Render component inner markup
    wrapper.appendChild(renderComponentContent(item));

    // Canvas Selection Click Event
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedElementId = item.id;
        renderCanvas();
        updatePropertiesPanel();
    });

    return wrapper;
}

/**
 * Creates visual placeholders for different component types.
 * @param {Object} item
 * @returns {HTMLElement}
 */
function renderComponentContent(item) {
    const container = document.createElement('div');
    const text = item.text || '';

    switch (item.type) {
        case 'text':
            container.innerHTML = `<h2 style="margin:0;">${escapeHTML(text)}</h2>`;
            break;
        case 'button':
            container.innerHTML = `<button style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; pointer-events: none;">${escapeHTML(text)}</button>`;
            break;
        case 'image':
            container.innerHTML = `<div style="background: #e2e8f0; border: 1px dashed #94a3b8; height: 120px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px;">📷 ${escapeHTML(text)}</div>`;
            break;
        case 'input':
            container.innerHTML = `<input type="text" placeholder="${escapeHTML(text)}" disabled style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">`;
            break;
        case 'card':
            container.innerHTML = `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin-top:0; margin-bottom: 8px; font-size: 16px;">${escapeHTML(text)}</h3>
                    <p style="margin:0; color: #64748b; font-size: 13px;">This is a simple card description block.</p>
                </div>`;
            break;
        case 'navbar':
            container.innerHTML = `
                <nav style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; color: white; padding: 12px 20px; border-radius: 4px;">
                    <strong style="font-size: 16px;">${escapeHTML(text)}</strong>
                    <div style="display: flex; gap: 12px; font-size: 13px; opacity: 0.8;">
                        <span>Home</span>
                        <span>About</span>
                        <span>Contact</span>
                    </div>
                </nav>`;
            break;
        case 'section':
            container.innerHTML = `
                <section style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <h3 style="margin: 0 0 8px 0;">${escapeHTML(text)}</h3>
                    <p style="margin: 0; color: #475569; font-size: 14px;">Section container holding layout elements.</p>
                </section>`;
            break;
        case 'grid':
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 8px;">
                    <div style="background: #e2e8f0; padding: 16px; text-align: center; border-radius: 4px; font-size: 12px;">Col 1</div>
                    <div style="background: #e2e8f0; padding: 16px; text-align: center; border-radius: 4px; font-size: 12px;">Col 2</div>
                    <div style="background: #e2e8f0; padding: 16px; text-align: center; border-radius: 4px; font-size: 12px;">Col 3</div>
                </div>`;
            break;
        case 'footer':
            container.innerHTML = `
                <footer style="padding: 16px; background: #0f172a; color: #94a3b8; text-align: center; font-size: 12px; border-radius: 4px;">
                    ${escapeHTML(text)}
                </footer>`;
            break;
        case 'container':
        default:
            container.innerHTML = `
                <div style="border: 1px dashed #94a3b8; padding: 16px; background: #ffffff; min-height: 50px;">
                    <span style="font-size: 11px; color: #94a3b8;">${escapeHTML(text)}</span>
                </div>`;
            break;
    }

    return container;
}

/**
 * Updates properties panel controls when selection changes.
 */
export function updatePropertiesPanel() {
    const noSelection = document.querySelector('.no-selection');
    const propertySection = document.querySelector('.property-section');

    if (!selectedElementId) {
        if (noSelection) noSelection.classList.remove('hidden');
        if (propertySection) propertySection.classList.add('hidden');
        return;
    }

    const elem = getElement(currentModel, selectedElementId);
    if (!elem) {
        selectedElementId = null;
        if (noSelection) noSelection.classList.remove('hidden');
        if (propertySection) propertySection.classList.add('hidden');
        return;
    }

    if (noSelection) noSelection.classList.add('hidden');
    if (propertySection) propertySection.classList.remove('hidden');

    const styles = elem.styles || {};

    setInputValue('property-text', elem.text || '');
    setInputValue('property-width', styles.width || 'auto');
    setInputValue('property-height', styles.height || 'auto');
    setInputValue('property-color', styles.color || '#000000');
    setInputValue('property-font-size', styles.fontSize || '16px');
    setInputValue('property-alignment', styles.textAlign || 'left');
    setInputValue('property-spacing', styles.padding || '8px');
    setInputValue('property-border', styles.border || 'none');
    setInputValue('property-background', styles.background || 'transparent');
}

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
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