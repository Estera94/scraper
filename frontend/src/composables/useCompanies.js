import { ref, computed } from 'vue';
import {
  getCompanies,
  getCompanyProfile,
  getCompanyLinkedIn,
  getCompanyNotes
} from '../services/api.js';

const companies = ref([]);
const companiesLoading = ref(false);
const companiesError = ref(null);

const activeCompany = ref(null);
const companyScrapes = ref([]);
const companyCursor = ref(null);
const companyProfileLoading = ref(false);
const companyProfileError = ref(null);

const hasMoreHistory = computed(() => Boolean(companyCursor.value));
const linkedinProfile = ref(null);
const linkedinContacts = ref([]);
const linkedinCursor = ref(null);
const linkedinLoading = ref(false);
const linkedinError = ref(null);
const notes = ref([]);
const notesLoading = ref(false);
const notesError = ref(null);

const fetchCompanies = async () => {
  companiesLoading.value = true;
  companiesError.value = null;

  try {
    const response = await getCompanies();
    companies.value = response.companies || [];
  } catch (error) {
    companiesError.value = error.response?.data?.error || error.message;
    throw error;
  } finally {
    companiesLoading.value = false;
  }
};

const fetchCompanyProfile = async (id, { append = false } = {}) => {
  if (!id) {
    return null;
  }

  companyProfileLoading.value = true;
  companyProfileError.value = null;

  try {
    const params = {};
    if (append && companyCursor.value) {
      params.cursor = companyCursor.value;
    }

    const response = await getCompanyProfile(id, params);
    activeCompany.value = response.company;
    companyCursor.value = response.nextCursor || null;

    if (append) {
      companyScrapes.value = [
        ...companyScrapes.value,
        ...(response.scrapes || [])
      ];
    } else {
      companyScrapes.value = response.scrapes || [];
    }

    return response;
  } catch (error) {
    companyProfileError.value = error.response?.data?.error || error.message;
    throw error;
  } finally {
    companyProfileLoading.value = false;
  }
};

const resetCompanyProfile = () => {
  activeCompany.value = null;
  companyScrapes.value = [];
  companyCursor.value = null;
  companyProfileError.value = null;
  resetLinkedInData();
  resetNotes();
};

const upsertCompanyInList = (company) => {
  if (!company) {
    return;
  }

  const index = companies.value.findIndex(item => item.id === company.id);

  if (index >= 0) {
    companies.value.splice(index, 1, company);
  } else {
    companies.value = [company, ...companies.value];
  }
};

const removeCompanyFromList = (companyId) => {
  companies.value = companies.value.filter(company => company.id !== companyId);
};

const resetLinkedInData = () => {
  linkedinProfile.value = null;
  linkedinContacts.value = [];
  linkedinCursor.value = null;
  linkedinError.value = null;
};

const fetchLinkedInData = async (companyId, { append = false } = {}) => {
  if (!companyId) {
    return null;
  }

  linkedinLoading.value = true;
  linkedinError.value = null;

  try {
    const params = {};
    if (append && linkedinCursor.value) {
      params.cursor = linkedinCursor.value;
    }

    const response = await getCompanyLinkedIn(companyId, params);
    linkedinProfile.value = response.profile;
    linkedinCursor.value = response.nextCursor || null;

    if (append) {
      linkedinContacts.value = [
        ...linkedinContacts.value,
        ...(response.contacts || [])
      ];
    } else {
      linkedinContacts.value = response.contacts || [];
    }

    return response;
  } catch (error) {
    linkedinError.value = error.response?.data?.error || error.message;
    throw error;
  } finally {
    linkedinLoading.value = false;
  }
};

const resetNotes = () => {
  notes.value = [];
  notesError.value = null;
};

const fetchCompanyNotes = async (companyId) => {
  if (!companyId) return;
  notesLoading.value = true;
  notesError.value = null;
  try {
    const response = await getCompanyNotes(companyId);
    notes.value = response.notes || [];
  } catch (error) {
    notesError.value = error.response?.data?.error || error.message;
    throw error;
  } finally {
    notesLoading.value = false;
  }
};

export const useCompanies = () => ({
  companies,
  companiesLoading,
  companiesError,
  fetchCompanies,
  upsertCompanyInList,
  removeCompanyFromList,
  activeCompany,
  companyScrapes,
  companyProfileLoading,
  companyProfileError,
  fetchCompanyProfile,
  resetCompanyProfile,
  hasMoreHistory,
  companyCursor,
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
});

