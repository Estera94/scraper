<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">Key contacts</h3>
        <p class="text-sm text-gray-500">
          {{ contacts.length }} contacts loaded
          <span v-if="hasMore">· more available</span>
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          @click="showAddModal = true"
        >
          Add Contact
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          :disabled="loading || !hasMore"
          @click="$emit('load-more')"
        >
          {{ hasMore ? 'Load more' : 'All contacts loaded' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="!contacts.length"
          @click="exportContacts"
        >
          Export CSV
        </button>
      </div>
    </div>

    <div v-if="!contacts.length && !showAddModal" class="text-sm text-gray-500">
      No contacts captured yet. Run the LinkedIn scraper to pull employees or add a contact manually.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left font-semibold text-gray-600">Name</th>
            <th class="px-4 py-2 text-left font-semibold text-gray-600">Title</th>
            <th class="px-4 py-2 text-left font-semibold text-gray-600">Location</th>
            <th class="px-4 py-2 text-left font-semibold text-gray-600">Email</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="contact in contacts" :key="contact.id">
            <td class="px-4 py-2">
              <div class="flex flex-col">
                <span class="font-medium text-gray-900">{{ contact.fullName }}</span>
                <a
                  v-if="contact.linkedinUrl"
                  :href="contact.linkedinUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="text-xs text-indigo-600"
                >
                  LinkedIn →
                </a>
              </div>
            </td>
            <td class="px-4 py-2 text-gray-700">{{ contact.title || '—' }}</td>
            <td class="px-4 py-2 text-gray-600">{{ contact.location || '—' }}</td>
            <td class="px-4 py-2">
              <span v-if="contact.email" class="flex items-center gap-2">
                {{ contact.email }}
                <button
                  type="button"
                  class="text-gray-400 hover:text-indigo-600"
                  @click="copyToClipboard(contact.email)"
                >
                  Copy
                </button>
              </span>
              <span v-else class="text-gray-400">Unavailable</span>
            </td>
            <td class="px-4 py-2 text-right">
              <button
                type="button"
                class="text-sm text-red-600 hover:text-red-700"
                @click="$emit('delete', contact.id)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Contact Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Add Contact</h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              @click="closeModal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleCreateContact" class="space-y-4">
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span class="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                v-model="formData.fullName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="CEO"
              />
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                v-model="formData.location"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="San Francisco, CA"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label for="linkedinUrl" class="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                v-model="formData.linkedinUrl"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div v-if="formError" class="text-sm text-red-600 bg-red-50 p-2 rounded">
              {{ formError }}
            </div>

            <div class="flex gap-2 pt-4">
              <button
                type="button"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                @click="closeModal"
                :disabled="isSubmitting"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Adding...' : 'Add Contact' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createLinkedInContact } from '../../services/api.js';

const props = defineProps({
  contacts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['load-more', 'delete', 'created']);

const showAddModal = ref(false);
const isSubmitting = ref(false);
const formError = ref(null);
const formData = ref({
  fullName: '',
  title: '',
  location: '',
  email: '',
  linkedinUrl: ''
});

const closeModal = () => {
  showAddModal.value = false;
  formError.value = null;
  formData.value = {
    fullName: '',
    title: '',
    location: '',
    email: '',
    linkedinUrl: ''
  };
};

const handleCreateContact = async () => {
  if (!formData.value.fullName.trim()) {
    formError.value = 'Full name is required';
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await createLinkedInContact(props.companyId, {
      fullName: formData.value.fullName.trim(),
      title: formData.value.title.trim() || null,
      location: formData.value.location.trim() || null,
      email: formData.value.email.trim() || null,
      linkedinUrl: formData.value.linkedinUrl.trim() || null
    });
    
    emit('created');
    closeModal();
  } catch (error) {
    formError.value = error.response?.data?.error || error.message || 'Failed to create contact';
  } finally {
    isSubmitting.value = false;
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied!');
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const exportContacts = () => {
  if (!props.contacts.length) {
    return;
  }
  const header = ['Name', 'Title', 'Location', 'Email', 'LinkedIn URL'];
  const rows = props.contacts.map(contact => [
    contact.fullName || '',
    contact.title || '',
    contact.location || '',
    contact.email || '',
    contact.linkedinUrl || ''
  ]);

  const csv = [header, ...rows].map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'linkedin-contacts.csv';
  link.click();
  URL.revokeObjectURL(url);
};
</script>

