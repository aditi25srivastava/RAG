export const saveToHistory = (type, query, response) => {
  try {
    const history = getHistory();
    const newItem = {
      id: Date.now().toString(),
      type, // 'chat' or 'voice'
      query,
      response,
      timestamp: new Date().toISOString()
    };
    
    // Keep only the last 50 items
    const updatedHistory = [newItem, ...history].slice(0, 50);
    localStorage.setItem('researchgpt_history', JSON.stringify(updatedHistory));
    
    // Dispatch a custom event so the App can update the UI
    window.dispatchEvent(new Event('history_updated'));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = () => {
  try {
    const data = localStorage.getItem('researchgpt_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem('researchgpt_history');
  window.dispatchEvent(new Event('history_updated'));
};
