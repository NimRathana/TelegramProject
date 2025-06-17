<template>
  <!-- <v-app :theme="theme">
    <router-view />
  </v-app> -->

  <v-layout class="rounded rounded-md">
    <v-responsive class="border rounded" max-height="100%">
        <v-app :theme="theme" class="app_scroll">
            <v-navigation-drawer v-model="toggleRightDrawer" location="right" temporary :width="400" style="z-index:999;height:100vh;position:fixed;bottom:0;">
                <v-toolbar style="position: sticky;top:0;z-index: 99;">
                    <v-list>
                        <v-list-item :title="'Theme Customize'" :subtitle="'Customize Preview Real Time'"></v-list-item>
                    </v-list>
                    <v-spacer></v-spacer>
                    <v-btn icon variant="text" @click.stop="toggleRightDrawer = !toggleRightDrawer">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-container>
                    <v-list-item-title class="mt-2">Primary Color</v-list-item-title>
                    <div class="pa-0 ma-0 mt-3 d-flex" style="gap: 10px;">
                        <v-btn
                          v-for="(color, index) in colors"
                          :key="index"
                          width="40"
                          class="d-flex align-center justify-center elevation-2 rounded-lg pa-6"
                          variant="outlined"
                          :color="selectedColor === color ? color : 'grey-darken-3'"
                          @click="clickColor(color)"
                          >
                            <v-card :color="color" height="30" width="35" class="d-flex align-center justify-center"></v-card>
                        </v-btn>
                        <v-btn
                        width="40"
                        class="d-flex align-center justify-center elevation-2 rounded-lg pa-6"
                        variant="outlined"
                        :color="colorPicker"
                        @click="toggleColorPicker"
                        >
                            <v-menu
                            v-model="showColorPicker"
                            :close-on-content-click="false"
                            location="bottom"
                            offset-y transition="scale-transition"
                            style="background-color: transparent;"
                            >
                                <template v-slot:activator="{ props }">
                                    <v-card v-bind="props" elevation="0" style="box-shadow: none;background-color: transparent;" height="100%" width="100%" class="d-flex align-center justify-center"><v-icon size="25" :color="colorPicker">mdi-palette-outline</v-icon></v-card>
                                </template>
                                <v-color-picker
                                v-model="colorPicker" elevation="15" :width="250"
                                class="color-picker-dropdown"
                                @update:modelValue="updateColorPicker"
                                ></v-color-picker>
                            </v-menu>
                        </v-btn>
                    </div>
                    <v-list-item-title class="mt-5">Theme</v-list-item-title>
                    <div class="pa-0 ma-0 mt-3">
                        <v-row>
                            <v-col cols="4">
                                <v-btn :color="theme == 'light' ? appStore.color : 'grey-darken-3'" variant="outlined" @click="ChangeTheme('light')" style="height: 50px; width: 100%;">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <v-icon size="30">mdi-weather-sunny</v-icon>
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Light</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="theme == 'dark' ? appStore.color : 'grey-darken-3'" variant="outlined" @click="ChangeTheme('dark')" style="height: 50px; width: 100%;">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <v-icon size="30">mdi-weather-night</v-icon>
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Dark</p>
                            </v-col>
                        </v-row>
                    </div>
                    <v-list-item-title class="mt-5">Skin</v-list-item-title>
                    <div class="pa-0 ma-0 mt-3">
                        <v-row>
                            <v-col cols="4">
                                <v-btn :color="selectedSkin === 'default' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectSkin('default')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/skin-default.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Default</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="selectedSkin === 'bordered' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectSkin('bordered')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/skin-border.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Bordered</p>
                            </v-col>
                        </v-row>
                    </div>
                </v-container>
                <v-divider :thickness="1" :class="['my-2', { 'border-opacity-50': theme === 'dark', 'border-opacity-100': theme !== 'dark' }]"></v-divider>
                <v-container>
                    <v-list-item-title>Layout</v-list-item-title>
                    <div class="pa-0 ma-0 mt-2">
                        <v-row>
                            <v-col cols="4">
                                <v-btn :color="selectedLayout === 'Vertical' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectLayout('Vertical')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/skin-default.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Vertical</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="selectedLayout === 'Collapsed' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectLayout('Collapsed')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Collapsed.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Collapsed</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="selectedLayout === 'Horizontal' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectLayout('Horizontal')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Horizontal.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Horizontal</p>
                            </v-col>
                        </v-row>
                    </div>
                    <v-list-item-title class="mt-5">Content</v-list-item-title>
                    <div class="pa-0 ma-0 mt-3">
                        <v-row>
                            <v-col cols="4">
                                <v-btn :color="selectedContent === 'Compact' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectContent('Compact')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Compact.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Compact</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="selectedContent === 'Wide' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectContent('Wide')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Wide.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Wide</p>
                            </v-col>
                        </v-row>
                    </div>
                    <v-list-item-title class="mt-5">Direction</v-list-item-title>
                    <div class="pa-0 ma-0 mt-3">
                        <v-row>
                            <v-col cols="4">
                                <v-btn :color="selectedDirection === 'Left' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectDirection('Left')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Left-to-right.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Left To Right</p>
                            </v-col>

                            <v-col cols="4">
                                <v-btn :color="selectedDirection === 'Right' ? appStore.color : 'transparent'" height="70" class="pa-0" variant="outlined" @click="selectDirection('Right')">
                                    <v-card color="transparent" style="box-shadow: none;" class="d-flex align-center justify-center">
                                        <img
                                            src="./assets/Right-to-left.png"
                                            :style="{'height': '65px','object-fit': 'contain','background-color': theme == 'dark' ? 'darkslategray' : 'transparent'}"
                                            class="d-flex align-center justify-center"
                                        />
                                    </v-card>
                                </v-btn>
                                <p class="text-caption">Right To Left</p>
                            </v-col>
                        </v-row>
                    </div>
                </v-container>
            </v-navigation-drawer>
            <v-app-bar :elevation="0" style="position: fixed;top:0;z-index: 98;">
              <v-app-bar-nav-icon></v-app-bar-nav-icon>
              <v-app-bar-title>d;fsfsdf</v-app-bar-title>
              <template v-slot:append>
                  <div class="d-flex justify-end align-center">
                      <v-menu offset-y>
                          <template #activator="{ props }">
                              <v-btn v-bind="props" icon>
                                  <v-icon>
                                      mdi-translate
                                  </v-icon>
                              </v-btn>
                          </template>
                          <v-list>
                              <v-list-item>
                                  <v-list-item-title>english</v-list-item-title>
                              </v-list-item>
                              <v-list-item class="mt-3">
                                  <v-list-item-title>khmer</v-list-item-title>
                              </v-list-item>
                          </v-list>
                      </v-menu>
                      <v-menu offset-y>
                          <template #activator="{ props }">
                              <v-btn v-bind="props" icon>
                                  <v-icon>
                                  mdi-weather-sunny
                                  </v-icon>
                              </v-btn>
                          </template>
                          <v-list>
                              <v-list-item @click="ChangeTheme('light')">
                                  <v-list-item-title><v-icon>mdi-weather-sunny</v-icon>light_theme</v-list-item-title>
                              </v-list-item>
                              <v-list-item @click="ChangeTheme('dark')">
                                  <v-list-item-title><v-icon>mdi-weather-night</v-icon>dark_theme</v-list-item-title>
                              </v-list-item>
                          </v-list>
                      </v-menu>
                  </div>
                  <VBadge dot location="bottom right" offset-x="3" offset-y="3" class="mx-3" color="success" bordered>
                      <VAvatar class="cursor-pointer" color="primary" variant="tonal">
                          <VImg src="./assets/Collapsed.png" />
                          <VMenu activator="parent" width="230" location="bottom end" offset="14px">
                              <VList>
                                  <VListItem>
                                      <template #prepend>
                                          <VListItemAction start>
                                              <VBadge dot location="bottom right" offset-x="3" offset-y="3"
                                                  color="success">
                                                  <VAvatar color="primary" variant="tonal">
                                                      <VImg src="./assets/Collapsed.png" />
                                                  </VAvatar>
                                              </VBadge>
                                          </VListItemAction>
                                      </template>
                                      <VListItemTitle class="font-weight-semibold">
                                          name
                                      </VListItemTitle>
                                      <VListItemSubtitle>email</VListItemSubtitle>
                                  </VListItem>
                                  <VDivider class="my-2" />
                                  <VListItem link>
                                      <template #prepend>
                                          <VIcon class="me-2" icon="mdi-account-tie" size="22" />
                                      </template>
                                      <VListItemTitle>profile</VListItemTitle>
                                  </VListItem>
                                  <VListItem link>
                                      <template #prepend>
                                          <VIcon class="me-2" icon="mdi-home-account" size="22" />
                                      </template>
                                      <VListItemTitle>home</VListItemTitle>
                                  </VListItem>
                                  <VDivider class="my-2" />
                                  <VListItem>
                                      <template #prepend>
                                          <VIcon class="me-2" icon="mdi-logout" size="22" />
                                      </template>
                                      <VListItemTitle>logout</VListItemTitle>
                                  </VListItem>
                              </VList>
                          </VMenu>
                      </VAvatar>
                  </VBadge>
              </template>
            </v-app-bar>
            <v-main class="main" style="display: flex; flex-direction: column;">
                <v-row class="pa-0 ma-0">
                    <v-col cols="12" class="content d-flex justify-center pa-0">
                      <v-defaults-provider
                          :defaults="{
                            VApp: {
                              color: appStore.color,
                              theme: appStore.theme,
                            },
                            VBtn: {
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'tonal',
                              color: appStore.color,
                            },
                            VCard: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'tonal',
                              elevation: 0,
                            },
                            VTextField: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'solo',
                              clearable: true,
                              density: 'comfortable'
                            },
                            VSelect: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'solo',
                              clearable: true,
                            },
                            VTextarea: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'solo',
                              clearable: true,
                            },
                            VAutocomplete: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'solo',
                              clearable: true,
                            },
                            VChip: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'tonal',
                              clearable: true,
                            },
                            VAlert: {
                              color: appStore.color,
                              variant: appStore.skin == 'bordered' ? 'outlined' : 'tonal',
                            },
                            VNavigationDrawer: {
                              color: appStore.color,
                            },
                            VAppBar: {
                              color: appStore.color,
                            },
                            VDialog: {
                              color: appStore.color,
                            }
                          }"
                        >
                          <v-container :fluid="appStore.content !== 'Compact'">
                              <!-- <slot /> -->
                                <div v-if="loadingState.isLoading" class="d-flex justify-center align-center;" style="position: absolute;top: 40%;">
                                    <v-overlay v-model="overlay" persistent style="display: flex;justify-content: center;align-items: center;"><Loading /></v-overlay>
                                </div>
                                <router-view />
                          </v-container>
                      </v-defaults-provider>
                    </v-col>
                </v-row>
            </v-main>
        </v-app>
    </v-responsive>
  </v-layout>
  <v-btn style="position: fixed;bottom:70px;right:20px;z-index: 999;" icon="mdi-cog-outline" size="large"
      :color="appStore.color" @click.stop="toggleRightDrawer = !toggleRightDrawer" class="rotate-animation setting_btn"></v-btn>
</template>

<script>
import { useAppStore } from '@/stores/app'
import { useLoadingState } from '@/stores/loading'
import { VApp, VTextField } from 'vuetify/components'
import Loading from './components/Loading.vue'

export default {
  data() {
    return {
      appStore: useAppStore(),
      loadingState: useLoadingState(),
      theme: localStorage.getItem('theme') || 'dark',
      toggleRightDrawer: false,
      colors: ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
      selectedColor: useAppStore().color || 'grey-darken-3',
      colorPicker: '#FF5733',
      showColorPicker: false,
      selectedSkin: useAppStore().skin || 'default',
      selectedLayout: useAppStore().layout || 'Vertical',
      selectedContent: useAppStore().content || 'Compact',
      selectedDirection: useAppStore().direction || 'Left',
      overlay: true,
    }
  },
  watch: {
    'appStore.theme'(newTheme) {
      this.theme = this.appStore.theme
    },
    'appStore.skin'(newSkin) {
      this.selectedSkin = this.appStore.skin
    },
    'appStore.layout'(newLayout) {
      this.selectedLayout = this.appStore.layout
    },
    'appStore.content'(newContent) {
      this.selectedContent = this.appStore.content
    },
    'appStore.direction'(newDirection) {
      this.selectedDirection = this.appStore.direction
    },
    'appStore.color'(newColor){
      this.selectedColor = this.appStore.color
    }
  },
  methods: {
    ChangeTheme(newTheme) {
      this.appStore.setTheme(newTheme);
    },
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker;
    },
    clickColor(color) {
      if (this.selectedColor === color) {
        this.selectedColor = 'grey-darken-3';
        this.appStore.setColor('#424242');
      } else {
        this.selectedColor = color;
        this.appStore.setColor(color);
      }
      this.colorPicker = '#424242';
    },
    selectSkin(skin) {
      this.appStore.setSkin(skin);
    },
    selectLayout(layout) {
      this.appStore.setLayout(layout);
    },
    selectContent(content){
      this.appStore.setContent(content);
    },
    selectDirection(direction){
      this.appStore.setDirection(direction);
    },
    updateColorPicker(color) {
      this.appStore.setColor(color);
    },
  },
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
      //move button setting
      const button = document.querySelector('.setting_btn');
      let isDragging = false;
      let offsetX, offsetY;

      if(button != undefined){
          button.addEventListener('mousedown', (event) => {
              isDragging = true;
              // Calculate the initial offset of the mouse cursor from the button's position
              offsetX = event.clientX - button.getBoundingClientRect().left;
              offsetY = event.clientY - button.getBoundingClientRect().top;

              // Add a style to prevent the text selection during dragging
              document.body.style.userSelect = 'none';
          });

          document.addEventListener('mousemove', (event) => {
              if (isDragging) {
                  const x = event.clientX - offsetX;
                  const y = event.clientY - offsetY;

                  // Update the button's position based on the mouse movement
                  button.style.left = `${x}px`;
                  button.style.top = `${y}px`;
              }
          });

          document.addEventListener('mouseup', () => {
              isDragging = false;
              document.body.style.userSelect = ''; // Restore the text selection behavior
          });
      }
  }, 200);
});
</script>
<style>
.setting_btn.rotate-animation {
  cursor: move;
  animation: spin 2s linear infinite;
}
.description .ql-toolbar {
    display: none;
}

.description .ql-container {
    border: unset;
    font-family: 'Battambang';
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
