<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        class="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
        @click="goBack"
      >
        ← Back to dashboard
      </button>

      <div v-if="companyProfileLoading" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Loading company profile...
      </div>

      <div v-else-if="companyProfileError" class="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
        {{ companyProfileError }}
        <button
          type="button"
          class="mt-3 px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white"
          @click="loadProfile"
        >
          Retry
        </button>
      </div>

      <div v-else-if="!company" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Company not found.
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ company.displayName || company.domain }}</h1>
              <p class="text-sm text-gray-500">
                Updated {{ formatDate(company.updatedAt) }}
              </p>
            </div>
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
                @status-changed="handleStatusChanged"
                @custom-status-created="loadCustomStatusColors"
              />
              
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                @click="handleDeleteCompany"
              >
                Delete profile
              </button>
            </div>
          </div>

          <div class="mt-6 border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Run scraper again</h2>
            <p class="text-sm text-gray-500 mb-4">
              Choose the signals you want to refresh. Custom keywords ride along automatically.
            </p>
            <InfoSelector v-model="infoTypes" />
            <div class="mt-4">
              <button
                type="button"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isScraping || infoTypes.length === 0"
                @click="handleRescrape"
              >
                <span v-if="isScraping">Scraping...</span>
                <span v-else>Run scraper</span>
              </button>
            </div>
            <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <CompanySnapshotCard :snapshot="company.latestSnapshot" />

          <div class="space-y-4">
            <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 class="text-xl font-semibold text-gray-900">LinkedIn insights</h3>
                  <p class="text-sm text-gray-500">
                    Pull company size, followers, and warm employee leads straight from LinkedIn.
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    :disabled="linkedinLoading || !linkedinProfile"
                    @click="handleDeleteLinkedInProfile"
                  >
                    Clear data
                  </button>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="isLinkedInScraping"
                  @click="handleLinkedInScrape"
                >
                  <span v-if="isLinkedInScraping">Scraping LinkedIn...</span>
                  <span v-else>Run LinkedIn scrape</span>
                </button>
                <!-- Credit system disabled -->
              </div>

              <div v-if="linkedinErrorMessage || linkedinError" class="mt-3 text-sm text-red-600">
                {{ linkedinErrorMessage || linkedinError }}
              </div>
              <div v-else-if="linkedinLoading" class="mt-3 text-sm text-gray-500">
                Loading LinkedIn data...
              </div>
            </div>

            <LinkedInStatsCard :profile="linkedinProfile" />

            <LinkedInContactsTable
              :contacts="linkedinContacts"
              :loading="linkedinLoading"
              :has-more="Boolean(linkedinCursor)"
              :company-id="companyId"
              @load-more="loadMoreLinkedInContacts"
              @delete="handleDeleteLinkedInContact"
              @created="handleContactCreated"
            />
          </div>
        </div>

        <CompanyHistoryList
          :scrapes="companyScrapes"
          :loading="companyProfileLoading"
          :has-more="hasMoreHistory"
          @load-more="loadMoreHistory"
          @delete="handleDeleteScrape"
        />

        <CompanyNotes
          :notes="notes"
          :loading="notesLoading"
          :error="notesError"
          @create="handleCreateNote"
          @delete="handleDeleteNote"
          @refresh="refreshNotes"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import InfoSelector from '../components/InfoSelector.vue';
import CompanySnapshotCard from '../components/Company/CompanySnapshotCard.vue';
import CompanyHistoryList from '../components/Company/CompanyHistoryList.vue';
import LinkedInStatsCard from '../components/Company/LinkedInStatsCard.vue';
import LinkedInContactsTable from '../components/Company/LinkedInContactsTable.vue';
import CompanyNotes from '../components/Company/CompanyNotes.vue';
import CompanyStatusDropdown from '../components/Company/CompanyStatusDropdown.vue';
import { useCompanies } from '../composables/useCompanies.js';
import {
  rescrapeCompany,
  deleteCompany,
  deleteCompanyScrape,
  scrapeCompanyLinkedIn,
  deleteCompanyLinkedIn,
  deleteLinkedInContact,
  createCompanyNote as apiCreateCompanyNote,
  deleteCompanyNote as apiDeleteCompanyNote,
  getCustomStatuses
} from '../services/api.js';

const route = useRoute();
const router = useRouter();
const companyId = computed(() => route.params.id);

const infoTypes = ref([]);
const isScraping = ref(false);
const formError = ref(null);
const linkedinErrorMessage = ref(null);
const isLinkedInScraping = ref(false);

const {
  activeCompany,
  companyScrapes,
  companyProfileLoading,
  companyProfileError,
  fetchCompanyProfile,
  resetCompanyProfile,
  hasMoreHistory,
  upsertCompanyInList,
  removeCompanyFromList,
  linkedinProfile,
  linkedinContacts,
  linkedinCursor,
  linkedinLoading,
  linkedinError,
  fetchLinkedInData,
  resetLinkedInData,
  notes,
  notesLoading,
  notesError,
  fetchCompanyNotes,
  resetNotes
} = useCompanies();

const company = computed(() => activeCompany.value);

const loadProfile = async (options = { append: false }) => {
  try {
    await fetchCompanyProfile(companyId.value, { append: options.append });
    if (!options.append && company.value?.latestSnapshot?.infoTypes?.length) {
      infoTypes.value = [...company.value.latestSnapshot.infoTypes];
    }
    if (!options.append) {
      resetLinkedInData();
      await fetchLinkedInData(companyId.value);
      resetNotes();
      await fetchCompanyNotes(companyId.value);
    }
  } catch (error) {
    // error handled via composable state
  }
};

onMounted(() => {
  loadProfile();
  loadCustomStatusColors();
});

onBeforeUnmount(() => {
  resetCompanyProfile();
});

const handleRescrape = async () => {
  if (infoTypes.value.length === 0) {
    formError.value = 'Select at least one signal to scrape.';
    return;
  }

  formError.value = null;
  isScraping.value = true;

  try {
    const response = await rescrapeCompany(companyId.value, { infoTypes: infoTypes.value });
    upsertCompanyInList(response.company);
    await loadProfile();
  } catch (error) {
    formError.value = error.response?.data?.error || error.message || 'Failed to scrape company.';
  } finally {
    isScraping.value = false;
  }
};

const handleDeleteCompany = async () => {
  if (!company.value) {
    return;
  }

  if (!confirm('Delete this company profile and its history?')) {
    return;
  }

  try {
    await deleteCompany(company.value.id);
    removeCompanyFromList(company.value.id);
    resetCompanyProfile();
    router.push({ name: 'WebsiteScraper' });
  } catch (error) {
    formError.value = error.response?.data?.error || error.message || 'Failed to delete company.';
  }
};

const loadMoreHistory = async () => {
  if (!hasMoreHistory.value) {
    return;
  }
  await loadProfile({ append: true });
};

const handleDeleteScrape = async (scrapeId) => {
  if (!confirm('Delete this run from history?')) {
    return;
  }

  try {
    await deleteCompanyScrape(scrapeId);
    companyScrapes.value = companyScrapes.value.filter(scrape => scrape.id !== scrapeId);
  } catch (error) {
    formError.value = error.response?.data?.error || error.message || 'Failed to delete scrape.';
  }
};

const goBack = () => {
  router.push({ name: 'WebsiteScraper' });
};

const formatDate = (value) => {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
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

// Credit system disabled - removed linkedinCreditsPerRun

const handleLinkedInScrape = async () => {
  linkedinErrorMessage.value = null;
  isLinkedInScraping.value = true;
  try {
    const response = await scrapeCompanyLinkedIn(companyId.value);
    linkedinProfile.value = response.profile;
    linkedinContacts.value = response.contacts || [];
    linkedinCursor.value = null;
  } catch (error) {
    linkedinErrorMessage.value = error.response?.data?.error || error.message || 'Failed to scrape LinkedIn.';
  } finally {
    isLinkedInScraping.value = false;
  }
};

const handleDeleteLinkedInProfile = async () => {
  if (!confirm('Remove LinkedIn data for this company?')) {
    return;
  }
  try {
    await deleteCompanyLinkedIn(companyId.value);
    resetLinkedInData();
  } catch (error) {
    linkedinErrorMessage.value = error.response?.data?.error || error.message || 'Failed to delete LinkedIn profile.';
  }
};

const loadMoreLinkedInContacts = async () => {
  if (!linkedinCursor.value) {
    return;
  }
  try {
    await fetchLinkedInData(companyId.value, { append: true });
  } catch (error) {
    // handled via store error state
  }
};

const handleDeleteLinkedInContact = async (contactId) => {
  if (!confirm('Delete this contact from the LinkedIn list?')) {
    return;
  }
  try {
    await deleteLinkedInContact(contactId);
    linkedinContacts.value = linkedinContacts.value.filter(contact => contact.id !== contactId);
  } catch (error) {
    linkedinErrorMessage.value = error.response?.data?.error || error.message || 'Failed to delete contact.';
  }
};

const handleContactCreated = async () => {
  // Refresh the LinkedIn contacts list
  try {
    await fetchLinkedInData(companyId.value);
  } catch (error) {
    linkedinErrorMessage.value = error.response?.data?.error || error.message || 'Failed to refresh contacts.';
  }
};

const refreshNotes = async () => {
  try {
    await fetchCompanyNotes(companyId.value);
  } catch (error) {
    // handled via notesError
  }
};

const handleCreateNote = async (body) => {
  await apiCreateCompanyNote(companyId.value, { body });
  await fetchCompanyNotes(companyId.value);
};

const handleDeleteNote = async (noteId) => {
  if (!confirm('Delete this note?')) {
    return;
  }
  await apiDeleteCompanyNote(noteId);
  await fetchCompanyNotes(companyId.value);
};

const handleStatusChanged = (newStatus) => {
  // Update the company in the active company state
  if (company.value) {
    company.value.status = newStatus;
  }
  // The component already handled the API call, we just need to update local state
};
</script>

