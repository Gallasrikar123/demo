/**
 * UI Model Module
 * Manages the internal object tree representing the user interface.
 * Independent of the DOM.
 */

// Default style values for newly created elements
const DEFAULT_STYLES = {
    width: "auto",
    height: "auto",
    color: "#1f2937",
    fontSize: "16px",
    textAlign: "left",
    padding: "8px",
    margin: "0px",
    border: "none",
    background: "transparent"
};

// Default content per component type
const DEFAULT_CONTENTS = {
    container: { text: "Container Box" },
    text: { text: "Hello World" },
    button: { text: "Click Me" },
    image: { text: "Image Placeholder" },
    input: { text: "Enter text..." },
    card: { text: "Card Title" },
    navbar: { text: "Logo" },
    section: { text: "Section Content" },
    grid: { text: "Grid Container" },
    footer: { text: "© 2026 My Website" }
};

// Create the root page model object
export function createInitialModel() {
    return {
        id: "page",
        type: "page",
        children: []
    };
}

/**
 * Creates a new component model object.
 * @param {string} type - Component type (container, text, button, etc.)
 * @returns {Object} Newly created element object
 */
export function createElement(type) {
    const id = `element-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaults = DEFAULT_CONTENTS[type] || { text: type };

    return {
        id: id,
        type: type,
        text: defaults.text,
        children: [],
        styles: { ...DEFAULT_STYLES },
        attributes: {}
    };
}

/**
 * Adds an element to a parent element or the root model.
 * @param {Object} model - Root UI model
 * @param {Object} newElement - Element object to add
 * @param {string} [parentId="page"] - Target parent ID
 * @returns {boolean} Success status
 */
export function addElement(model, newElement, parentId = "page") {
    if (parentId === "page" || model.id === parentId) {
        model.children.push(newElement);
        return true;
    }

    const parent = getElement(model, parentId);
    if (parent) {
        parent.children.push(newElement);
        return true;
    }
    return false;
}

/**
 * Removes an element by ID from the model tree.
 * @param {Object} model - Root UI model
 * @param {string} id - ID of element to remove
 * @returns {boolean} True if removed
 */
export function removeElement(model, id) {
    const index = model.children.findIndex(child => child.id === id);
    if (index !== -1) {
        model.children.splice(index, 1);
        return true;
    }

    for (const child of model.children) {
        if (child.children && child.children.length > 0) {
            const removed = removeElement(child, id);
            if (removed) return true;
        }
    }
    return false;
}

/**
 * Updates properties/styles/text of an element in the model.
 * @param {Object} model - Root UI model
 * @param {string} id - Target element ID
 * @param {Object} updates - Properties to update
 * @returns {Object|null} Updated element or null
 */
export function updateElement(model, id, updates) {
    const element = getElement(model, id);
    if (!element) return null;

    if (updates.text !== undefined) {
        element.text = updates.text;
    }

    if (updates.styles) {
        element.styles = { ...element.styles, ...updates.styles };
    }

    if (updates.attributes) {
        element.attributes = { ...element.attributes, ...updates.attributes };
    }

    return element;
}

/**
 * Searches and retrieves an element by ID.
 * @param {Object} model - Root UI model or branch
 * @param {string} id - Target ID
 * @returns {Object|null}
 */
export function getElement(model, id) {
    if (model.id === id) return model;

    for (const child of model.children) {
        if (child.id === id) return child;
        if (child.children && child.children.length > 0) {
            const found = getElement(child, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Flattens all elements into an array.
 * @param {Object} model - Root UI model
 * @returns {Array} List of all elements
 */
export function getAllElements(model) {
    let elements = [];
    for (const child of model.children) {
        elements.push(child);
        if (child.children && child.children.length > 0) {
            elements = elements.concat(getAllElements(child));
        }
    }
    return elements;
}

/**
 * Clears all children from the model.
 * @param {Object} model - Root UI model
 */
export function clearModel(model) {
    model.children = [];
}

/**
 * Serializes model object to JSON string.
 * @param {Object} model
 * @returns {string} JSON string
 */
export function serializeModel(model) {
    return JSON.stringify(model, null, 2);
}

/**
 * Restores model object from JSON string.
 * @param {string} jsonString
 * @returns {Object}
 */
export function loadModel(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON model:", e);
        return createInitialModel();
    }
}