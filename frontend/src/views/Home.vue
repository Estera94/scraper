<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <WebsiteForm v-model="websites" />
          <InfoSelector v-model="infoTypes" />
          
          <div class="mt-6 flex gap-4">
            <button 
              @click="startScraping" 
              :disabled="isScraping || websites.length === 0 || infoTypes.length === 0"
              class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <span v-if="isScraping">Scraping...</span>
              <span v-else>Start Scraping</span>
            </button>
            
            <button 
              @click="loadResults" 
              :disabled="isLoading"
              class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Refresh Results
            </button>
          </div>

          <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>

          <div v-if="isScraping" class="mt-6 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="mt-2 text-gray-600">Scraping websites... This may take a few moments.</p>
          </div>
        </div>

        <ResultsList :results="results" @delete="handleDelete" @delete-all="handleDeleteAll" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import WebsiteForm from '../components/WebsiteForm.vue';
import InfoSelector from '../components/InfoSelector.vue';
import ResultsList from '../components/ResultsList.vue';
import NavBar from '../components/NavBar.vue';
import { scrapeWebsites, getResults, deleteResult, deleteAllResults } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';

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
    // Update user credits in navbar
    await updateUserCredits();
  } catch (err) {
    if (err.response?.status === 402) {
      error.value = `Insufficient credits. You need ${err.response.data.required} credits but only have ${err.response.data.current}. Please purchase more credits.`;
    } else {
      error.value = err.response?.data?.error || err.message || 'An error occurred while scraping.';
    }
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

const handleDelete = async (id) => {
  try {
    await deleteResult(id);
    await loadResults();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete result.';
    console.error('Delete error:', err);
  }
};

// Update NavBar user credits after operations
const updateUserCredits = async () => {
  try {
    const user = await getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to update user credits:', error);
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

