<template>
  <v-row>
    <v-col cols="12">
      <v-card elevation="1">
        <v-card-text style="position: relative;">
          <v-icon style="position: absolute; top: 16px; right: 16px;">mdi-pencil</v-icon>
          <v-icon style="position: absolute; top: 16px; left: 16px;">mdi-qrcode</v-icon>
          <v-row no-gutters>
            <!-- Profile Picture -->
            <v-col cols="12" md="3" class="d-flex justify-center">
              <v-avatar :size="$vuetify.display.smAndDown ? 100 : 140">
                <v-img src="https://randomuser.me/api/portraits/men/85.jpg" />
              </v-avatar>
            </v-col>

            <!-- Name and Info -->
            <v-col cols="12" md="9" class="d-flex flex-column justify-center align-md-start align-center text-md-left text-center">
              <span class="text-h5">Nim Rathana</span>
              <!-- Desktop: 2nd line with phone + handle -->
              <div class="d-none d-md-flex flex-column text-subtitle-1 text-medium-emphasis">
                <span>+85581558087</span>
                <span>@nimrathana</span>
              </div>

              <!-- Mobile: All in one line -->
              <span class="text-subtitle-1 text-medium-emphasis d-md-none">
                +85581558087 · @nimrathana
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
        <v-tab value="friends"><span class="responsive-btn">Friends</span></v-tab>
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
          <v-card class="mb-4" v-for="post in posts" :key="post.id">
            <v-card-text>
              <strong>{{ post.author }}</strong> - <small>{{ post.time }}</small>
              <div class="mt-2">{{ post.content }}</div>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- About Tab -->
        <v-window-item value="about">
          <v-card>
            <v-card-text>
              <p><strong>Bio:</strong> {{ about.bio }}</p>
              <p><strong>Email:</strong> {{ about.email }}</p>
              <p><strong>Location:</strong> {{ about.location }}</p>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Friends Tab -->
        <v-window-item value="friends">
          <v-row>
            <v-col
              v-for="friend in friends"
              :key="friend.id"
              cols="6"
              sm="4"
              md="3"
            >
              <v-card>
                <v-img :src="friend.avatar" height="120" cover />
                <v-card-text class="text-center">{{ friend.name }}</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Photos Tab -->
        <v-window-item value="photos">
          <v-row>
            <v-col
              v-for="photo in photos"
              :key="photo"
              cols="6"
              sm="4"
              md="3"
            >
              <v-img :src="photo" height="160" cover />
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>
</template>

<script>
import { useHead } from '@vueuse/head'
import { useAppStore } from '@/stores/app'

export default {
  data() {
    return {
      appStore: useAppStore(),
      tab: 'posts', // ✅ initialize tab for v-model
      posts: [
        { id: 1, author: 'John Doe', time: '2h ago', content: 'Hello friends! 👋' },
        { id: 2, author: 'John Doe', time: 'Yesterday', content: 'Loving the new project!' },
      ],
      about: {
        bio: 'Engineer, traveler, and lifelong learner.',
        email: 'john.doe@example.com',
        location: 'San Francisco, CA',
      },
      friends: [
        { id: 1, name: 'Jane Smith', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
        { id: 2, name: 'Michael Roe', avatar: 'https://randomuser.me/api/portraits/men/64.jpg' },
      ],
      photos: [
        'https://source.unsplash.com/random/300x300?sig=1',
        'https://source.unsplash.com/random/300x300?sig=2',
        'https://source.unsplash.com/random/300x300?sig=3',
      ],
    };
  },
  mounted() {
    useHead({ title: 'Profile' })
  },
  methods: {

  }
};
</script>
