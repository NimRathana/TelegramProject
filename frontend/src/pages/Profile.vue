<template>
  <v-row>
    <v-col cols="12">
      <v-card elevation="1">
        <v-card-text style="position: relative;">
          <v-icon style="position: absolute; top: 16px; right: 16px;" @click="edit">mdi-pencil</v-icon>
          <v-icon style="position: absolute; top: 16px; left: 16px;" @click="generateQrCode">mdi-qrcode</v-icon>
          <v-row no-gutters>
            <!-- Profile Picture -->
            <v-col cols="12" md="3" class="d-flex justify-center">
              <v-avatar :size="$vuetify.display.smAndDown ? 100 : 140">
                <template v-if="tgUser.profileImage">
                  <VImg :src="tgUser.profileImage" />
                </template>
                <template v-else>
                  <span class="text-h5 font-weight-bold" style="letter-spacing: 5px !important;">
                    {{ $helper.getInitials(tgUser.fullName) }}
                  </span>
                </template>
              </v-avatar>
            </v-col>

            <!-- Name and Info -->
            <v-col cols="12" md="9" class="d-flex flex-column justify-center align-md-start align-center text-md-left text-center">
              <span class="text-h5">{{ tgUser.fullName ? tgUser.fullName : 'UNKNOWN' }}</span>
              <!-- Desktop: 2nd line with phone + handle -->
              <div class="d-none d-md-flex flex-column text-subtitle-1 text-medium-emphasis">
                <span>+{{ tgUser.phone ? tgUser.phone : '00000000' }}</span>
                <span>@{{ tgUser.username ? tgUser.username : 'username' }}</span>
              </div>

              <!-- Mobile: All in one line -->
              <span class="text-subtitle-1 text-medium-emphasis d-md-none">
                +{{ tgUser.phone ? tgUser.phone : '00000000' }} · @{{ tgUser.username ? tgUser.username : 'username' }}
              </span>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Navigation Tabs -->
  <v-row class="mt-4">
    <v-col cols="12">
      <v-tabs
        v-model="tab"
        :style="{ '--active-tab-bg': appStore.skin !== 'bordered' ? appStore.color : '' }"
        class="responsive-btn"
      >
        <v-tab value="posts"><span class="responsive-btn">Posts</span></v-tab>
        <v-tab value="about"><span class="responsive-btn">About</span></v-tab>
        <v-tab value="contacts"><span class="responsive-btn">Contacts</span></v-tab>
        <v-tab value="photos"><span class="responsive-btn">Photos</span></v-tab>
      </v-tabs>
    </v-col>
  </v-row>

  <!-- Tab Content -->
  <v-row>
    <v-col cols="12">
      <v-window v-model="tab">
        <!-- Posts Tab -->
        <v-window-item value="posts">
          <v-row v-if="posts.length" dense>
            <v-col v-for="post in posts" :key="post.id" sm="6" md="4" lg="3">
              <v-card class="mb-4" elevation="2">
                <v-card-text class="pa-0">
                  <v-img
                    v-if="post.mediaType === 'image'"
                    :src="`data:${post.mimeType};base64,${post.mediaBase64}`"
                    height="250"
                    cover
                  />
                  <video
                    v-else-if="post.mediaType === 'video'"
                    controls
                    style="width: 100%; height: 250px; object-fit: cover;"
                  >
                    <source :src="`data:${post.mimeType};base64,${post.mediaBase64}`" :type="post.mimeType" />
                    Your browser does not support the video tag.
                  </video>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <!-- Empty state -->
          <v-row v-else justify="center">
            <v-col cols="12" class="text-center">
              <v-icon size="64" color="grey lighten-1">mdi-emoticon-sad</v-icon>
              <p class="mt-2">No posts available.</p>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- About Tab -->
        <v-window-item value="about">
          <v-card v-if="about.length">
            <v-card-text>
              <p v-if="about[0].bio"><strong>Bio:</strong> {{ about[0].bio }}</p>
              <p v-if="about[0].phone"><strong>Phone:</strong> +{{ about[0].phone }}</p>
              <p v-if="about[0].username"><strong>Username:</strong> @{{ about[0].username }}</p>
              <p v-if="about[0].date"><strong>Date:</strong> {{ about[0].date }}</p>
            </v-card-text>
          </v-card>
          <!-- Empty state -->
          <v-row v-else justify="center">
            <v-col cols="12" class="text-center">
              <v-icon size="64" color="grey lighten-1">mdi-emoticon-sad</v-icon>
              <p class="mt-2">No about information available.</p>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Friends Tab -->
        <v-window-item value="contacts">
          <v-row v-if="contacts.length" dense>
            <v-col
              v-for="contact in contacts"
              :key="contact.id"
              cols="6"
              sm="4"
              md="3"
            >
              <v-card>
                <v-img
                  v-if="contact.hasImage && contact.image && contact.image !== 'data:image/jpeg;base64,'"
                  :src="contact.image"
                  height="120"
                  cover
                />
                <v-avatar
                  v-else
                  class="ma-4 mx-auto d-flex align-center justify-center"
                  size="80"
                  :color="appStore.color"
                >
                  <span>{{ $helper.getInitials(contact.name) }}</span>
                </v-avatar>

                <v-card-text class="text-center">
                  <div class="font-weight-medium">{{ contact.name }}</div>
                  <div class="text-caption grey--text">
                    {{ contact.phone ? '+' + contact.phone : (contact.username ? '@' + contact.username : 'No info') }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <!-- Empty state -->
          <v-row v-else justify="center">
            <v-col cols="12" class="text-center">
              <v-icon size="64" color="grey lighten-1">mdi-emoticon-sad</v-icon>
              <p class="mt-2">No contacts available.</p>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Photos Tab -->
        <v-window-item value="photos">
          <v-row v-if="photos.length" dense>
            <v-col v-for="photo in photos" :key="photo.id" cols="6" sm="4" md="3">
              <v-img
                :src="`data:${photo.mimeType};base64,${photo.base64}`"
                height="160"
                cover
              />
            </v-col>
          </v-row>
          <!-- Empty state -->
          <v-row v-else justify="center">
            <v-col cols="12" class="text-center">
              <v-icon size="64" color="grey lighten-1">mdi-emoticon-sad</v-icon>
              <p class="mt-2">No photos available.</p>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>

  <v-dialog v-model="qrDialog" max-width="400" persistent>
    <template v-slot:default="{ isActive }">
      <v-card rounded="lg">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h6 text-medium-emphasis ps-2">
            Scan QR Code
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text>
          <div class="d-flex justify-center">
            <img v-if="qrCode" :src="qrCode" alt="QR Code" style="border-radius: 10px; max-width: 100%;" />
            <p v-else>Click the QR icon to generate a code.</p>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="d-flex justify-end">
          <v-btn
            color="red"
            text="Cancel"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <v-dialog v-model="editDialog" max-width="500" persistent>
    <template v-slot:default="{ isActive }">
      <v-card rounded="lg">
        <div class="d-flex justify-space-between align-center mt-2">
          <v-btn
            color="primary"
            variant="plain"
            @click="isActive.value = false"
          ><span>Cancel</span></v-btn>

          <v-btn
            color="primary"
            variant="plain"
          ><span>Done</span></v-btn>
        </div>

        <v-card-text class="d-flex flex-column align-center pa-0">
          <v-avatar :color="appStore.color" :size="$vuetify.display.smAndDown ? 80 : 100">
            <template v-if="tgUser.profileImage">
              <VImg :src="tgUser.profileImage" />
            </template>
            <template v-else>
              <span class="text-h5 font-weight-bold" style="letter-spacing: 5px !important;">
                {{ $helper.getInitials(tgUser.fullName) }}
              </span>
            </template>
          </v-avatar>
          <span class="mt-1 text-blue">Set New Photo</span>
        </v-card-text>

        <v-card-text>
          <v-text-field
            v-model="tgUser.firstName"
            variant="solo-filled"
            hide-details
            clearable
            class="ffield"
          ></v-text-field>
          <v-divider></v-divider>
          <v-text-field
            v-model="tgUser.lastName"
            variant="solo-filled"
            hide-details
            clearable
            class="lfield"
          ></v-text-field>
          <div class="text-truncate text-caption d-inline-block text-grey" style="max-width: 100%;">
            Enter your name and add an optional profile photo.
          </div>
        </v-card-text>

        <v-card-text class="pt-0">
          <v-text-field
            v-model="tgUser.phone"
            label="Phone Number"
            variant="solo-filled"
            hide-details
            clearable
            class="ffield"
          >
            <template v-slot:default>
              <span>+</span>
            </template>
          </v-text-field>
          <v-divider></v-divider>
          <v-text-field
            v-model="tgUser.username"
            label="Username"
            variant="solo-filled"
            hide-details
            clearable
            class="cfield"
          >
            <template v-slot:default>
              <span>@</span>
            </template>
          </v-text-field>
          <v-text-field
            :value="tgUser.date"
            label="Date of Birth"
            type="date"
            variant="solo-filled"
            hide-details
            clearable
            class="lfield"
          ></v-text-field>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>

  <v-dialog
      v-model="dialogError"
      max-width="290"
  >
      <v-card>
          <v-card-text class="text-center">
              <v-icon color="red" size="70" class="mt-2 mb-2">mdi-alert-circle</v-icon>
              <div class="text-subtitle-1">{{ showMessage }}</div>
          </v-card-text>

          <v-divider></v-divider>
          <v-card-actions class="justify-end">
              <v-btn
                  color="red darken-1"
                  text
                  @click="dialogError = false, showMessage = ''"
              >
                  Close
              </v-btn>
          </v-card-actions>
      </v-card>
  </v-dialog>
</template>

<script>
import { useHead } from '@vueuse/head'
import { useAppStore } from '@/stores/app'
import QRCode from 'qrcode';
import { useUserStore } from '@/stores/userstore'
import { useLoadingState } from '@/stores/loading'
import axios from 'axios'

export default {
  props: {
    userId: {
      type: String,
    }
  },
  data() {
    return {
      qrCode: null,
      qrDialog: false,
      editDialog: false,
      dialogError: false,
      showMessage: '',
      username: null,
      tgUser: null,
      appStore: useAppStore(),
      userStore: useUserStore(),
      loadingState: useLoadingState(),
      tab: 'about',
      initialized: false,
      posts: [],
      about: [],
      contacts: [],
      archivedData: [],
      dialogType: '',
      photos: [],
    };
  },
  created() {
    this.tgUser = JSON.parse(localStorage.getItem('tg_user')) || {};
    this.username = this.tgUser.username || '';
    this.tgUser.date = this.formatDate(this.tgUser.date);
    this.initialized = true;
  },
  watch: {
    'initialized': {
      immediate: true,
      handler(newVal) {
        if (newVal && this.tgUser) {
          if (this.tab === 'posts' && this.posts.length === 0) {
            this.fetchPosts();
          }
        }
      }
    },
    tab: {
      immediate: true,
      handler(newTab) {
        if (!this.initialized) return;

        if (newTab === 'posts' && this.posts.length === 0) {
          this.fetchPosts();
        } else if (newTab === 'photos' && this.photos.length === 0) {
          this.fetchPhotos();
        } else if (newTab === 'about' && this.about.length === 0) {
          this.fetchAbout();
        } else if (newTab === 'contacts' && this.contacts.length === 0) {
          this.openDialog('contacts');
        }
      }
    }
  },
  mounted() {
    useHead({ title: 'Profile' })
  },
  methods: {
    openDialog(type) {
      if (!this.tgUser || !this.tgUser.phone || !this.tgUser.username) {
        return;
      }

      const phone = (this.tgUser.phone || '').toString().replace(/\s+/g, '');

      if (type === 'archivedChats' && this.archivedData.length > 0) {
        this.dialogType = 'archivedChats';
        this.Dialog = true;
        return;
      }
      if (type === 'contacts' && this.contacts.length > 0) {
        this.dialogType = 'contacts';
        this.Dialog = true;
        return;
      }

      const endpoint = type === 'contacts' ? '/api/GetContacts' : '/api/GetArchivedChats';

      this.loadingState.startLoading();
      axios.post(process.env.APP_URL + endpoint, { phone })
        .then((res) => {
          if (type === 'contacts') {
            this.contacts = res.data.contacts;
          } else {
            this.archivedData = res.data.archivedChats;
          }
          this.dialogType = type;
          this.loadingState.stopLoading();
        })
        .catch((err) => {
          const error = err.response?.data?.error || "Unknown error occurred.";
          if (error.includes("Session")) {
            this.errorMessage = "Session not found.";
            this.dialogError = true;
          }
          this.loadingState.stopLoading();
        });
    },
    async fetchAbout() {
      if (!this.tgUser || !this.tgUser.phone || !this.tgUser.username) {
        return;
      }

      this.loadingState.startLoading();
      await axios.post(process.env.APP_URL + '/api/GetAbout', {
        phone: this.tgUser.phone,
        channelUsername: this.tgUser.username,
      }).then(response => {
        this.about = response.data.userDetails || [];
        this.loadingState.stopLoading();
      }).catch(err => {
        this.showMessage = err.response?.data?.error || err.message;
        this.dialogError = true;
        this.loadingState.stopLoading();
      });
    },
    async fetchPosts() {
      if (!this.tgUser || !this.tgUser.phone || !this.tgUser.username) {
        return;
      }

      this.loadingState.startLoading();
      await axios.post(process.env.APP_URL + '/api/GetPosts', {
        phone: this.tgUser.phone,
        channelUsername: this.tgUser.username,
        limit: 10,
      }).then(response => {
        this.posts = response.data.stories || [];
        this.loadingState.stopLoading();
      }).catch(err => {
        this.showMessage = err.response?.data?.error || err.message;
        this.dialogError = true;
        this.loadingState.stopLoading();
      });
    },
    async fetchPhotos() {
      if (!this.tgUser || !this.tgUser.phone || !this.tgUser.username) {
        return;
      }

      this.loadingState.startLoading();
      await axios.post(process.env.APP_URL + '/api/GetPhotos', {
        phone: this.tgUser.phone,
        channelUsername: this.tgUser.username,
        limit: 10,
      }).then(response => {
        this.photos = response.data.photos || [];
        this.loadingState.stopLoading();
      }).catch(err => {
        this.showMessage = err.response?.data?.error || err.message;
        this.dialogError = true;
        this.loadingState.stopLoading();
      });
    },
    edit() {
      if (!this.tgUser || !this.tgUser.username) {
        return;
      }
      this.editDialog = true;
    },
    async generateQrCode() {
      if (!this.tgUser || !this.tgUser.username) {
        return;
      }

      try {
        const telegramUrl = `https://t.me/${this.username}`;

        this.qrCode = await QRCode.toDataURL(telegramUrl);
        this.qrDialog = true;
      } catch (error) {
        console.error('QR generation failed:', error);
      }
    },
    formatDate(isoDate) {
      if (!isoDate) return '';
      const [day, month, year] = isoDate.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

  }
};
</script>
<style>
.ffield .v-field {
  border-radius: 10px 10px 0px 0px !important;
}
.lfield .v-field {
  border-radius: 0px 0px 10px 10px !important;
}
.cfield .v-field {
  border-radius: 0px !important;
}
</style>
