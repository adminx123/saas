/**
 * Retrieve and parse JSON data from localStorage
 * 
 * @param {string} name - The localStorage key
 * @param {any} defaultValue - Optional default value to return if key doesn't exist
 * @returns {any} - The parsed JSON data or the defaultValue if not found or parsing fails
 */
export function getJSON(name, defaultValue = null) {
    try {
        if (name === undefined || name === null || name === '') {
            console.error('Invalid key name provided to getJSON');
            return defaultValue;
        }
        
        // Get the raw value from localStorage
        const jsonString = localStorage.getItem(name);
        
        // If value doesn't exist, return the default value
        if (jsonString === null) {
            return defaultValue;
        }
        
        // Parse JSON string back to JavaScript object/array/value
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Error retrieving or parsing JSON from localStorage (${name}):`, error);
        return defaultValue;
    }
}

/**
 * Process a JSON response from any worker and store individual fields in localStorage
 * This is a generic utility that can be used by any component
 * 
 * @param {Object} jsonResponse - The JSON response from any worker
 * @param {string} prefix - Optional prefix for localStorage keys
 * @returns {Object} - The processed data (flattened key-value pairs)
 */
export function processJSONResponse(jsonResponse, prefix = '') {
    try {
        console.log('Processing JSON response:', jsonResponse);
        
        // Store the processed key-value pairs
        const processedData = {};
        
        // Import setLocal dynamically to avoid circular dependencies
        return import('./setlocal.js').then(module => {
            const setLocal = module.default || module.setLocal;
            
            // Function to flatten nested objects recursively
            function flattenAndStore(obj, currentPrefix = '') {
                if (!obj || typeof obj !== 'object') return;
                
                Object.entries(obj).forEach(([key, value]) => {
                    const fullKey = currentPrefix ? `${currentPrefix}_${key}` : key;
                    
                    if (value === null) {
                        // Store null values as empty strings
                        setLocal(fullKey, '');
                        processedData[fullKey] = '';
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        // Recursively process nested objects
                        flattenAndStore(value, fullKey);
                    } else if (Array.isArray(value)) {
                        // Store arrays as JSON strings
                        setLocal(fullKey, JSON.stringify(value));
                        processedData[fullKey] = JSON.stringify(value);
                    } else {
                        // Store primitive values directly
                        setLocal(fullKey, value.toString());
                        processedData[fullKey] = value.toString();
                    }
                });
            }
            
            // Process the worker response
            if (jsonResponse && typeof jsonResponse === 'object') {
                // If response has a data property (common pattern in API responses),
                // process the data object, otherwise process the entire response
                const dataToProcess = jsonResponse.data || jsonResponse;
                flattenAndStore(dataToProcess, prefix);
                
                return processedData;
            } else {
                console.error('Invalid JSON response format');
                return null;
            }
        }).catch(error => {
            console.error('Error importing setLocal module:', error);
            return null;
        });
    } catch (error) {
        console.error('Error processing JSON response:', error);
        return null;
    }
}

// Set default exports
export default getJSON;