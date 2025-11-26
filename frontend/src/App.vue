<template>
  <div class="app">
    <header class="app-header">
      <h1>Website Information Scraper</h1>
      <p>Extract LinkedIn, Email, Twitter, Phone, and WHMCS information from multiple websites</p>
    </header>

    <main class="app-main">
      <div class="form-container">
        <WebsiteForm v-model="websites" />
        <InfoSelector v-model="infoTypes" />
        
        <div class="action-buttons">
          <button 
            @click="startScraping" 
            :disabled="isScraping || websites.length === 0 || infoTypes.length === 0"
            class="scrape-btn"
          >
            <span v-if="isScraping">Scraping...</span>
            <span v-else>Start Scraping</span>
          </button>
          
          <button 
            @click="loadResults" 
            :disabled="isLoading"
            class="load-btn"
          >
            Load Saved Results
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="isScraping" class="progress-indicator">
          <div class="spinner"></div>
          <p>Scraping websites... This may take a few moments.</p>
        </div>
      </div>

      <ResultsList :results="results" @delete="handleDelete" @delete-all="handleDeleteAll" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import WebsiteForm from './components/WebsiteForm.vue';
import InfoSelector from './components/InfoSelector.vue';
import ResultsList from './components/ResultsList.vue';
import { scrapeWebsites, getResults, deleteResult, deleteAllResults } from './services/api.js';

const websites = ref([]);
const infoTypes = ref([]);
const results = ref([]);
const isScraping = ref(false);
const isLoading = ref(false);
const error = ref(null);

const startScraping = async () => {
  if (websites.value.length === 0 || infoTypes.value.length === 0) {
    error.value = 'Please add at least one website and select at least one information type.';
    return;
  }

  isScraping.value = true;
  error.value = null;

  try {
    const response = await scrapeWebsites(websites.value, infoTypes.value);
    results.value = response.results;
    
    // Reload all results to show the complete list
    await loadResults();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'An error occurred while scraping.';
    console.error('Scraping error:', err);
  } finally {
    isScraping.value = false;
  }
};

const loadResults = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await getResults();
    results.value = response.results || [];
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load results.';
    console.error('Load error:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (index) => {
  try {
    await deleteResult(index);
    await loadResults();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete result.';
    console.error('Delete error:', err);
  }
};

const handleDeleteAll = async () => {
  try {
    await deleteAllResults();
    await loadResults();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete all results.';
    console.error('Delete all error:', err);
  }
};

onMounted(() => {
  loadResults();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
}

.app-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.app-header p {
  color: #666;
  font-size: 1.1rem;
}

.app-main {
  display: flex;
  flex-direction: column;
}

.form-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.scrape-btn,
.load-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.scrape-btn {
  background-color: #4a90e2;
  color: white;
  flex: 1;
}

.scrape-btn:hover:not(:disabled) {
  background-color: #357abd;
}

.scrape-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.load-btn {
  background-color: #f0f0f0;
  color: #333;
}

.load-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.load-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
}

.progress-indicator {
  margin-top: 1.5rem;
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-indicator p {
  color: #666;
}
</style>

