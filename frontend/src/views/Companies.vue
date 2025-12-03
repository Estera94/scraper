<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Companies</h2>
          
          <!-- Search Bar -->
          <div class="mb-6">
            <div class="relative">
              <input
                type="text"
                v-model="searchQuery"
                @input="debouncedSearch"
                placeholder="Search by domain or company name..."
                class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                class="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Filters Panel -->
          <div class="border-t border-gray-200 pt-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                @click="clearFilters"
                class="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear All
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <!-- Date Range -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  v-model="filters.startDate"
                  @change="applyFilters"
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
                  @change="applyFilters"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <!-- Sort Options -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  v-model="filters.sortBy"
                  @change="applyFilters"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Date Created</option>
                  <option value="domain">Domain Name</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  v-model="filters.sortOrder"
                  @change="applyFilters"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            <!-- Checkbox Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="filters.hasLinkedIn === true"
                  @change="filters.hasLinkedIn = filters.hasLinkedIn === true ? null : true; applyFilters()"
                  class="mr-2 text-indigo-600"
                />
                <label class="text-sm text-gray-700">Has LinkedIn Data</label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="filters.hasContacts === true"
                  @change="filters.hasContacts = filters.hasContacts === true ? null : true; applyFilters()"
                  class="mr-2 text-indigo-600"
                />
                <label class="text-sm text-gray-700">Has Contacts</label>
              </div>
            </div>

            <!-- Data Types Filter -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Data Types Found
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
                    @change="applyFilters"
                    class="mr-2 text-indigo-600"
                  />
                  <span class="text-sm text-gray-700">{{ dataType.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Results Count -->
          <div class="mb-4 text-sm text-gray-600">
            Showing {{ companies.length }} {{ companies.length === 1 ? 'company' : 'companies' }}
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2">Loading companies...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="companies.length === 0"
          class="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500"
        >
          <p v-if="hasActiveFilters">No companies match your filters. Try adjusting your search criteria.</p>
          <p v-else>No companies yet. Run a scrape to create your first company profile.</p>
        </div>

        <!-- Company List -->
        <div v-else class="space-y-4">
          <div
            v-for="company in companies"
            :key="company.id"
            class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-semibold text-gray-900">
                    {{ company.displayName || company.domain }}
                  </h3>
                  <span class="text-sm text-gray-500">{{ company.domain }}</span>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  <span>Created: {{ formatDate(company.createdAt) }}</span>
                  <span>Updated: {{ formatDate(company.updatedAt) }}</span>
                </div>

                <!-- Indicators -->
                <div class="flex flex-wrap items-center gap-3">
                  <span
                    v-if="company.hasLinkedIn"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" />
                    </svg>
                    LinkedIn
                  </span>
                  <span
                    v-if="company.contactCount > 0"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ company.contactCount }} {{ company.contactCount === 1 ? 'contact' : 'contacts' }}
                  </span>
                  
                  <!-- Data Type Badges -->
                  <span
                    v-for="dataType in company.dataTypesFound"
                    :key="dataType"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {{ formatDataType(dataType) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <!-- Status Badge (if status exists) -->
                <span
                  v-if="company.status"
                  class="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium"
                  :class="getStatusBadgeClass(company.status)"
                  :style="getStatusBadgeStyle(company.status)"
                >
                  {{ company.status }}
                </span>
                
                <!-- Status Dropdown -->
                  <CompanyStatusDropdown
                    :company-id="company.id"
                    :status="company.status"
                    :custom-status-color-map="customStatusColors"
                    @status-changed="(newStatus) => handleStatusChanged(company.id, newStatus)"
                    @custom-status-created="loadCustomStatusColors"
                  />
                
                <router-link
                  :to="{ name: 'CompanyProfile', params: { id: company.id } }"
                  class="px-4 py-2 text-sm font-medium rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  View Profile
                </router-link>
                <button
                  type="button"
                  class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  @click="handleDelete(company.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import CompanyStatusDropdown from '../components/Company/CompanyStatusDropdown.vue';
import { getCompanies, deleteCompany, getCustomStatuses } from '../services/api.js';

const router = useRouter();

const companies = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');

const filters = ref({
  startDate: '',
  endDate: '',
  hasLinkedIn: null,
  hasContacts: null,
  dataTypes: [],
  sortBy: 'updatedAt',
  sortOrder: 'desc'
});

const dataTypes = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'whmcs', label: 'WHMCS' }
];

const hasActiveFilters = computed(() => {
  return searchQuery.value ||
    filters.value.startDate ||
    filters.value.endDate ||
    filters.value.hasLinkedIn !== null ||
    filters.value.hasContacts !== null ||
    filters.value.dataTypes.length > 0;
});

let searchTimeout = null;

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
};

const applyFilters = async () => {
  loading.value = true;
  error.value = null;

  try {
    const filterParams = {
      search: searchQuery.value || null,
      startDate: filters.value.startDate || null,
      endDate: filters.value.endDate || null,
      hasLinkedIn: filters.value.hasLinkedIn,
      hasContacts: filters.value.hasContacts,
      dataTypes: filters.value.dataTypes.length > 0 ? filters.value.dataTypes : null,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder
    };

    const response = await getCompanies(filterParams);
    companies.value = response.companies || [];
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load companies';
    console.error('Error loading companies:', err);
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  filters.value = {
    startDate: '',
    endDate: '',
    hasLinkedIn: null,
    hasContacts: null,
    dataTypes: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  };
  applyFilters();
};

const handleDelete = async (companyId) => {
  if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteCompany(companyId);
    await applyFilters();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete company';
  }
};

const handleStatusChanged = (companyId, newStatus) => {
  // Update the company in the list
  // The component already handled the API call, we just need to update local state
  const index = companies.value.findIndex(c => c.id === companyId);
  if (index !== -1) {
    companies.value[index] = { ...companies.value[index], status: newStatus };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDataType = (dataType) => {
  const labels = {
    linkedin: 'LinkedIn',
    email: 'Email',
    phone: 'Phone',
    twitter: 'Twitter',
    whmcs: 'WHMCS'
  };
  return labels[dataType] || dataType;
};

const customStatusColors = ref({});

const getStatusBadgeClass = (status) => {
  if (!status) return '';
  
  // Check if it's a custom status with saved color
  if (customStatusColors.value[status]) {
    return 'border';
  }
  
  // Default status colors
  const statusLower = status.toLowerCase();
  if (statusLower.includes('contacted')) {
    return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
  } else if (statusLower.includes('waiting') || statusLower.includes('response')) {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
  } else if (statusLower.includes('not interested')) {
    return 'bg-red-100 text-red-800 border border-red-300';
  } else {
    return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
};

const getStatusBadgeStyle = (status) => {
  if (!status || !customStatusColors.value[status]) return {};
  
  const color = customStatusColors.value[status];
  // Convert hex to RGB for background with opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    color: color,
    borderColor: color
  };
};

const loadCustomStatusColors = async () => {
  try {
    const response = await getCustomStatuses();
    const colorMap = {};
    (response.customStatuses || []).forEach(status => {
      colorMap[status.label] = status.color;
    });
    customStatusColors.value = colorMap;
  } catch (error) {
    console.error('Error loading custom status colors:', error);
  }
};

onMounted(() => {
  applyFilters();
  loadCustomStatusColors();
});
</script>

