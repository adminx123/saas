/**
 * Store JSON data in localStorage
 * Converts JavaScript objects to JSON strings before storing
 * 
 * @param {string} name - The localStorage key
 * @param {object|array|any} value - The data to be stored as JSON
 * @returns {boolean} - True if successful, false otherwise
 */
export function setJSON(name, value) {
    try {
        if (name === undefined || name === null || name === '') {
            console.error('Invalid key name provided to setJSON');
            return false;
        }
        
        if (value === undefined) {
            console.warn(`Warning: Storing undefined value for ${name} in localStorage`);
            localStorage.removeItem(name);
            return true;
        }
        
        // Convert value to JSON string
        const jsonString = JSON.stringify(value);
        
        // Store in localStorage directly (no URL encoding)
        localStorage.setItem(name, jsonString);
        return true;
    } catch (error) {
        console.error(`Error storing JSON in localStorage (${name}):`, error);
        return false;
    }
}

// Set default export
export default setJSON;