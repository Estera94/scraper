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
              @click="refreshCompanies" 
              :disabled="companiesLoading"
              class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Refresh Companies
            </button>
          </div>

          <div v-if="formError" class="mt-4 rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ formError }}</div>
          </div>

          <div v-if="isScraping" class="mt-6 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="mt-2 text-gray-600">Scraping websites... This may take a few moments.</p>
          </div>
        </div>

        <CompanyList
          :companies="companies"
          :loading="companiesLoading"
          :error="companiesError"
          @delete="handleDeleteCompany"
          @delete-all="handleDeleteAllCompanies"
          @refresh="refreshCompanies"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import WebsiteForm from '../components/WebsiteForm.vue';
import InfoSelector from '../components/InfoSelector.vue';
import CompanyList from '../components/Company/CompanyList.vue';
import NavBar from '../components/NavBar.vue';
import { scrapeWebsites, deleteCompany, deleteAllCompanies } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';
import { useCompanies } from '../composables/useCompanies.js';

const websites = ref([]);
const infoTypes = ref([]);
const isScraping = ref(false);
const formError = ref(null);

const {
  companies,
  companiesLoading,
  companiesError,
  fetchCompanies,
  removeCompanyFromList
} = useCompanies();

const startScraping = async () => {
  if (websites.value.length === 0 || infoTypes.value.length === 0) {
    formError.value = 'Please add at least one website and select at least one information type.';
    return;
  }

  isScraping.value = true;
  formError.value = null;

  try {
    await scrapeWebsites(websites.value, infoTypes.value);
    await fetchCompanies();
    await updateUserCredits();
  } catch (err) {
    if (err.response?.status === 402) {
      formError.value = `Insufficient credits. You need ${err.response.data.required} credits but only have ${err.response.data.current}. Please purchase more credits.`;
    } else {
      formError.value = err.response?.data?.error || err.message || 'An error occurred while scraping.';
    }
    console.error('Scraping error:', err);
  } finally {
    isScraping.value = false;
  }
};

const refreshCompanies = async () => {
  try {
    await fetchCompanies();
  } catch (err) {
    formError.value = err.response?.data?.error || err.message || 'Failed to refresh companies.';
  }
};

const handleDeleteCompany = async (id) => {
  if (!confirm('Delete this company profile? This removes its history.')) {
    return;
  }

  try {
    await deleteCompany(id);
    removeCompanyFromList(id);
  } catch (err) {
    formError.value = err.response?.data?.error || err.message || 'Failed to delete company.';
    console.error('Delete company error:', err);
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

const handleDeleteAllCompanies = async () => {
  if (!confirm('Delete all company profiles? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteAllCompanies();
    await fetchCompanies();
  } catch (err) {
    formError.value = err.response?.data?.error || err.message || 'Failed to delete all companies.';
    console.error('Delete all companies error:', err);
  }
};

onMounted(() => {
  fetchCompanies();
});
</script>

