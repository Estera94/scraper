<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Data Export Reports</h2>
          <p class="text-sm text-gray-600 mb-6">
            Generate and download comprehensive reports of your scraped data in various formats.
          </p>

          <!-- Report Type Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                v-for="type in reportTypes"
                :key="type.value"
                class="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors"
                :class="selectedReportType === type.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <input
                  type="radio"
                  :value="type.value"
                  v-model="selectedReportType"
                  class="mr-3 text-indigo-600"
                />
                <div>
                  <div class="font-medium text-gray-900">{{ type.label }}</div>
                  <div class="text-sm text-gray-500">{{ type.description }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Format Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div class="flex flex-wrap gap-3">
              <label
                v-for="format in formats"
                :key="format.value"
                class="flex items-center px-4 py-2 border-2 rounded-md cursor-pointer transition-colors"
                :class="selectedFormat === format.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'"
              >
                <input
                  type="radio"
                  :value="format.value"
                  v-model="selectedFormat"
                  class="mr-2 text-indigo-600"
                />
                <span class="font-medium">{{ format.label }}</span>
              </label>
            </div>
          </div>

          <!-- Filters Section -->
          <div class="border-t border-gray-200 pt-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Filters (Optional)</h3>
            
            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  v-model="filters.startDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  v-model="filters.endDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <!-- Company Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Companies (Leave empty for all)
              </label>
              <div v-if="companiesLoading" class="text-sm text-gray-500 py-2">
                Loading companies...
              </div>
              <div v-else-if="companies.length === 0" class="text-sm text-gray-500 py-2">
                No companies available
              </div>
              <div v-else class="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                <label
                  v-for="company in companies"
                  :key="company.id"
                  class="flex items-center py-1 px-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    :value="company.id"
                    v-model="filters.companyIds"
                    class="mr-2 text-indigo-600"
                  />
                  <span class="text-sm text-gray-700">
                    {{ company.displayName || company.domain }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Data Types Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Data Types (Leave empty for all)
              </label>
              <div class="flex flex-wrap gap-3">
                <label
                  v-for="dataType in dataTypes"
                  :key="dataType.value"
                  class="flex items-center px-3 py-1 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  :class="filters.dataTypes.includes(dataType.value)
                    ? 'bg-indigo-50 border-indigo-500'
                    : ''"
                >
                  <input
                    type="checkbox"
                    :value="dataType.value"
                    v-model="filters.dataTypes"
                    class="mr-2 text-indigo-600"
                  />
                  <span class="text-sm text-gray-700">{{ dataType.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ error }}</div>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="mb-4 rounded-md bg-green-50 p-4">
            <div class="text-sm text-green-700">{{ success }}</div>
          </div>

          <!-- Generate Button -->
          <div class="flex gap-4">
            <button
              @click="generateReport"
              :disabled="isGenerating"
              class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
            >
              <span v-if="isGenerating" class="mr-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span>{{ isGenerating ? 'Generating...' : 'Generate Report' }}</span>
            </button>
            <button
              @click="clearFilters"
              class="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from '../components/NavBar.vue';
import { getCompanies } from '../services/api.js';
import {
  exportCompanies,
  exportContacts,
  exportScrapes,
  exportAll
} from '../services/reports.js';

const reportTypes = [
  {
    value: 'companies',
    label: 'Company & LinkedIn Export',
    description: 'All company data with LinkedIn profiles and latest snapshots'
  },
  {
    value: 'contacts',
    label: 'Key Contacts Export',
    description: 'All LinkedIn contacts with company information'
  },
  {
    value: 'scrapes',
    label: 'Scrape History Export',
    description: 'Complete history of all scraping runs and results'
  },
  {
    value: 'all',
    label: 'All Data Export',
    description: 'Combined export of all data types (recommended for JSON format)'
  }
];

const formats = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' }
];

const dataTypes = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'phone', label: 'Phone' },
  { value: 'whmcs', label: 'WHMCS' },
  { value: 'customKeywords', label: 'Custom Keywords' }
];

const selectedReportType = ref('companies');
const selectedFormat = ref('csv');
const companies = ref([]);
const companiesLoading = ref(true);
const isGenerating = ref(false);
const error = ref(null);
const success = ref(null);

const filters = ref({
  startDate: '',
  endDate: '',
  companyIds: [],
  dataTypes: []
});

const loadCompanies = async () => {
  companiesLoading.value = true;
  try {
    const response = await getCompanies();
    companies.value = response.companies || [];
  } catch (err) {
    console.error('Failed to load companies:', err);
  } finally {
    companiesLoading.value = false;
  }
};

const generateReport = async () => {
  isGenerating.value = true;
  error.value = null;
  success.value = null;

  try {
    // Build filters object
    const exportFilters = {
      startDate: filters.value.startDate || null,
      endDate: filters.value.endDate || null,
      companyIds: filters.value.companyIds.length > 0 ? filters.value.companyIds : null,
      dataTypes: filters.value.dataTypes.length > 0 ? filters.value.dataTypes : null
    };

    // Call appropriate export function
    switch (selectedReportType.value) {
      case 'companies':
        await exportCompanies(exportFilters, selectedFormat.value);
        break;
      case 'contacts':
        await exportContacts(exportFilters, selectedFormat.value);
        break;
      case 'scrapes':
        await exportScrapes(exportFilters, selectedFormat.value);
        break;
      case 'all':
        await exportAll(exportFilters, selectedFormat.value);
        break;
      default:
        throw new Error('Invalid report type');
    }

    success.value = 'Report generated and downloaded successfully!';
    setTimeout(() => {
      success.value = null;
    }, 5000);
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to generate report';
    console.error('Export error:', err);
  } finally {
    isGenerating.value = false;
  }
};

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    companyIds: [],
    dataTypes: []
  };
  error.value = null;
  success.value = null;
};

onMounted(() => {
  loadCompanies();
});
</script>

