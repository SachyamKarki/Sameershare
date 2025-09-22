export const getLocalizedNumber = (num, t) => {
  try {
    if (!t) {
      return num.toString(); // Fallback if no translation function
    }
    
    const numbers = t('common.numbers', { returnObjects: true });
    
    // Check if numbers is valid
    if (!Array.isArray(numbers) || numbers.length !== 10) {
      return num.toString(); // Fallback to original number
    }
    
    const digits = num.toString().split('');
    const result = digits.map(d => {
      const index = parseInt(d);
      return numbers[index] || d; // Fallback to original digit if not found
    }).join('');
    
    return result;
  } catch (error) {
    return num.toString(); // Fallback to original number
  }
};

/**
 * Detects if a recording name is a default name and extracts the number
 * @param {string} name - The recording name to check
 * @returns {object} - { isDefault: boolean, number: number|null }
 */
export const parseDefaultRecordingName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isDefault: false, number: null };
  }

  // Pattern to match default recording names in any language
  // Examples: "Recording 1", "Grabación 2", "Enregistrement 3", etc.
  const defaultPattern = /^[^\d]+\s*(\d+)$/;
  const match = name.match(defaultPattern);
  
  if (match) {
    return {
      isDefault: true,
      number: parseInt(match[1], 10)
    };
  }
  
  return { isDefault: false, number: null };
};

/**
 * Generates a translated default recording name
 * @param {number} number - The recording number
 * @param {function} t - Translation function
 * @returns {string} - Translated default name
 */
export const getTranslatedDefaultName = (number, t) => {
  try {
    if (!t || !number) {
      return `Recording ${number}`;
    }
    
    return t('recordings.defaultName', { number: getLocalizedNumber(number, t) });
  } catch (error) {
    return `Recording ${number}`;
  }
};
