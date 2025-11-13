/**
 * Business Form Persistence System
 * Saves and restores form data for business forms using setJSON/getJSON
 */

import { setJSON } from '../../utility/setJSON.js';
import { getJSON } from '../../utility/getJSON.js';

class BusinessFormPersistence {
    constructor(formId = 'socialAutomationForm', storageKey = 'business-social-form-data') {
        this.formId = formId;
        this.storageKey = storageKey;
        this.form = null;
        this.saveTimeout = null;
        this.initialized = false;
    }

    /**
     * Initialize the form persistence system
     */
    init() {
        try {
            this.form = document.getElementById(this.formId);
            if (!this.form) {
                console.warn(`Form with ID '${this.formId}' not found`);
                return false;
            }

            // Restore saved data on page load
            this.restoreFormData();
            
            // Set up event listeners for auto-save
            this.attachEventListeners();
            
            // Save on page unload
            this.attachUnloadListener();
            
            this.initialized = true;
            console.log('Business Form Persistence initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Business Form Persistence:', error);
            return false;
        }
    }

    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        if (!this.form) return;

        // Listen to all input, select, and textarea changes
        const formElements = this.form.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            ['input', 'change', 'blur'].forEach(eventType => {
                element.addEventListener(eventType, () => {
                    this.debouncedSave();
                });
            });
        });

        // Listen to grid item selections
        const gridItems = this.form.querySelectorAll('.grid-item, .grid-item1');
        gridItems.forEach(item => {
            item.addEventListener('click', () => {
                // Small delay to ensure selection state is updated
                setTimeout(() => {
                    this.debouncedSave();
                }, 50);
            });
        });

        // Listen to day toggle selections
        const dayToggles = this.form.querySelectorAll('.day-toggle');
        dayToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                // Small delay to ensure selection state is updated
                setTimeout(() => {
                    this.debouncedSave();
                }, 50);
            });
        });
    }

    /**
     * Attach page unload listener to save data
     */
    attachUnloadListener() {
        window.addEventListener('beforeunload', () => {
            this.saveFormData();
        });

        // Also save when page becomes hidden (mobile/tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveFormData();
            }
        });
    }

    /**
     * Debounced save to prevent excessive saves
     */
    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveFormData();
        }, 500); // Save 500ms after last change
    }

    /**
     * Collect all form data and save to localStorage
     */
    saveFormData() {
        if (!this.form) return;

        try {
            const formData = {
                // Regular form fields
                inputs: {},
                
                // Grid selections
                gridSelections: {},
                
                // Timestamp for debugging
                lastSaved: new Date().toISOString()
            };

            // Collect input, select, and textarea values
            const formElements = this.form.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                if (element.id && element.type !== 'file') {
                    let value = element.value;
                    
                    // Special handling for different input types
                    if (element.type === 'checkbox') {
                        value = element.checked;
                    } else if (element.type === 'radio') {
                        if (element.checked) {
                            formData.inputs[element.name] = value;
                        }
                        return; // Skip individual radio buttons
                    }
                    
                    formData.inputs[element.id] = value;
                }
            });

            // Collect grid selections by container ID
            const gridContainers = this.form.querySelectorAll('[id].grid-selection, .grid-selection[id]');
            gridContainers.forEach(container => {
                const containerId = container.id;
                if (containerId) {
                    const selectedItems = container.querySelectorAll('.grid-item.selected, .grid-item1.selected');
                    const selectedValues = Array.from(selectedItems).map(item => item.dataset.value || item.textContent.trim());
                    if (selectedValues.length > 0) {
                        formData.gridSelections[containerId] = selectedValues;
                        console.log(`[BusinessFormPersistence] Saving grid selections for ${containerId}:`, selectedValues);
                    }
                }
            });

            // Collect day toggle selections
            const dayToggles = this.form.querySelectorAll('.day-toggle.active');
            if (dayToggles.length > 0) {
                formData.dayToggles = {};
                dayToggles.forEach(toggle => {
                    const day = toggle.dataset.day || toggle.id;
                    if (day) {
                        formData.dayToggles[day] = true;
                    }
                });
                console.log(`[BusinessFormPersistence] Saving day toggles:`, Object.keys(formData.dayToggles));
            }
            const saved = setJSON(this.storageKey, formData);
            if (saved) {
                console.log('Form data saved successfully');
            }
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }

    /**
     * Restore form data from localStorage
     */
    restoreFormData() {
        if (!this.form) return;

        try {
            const savedData = getJSON(this.storageKey, null);
            if (!savedData) {
                console.log('No saved form data found');
                return;
            }

            console.log('Restoring form data from:', savedData.lastSaved);

            // Restore regular form fields
            if (savedData.inputs) {
                Object.entries(savedData.inputs).forEach(([elementId, value]) => {
                    const element = document.getElementById(elementId);
                    if (element && value !== null && value !== undefined && value !== '' && element.type !== 'file') {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                        
                        // Trigger change event to update any dependent UI
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }

            // Restore grid selections
            if (savedData.gridSelections) {
                console.log('[BusinessFormPersistence] Restoring grid selections:', savedData.gridSelections);
                Object.entries(savedData.gridSelections).forEach(([containerId, selectedValues]) => {
                    const container = document.getElementById(containerId);
                    if (container && Array.isArray(selectedValues)) {
                        console.log(`[BusinessFormPersistence] Restoring ${selectedValues.length} selections for ${containerId}`);
                        // First, clear all selections in this container
                        container.querySelectorAll('.grid-item.selected, .grid-item1.selected').forEach(item => {
                            item.classList.remove('selected');
                        });

                        // Then restore saved selections
                        selectedValues.forEach(value => {
                            const item = container.querySelector(`[data-value="${value}"]`);
                            if (item) {
                                item.classList.add('selected');
                                
                                // For single selections, also update the hidden input
                                const gridContainer = item.closest('.grid-selection');
                                if (gridContainer && gridContainer.dataset.type === 'single') {
                                    const hiddenInput = document.getElementById(gridContainer.dataset.name);
                                    if (hiddenInput) {
                                        hiddenInput.value = value;
                                        console.log(`[BusinessFormPersistence] Updated hidden input ${gridContainer.dataset.name} to ${value}`);
                                    }
                                }
                            } else {
                                console.warn(`[BusinessFormPersistence] Could not find grid item with data-value="${value}" in ${containerId}`);
                            }
                        });

                        // For multiple selections, update the hidden input with all selected values
                        const gridContainer = container;
                        if (gridContainer && gridContainer.dataset.type === 'multiple') {
                            const hiddenInput = document.getElementById(gridContainer.dataset.name);
                            if (hiddenInput) {
                                hiddenInput.value = selectedValues.join(',');
                                console.log(`[BusinessFormPersistence] Updated hidden input ${gridContainer.dataset.name} to ${hiddenInput.value}`);
                            }
                        }
                    } else {
                        console.warn(`[BusinessFormPersistence] Could not find container ${containerId} or invalid selectedValues`);
                    }
                });
            }

            // Restore day toggle selections
            if (savedData.dayToggles) {
                console.log('[BusinessFormPersistence] Restoring day toggles:', savedData.dayToggles);
                Object.keys(savedData.dayToggles).forEach(day => {
                    const toggle = this.form.querySelector(`.day-toggle[data-day="${day}"]`) || this.form.querySelector(`#${day}`);
                    if (toggle) {
                        toggle.classList.add('active');
                        console.log(`[BusinessFormPersistence] Restored day toggle: ${day}`);
                    } else {
                        console.warn(`[BusinessFormPersistence] Could not find day toggle: ${day}`);
                    }
                });
            }

            console.log('Form data restored successfully');
        } catch (error) {
            console.error('Error restoring form data:', error);
        }
    }

    /**
     * Clear saved form data
     */
    clearSavedData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Saved form data cleared');
        } catch (error) {
            console.error('Error clearing saved data:', error);
        }
    }

    /**
     * Get saved form data (for debugging)
     */
    getSavedData() {
        return getJSON(this.storageKey, null);
    }

    /**
     * Check if form has unsaved changes
     */
    hasUnsavedChanges() {
        const savedData = getJSON(this.storageKey, null);
        if (!savedData) return false;

        // Compare current form state with saved data
        const currentData = this.getCurrentFormData();
        return JSON.stringify(currentData) !== JSON.stringify(savedData);
    }

    /**
     * Get current form data without saving
     */
    getCurrentFormData() {
        if (!this.form) return null;

        const formData = { inputs: {}, gridSelections: {} };

        // Collect current input values
        const formElements = this.form.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            if (element.id) {
                let value = element.value;
                if (element.type === 'checkbox') {
                    value = element.checked;
                }
                formData.inputs[element.id] = value;
            }
        });

        // Collect current grid selections
        const gridContainers = this.form.querySelectorAll('[id] .grid-container, .grid-container[id]');
        gridContainers.forEach(container => {
            const containerId = container.id || container.closest('[id]')?.id;
            if (containerId) {
                const selectedItems = container.querySelectorAll('.grid-item.selected');
                formData.gridSelections[containerId] = Array.from(selectedItems).map(item => item.dataset.value || item.textContent.trim());
            }
        });

        return formData;
    }
}

// Create and export a default instance
const businessFormPersistence = new BusinessFormPersistence();

// Auto-initialize when DOM is ready (only if default form exists)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('socialAutomationForm')) {
            businessFormPersistence.init();
        }
    });
} else {
    // DOM is already ready
    if (document.getElementById('socialAutomationForm')) {
        businessFormPersistence.init();
    }
}

export { BusinessFormPersistence, businessFormPersistence };
