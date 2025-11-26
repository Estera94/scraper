import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_FILE = path.join(__dirname, '../../results.json');

export async function readResults() {
  try {
    const data = await fs.readFile(RESULTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveResults(results) {
  try {
    await fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving results:', error);
    throw error;
  }
}

export async function addResult(website, scrapedData) {
  try {
    const results = await readResults();
    
    const newResult = {
      website: website,
      results: scrapedData,
      timestamp: new Date().toISOString()
    };
    
    results.push(newResult);
    await saveResults(results);
    
    return newResult;
  } catch (error) {
    console.error('Error adding result:', error);
    throw error;
  }
}

export async function deleteResult(index) {
  try {
    const results = await readResults();
    
    if (index < 0 || index >= results.length) {
      throw new Error('Invalid index');
    }
    
    results.splice(index, 1);
    await saveResults(results);
    
    return true;
  } catch (error) {
    console.error('Error deleting result:', error);
    throw error;
  }
}

export async function deleteAllResults() {
  try {
    await saveResults([]);
    return true;
  } catch (error) {
    console.error('Error deleting all results:', error);
    throw error;
  }
}

