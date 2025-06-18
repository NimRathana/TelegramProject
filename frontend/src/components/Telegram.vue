<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <v-row class="w-100" style="flex: 0 0 auto;">
        <v-col v-if="showPhone" cols="12" md="3">
          <v-text-field label="Phone" v-model="phone" />
        </v-col>
        <v-col v-if="showCode" cols="12" md="3">
          <v-text-field label="Code" v-model="code" />
        </v-col>
        <v-col v-if="showPassword" cols="12" md="3">
          <v-text-field label="Password" v-model="password" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'" :type="visible ? 'text' : 'password'" @click:append-inner="visible = !visible" />
        </v-col>
        <v-col v-if="showBtnLogin" cols="12" md="3" class="align-center">
          <v-btn @click="SendCode()">Login</v-btn>
        </v-col>
    </v-row>

    <v-row class="w-100" style="flex: 1 1 auto; overflow: hidden;">
    <v-col cols="6" class="h-100">
        <div class="h-100 d-flex align-center justify-center">
          <v-card class="w-100 h-100"></v-card>
        </div>
      </v-col>

      <v-col cols="6" class="h-100">
        <div class="editor-wrapper h-100">
          <QuillEditor
            content-type="html"
            :options="options"
            ref="descriptionEditor"
            style="height: 100%;"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>

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

  <v-snackbar
    v-model="snackbar"
    :timeout="1000"
    class="elevation-24"
  >
    <strong>{{ showMessage }}</strong>
  </v-snackbar>
</template>

<script>
import { useHead } from '@vueuse/head'
import { useAppStore } from '@/stores/app'
import axios from 'axios'
import { useLoadingState } from '@/stores/loading'
import { useUserStore } from '@/stores/userstore'

export default {
  data() {
    return {
      appStore: useAppStore(),
      loadingState: useLoadingState(),
      userStore: useUserStore(),
      theme: 'dark',
      color: 'primary',
      phone: null,
      code: null,
      password: null,
      showPhone: false,
      showCode: false,
      showPassword: false,
      showBtnLogin: false,
      dialogError: false,
      showMessage: null,
      quill: null,
      options: ({
        readOnly: false,
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video', 'formula'],

                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],

                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],

                ['clean']
            ],
            imageResize: {
                displayStyles: {
                    backgroundColor: 'black',
                    border: 'none',
                    color: 'white'
                },
                modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
            },
        },
      }),
      visible: false,
      snackbar: false
    }
  },
  mounted(){
    useHead({ title: 'Telegram' })
    if (this.userStore.session && this.userStore.user != "undefined") {
      const phone = JSON.parse(this.userStore.user)
      axios.post(process.env.APP_URL + '/api/Reconnect', { phone: phone.phone })
      .then((res) => {
        this.userStore.setUser(res.data.user);
        this.showMessage = "logged in.!"
        this.snackbar = true;
        this.showPhone = false;
        this.showBtnLogin = false;
      })
      .catch((err) => {
          localStorage.clear();
          this.showMessage = "Session expired, please log in again.";
          this.dialogError = true;
      });
    }else{
      this.showPhone = true;
      this.showBtnLogin = true;
    }
  },
  watch: {
    'userStore.session'(val){
      if(val == null){
        this.showPhone = true;
        this.showBtnLogin = true;
      }
    }
  },
  methods: {
    SendCode(){
      this.loadingState.startLoading();
      var url = "SendCode";
      if(this.showCode == true){
        url = "VerifyCode";
      }
      if(this.showPassword == true){
        url = "CheckPassword";
      }
      axios.post(process.env.APP_URL + '/api/' + url, {
        phone: (this.phone || '').toString().replace(/\s+/g, ''),
        code: (this.code || '').toString().replace(/\s+/g, ''),
        password: this.password
      }).then((res)=>{
        if(res.status == 200 && res.data.message == "Already logged in"){
          this.showBtnLogin = false;
          this.showPhone = false;
          this.showCode = false;
          this.showPassword = false;
          this.userStore.setSession(res.data.session);
          this.userStore.setUser(res.data.user);
          this.showMessage = "logged in!"
          this.snackbar = true;
          this.clear();
        }
        if(res.status == 200 && res.data.message == "Code sent successfully"){
          this.showCode = true;
        }
        if(res.status == 200 && res.data.twoFA == true){
          this.showPassword = true;
        }
        if(res.status == 200 && res.data.message == "Logged in"){
          this.showBtnLogin = false;
          this.showPhone = false;
          this.showCode = false;
          this.showPassword = false;
          this.userStore.setSession(res.data.session);
          this.userStore.setUser(res.data.user);
          this.showMessage = "logged in!"
          this.snackbar = true;
          this.clear();
        }
        if(res.status == 200 && res.data.message == "Logged in with 2FA"){
          this.showBtnLogin = false;
          this.showPhone = false;
          this.showCode = false;
          this.showPassword = false;
          this.userStore.setSession(res.data.session);
          this.userStore.setUser(res.data.user);
          this.showMessage = "logged in!"
          this.snackbar = true;
          this.clear();
        }
        this.loadingState.stopLoading();
      }).catch((e)=>{
        console.log(e);
        this.showMessage = e.response.data.error;
        this.dialogError = true;
        this.loadingState.stopLoading();
      })
    },
    clear(){
      this.phone = false;
      this.code = false;
      this.password = false;
    }
  },
}
</script>
<style>
.v-container>.v-main{
  height: 100%;
  padding: 0;
}
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quill-editor {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
