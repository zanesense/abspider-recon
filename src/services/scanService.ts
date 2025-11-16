// ... existing code ...

// Add this function to the scanService file
export const deleteScan = async (id: string): Promise<void> => {
  console.log(`[Delete Scan] Deleting scan ${id}`);
  const index = scansCache.findIndex(s => s.id === id);
  if (index !== -1) {
    scansCache.splice(index, 1);
    saveScansToStorage(scansCache);
  } else {
    throw new Error('Scan not found');
  }
};

// ... existing code ...