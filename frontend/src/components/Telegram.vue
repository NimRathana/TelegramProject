<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <!-- Top Row: Inputs -->
    <v-row class="w-100 mb-2" style="flex: 0 0 auto;" dense>
      <!-- Phone Input -->
      <v-col v-if="showPhone" cols="12" md="3">
        <v-text-field
          label="Phone"
          v-model="phone"
          class="responsive-text"
          hide-details
          dense
        />
      </v-col>

      <!-- Code Input -->
      <v-col v-if="showCode" cols="12" md="3">
        <v-text-field
          label="Code"
          v-model="code"
          class="responsive-text"
          hide-details
          dense
        />
      </v-col>

      <!-- Password Input -->
      <v-col v-if="showPassword" cols="12" md="3">
        <v-text-field
          label="Password"
          v-model="password"
          class="responsive-text"
          hide-details
          dense
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          @click:append-inner="visible = !visible"
        />
      </v-col>

      <!-- Login Button -->
      <v-col v-if="showBtnLogin" cols="12" md="3" class="d-flex">
        <v-btn @click="SendCode()" class="responsive-btn">Login</v-btn>
      </v-col>
    </v-row>

    <!-- Main Row: Treeview & Editor -->
    <v-row class="w-100" style="flex: 1 1 auto; overflow: hidden;" no-gutters>
      <!-- Treeview -->
      <v-col cols="12" md="6" class="h-50 h-md-100">
        <div class="h-100 d-flex justify-center">
          <v-card class="w-100 h-100 d-flex flex-column">
            <div class="treeview-wrapper flex-grow-1 d-flex flex-column" style="overflow-y: auto;">
              <!-- Search and Action Buttons -->
              <v-row class="ma-0 pa-2" no-gutters>
                <v-col cols="12" class="d-flex flex-wrap" style="gap: 8px;">
                  <v-text-field
                    v-model="search"
                    label="Search Directory"
                    dense
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    single-line
                    class="responsive-text"
                    style="max-height: 40px; flex-grow: 1;"
                  />
                  <v-btn
                    v-if="!showBtnLogin"
                    @click="GetAllGroup"
                    class="responsive-btn"
                  >
                    Get Group
                  </v-btn>
                  <v-btn
                    v-if="!showBtnLogin"
                    @click="SendMessage"
                    class="responsive-btn"
                  >
                    Send Message
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Treeview -->
              <v-treeview
                v-if="items.length > 0"
                :items="items"
                item-value="id"
                item-title="name"
                density="compact"
                selectable
                transition
                select-strategy="classic"
                activatable
                hoverable
                return-object
                :search="search"
                :filter="filter"
                :load-children="OpenItem"
                @click:select="SelectedItem"
                @update:selected="UpdateItem"
                @click:open="OpenItem"
                class="flex-grow-1 h-100"
              >
                <template #prepend="{ item }">
                  <v-avatar size="40" class="ml-1 pa-1">
                    <template v-if="item.photoUrl && item.photoUrl != 'data:image/jpeg;base64,'">
                      <img
                        :src="item.photoUrl"
                        alt="Group photo"
                        style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;"
                      />
                    </template>
                    <template v-else>
                      <v-icon class="white--text" small>mdi-account-group</v-icon>
                    </template>
                  </v-avatar>
                </template>

                <template #title="{ item }">
                  <span class="font-weight-regular d-flex responsive-text" v-if="item.type === 'group' || item.type === 'supergroup'">
                    {{ item.name }}
                    <p class="ml-2 responsive-subtext">({{ item.membersCount }} members)</p>
                  </span>
                  <span class="font-weight-regular d-flex responsive-text" v-else>
                    {{ item.name }}
                  </span>
                </template>
              </v-treeview>

              <!-- No Data Fallback -->
              <div v-else class="text-center mt-4 h-100 responsive-text">
                No groups found. Fetch your groups using the button above.
              </div>
            </div>
          </v-card>
        </div>
      </v-col>

      <!-- Quill Editor -->
      <v-col cols="12" md="6" class="h-50 h-md-100">
        <div class="editor-wrapper h-100" style="overflow-y: auto;">
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
import 'quill/dist/quill.snow.css';
import 'quill-emoji/dist/quill-emoji.css';

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
              ['image', 'video'],
              ['emoji'],
            ],
            "emoji-toolbar": true,
            'emoji-textarea': false,
            'emoji-shortname': true,
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
      snackbar: false,
      itemSelected: {
        groups: [],
        users: [],
        usersRemove: []
      },
      items: [],
      search: null,
      fetchedGroupIds: [],
    }
  },
  mounted(){
    useHead({ title: 'Telegram' })

    if (this.userStore.session && this.userStore.user != "undefined") {
      this.loadingState.startLoading();
      const phone = JSON.parse(this.userStore.user)
      axios.post(process.env.APP_URL + '/api/Reconnect', { phone: phone.phone })
      .then((res) => {
        this.userStore.setUser(res.data.user);
        this.showMessage = "you're logged in."
        this.snackbar = true;
        this.showPhone = false;
        this.showBtnLogin = false;
        this.loadingState.stopLoading();
      })
      .catch((err) => {
          localStorage.clear();
          this.showPhone = true;
          this.showBtnLogin = true;
          this.showMessage = "Session expired, please log in again.";
          this.dialogError = true;
          this.loadingState.stopLoading();
      });
    }else{
      this.showPhone = true;
      this.showBtnLogin = true;
    }
  },
  computed: {
    filter() {
      return (item, search, textKey) => {
          if (!search) return true;
          const itemText = (item[textKey] || '').toString().toLowerCase();
          const searchText = search.toString().toLowerCase();
          return itemText.includes(searchText);
      };
    },
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
        phone: (this.phone || '').toString().replace(/\s+/g, '').replace(/^0/, ''),
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
        if(e.response.data.error == "PHONE_NUMBER_BANNED"){
          this.showMessage = "The provided phone number is banned from telegram";
        } else if(e.response.data.error == "PHONE_NUMBER_INVALID"){
          this.showMessage = "Invalid phone number";
        } else if(e.response.data.error == "API_ID_INVALID"){
          this.showMessage = "API ID invalid";
        } else if(e.response.data.error == "API_ID_PUBLISHED_FLOOD"){
          this.showMessage = "This API id was published somewhere, you can't use it now";
        } else if(e.response.data.error == "AUTH_KEY_PERM_EMPTY"){
          this.showMessage = "The temporary auth key must be binded to the permanent auth key to use these methods.";
        } else if(e.response.data.error == "INPUT_REQUEST_TOO_LONG"){
          this.showMessage = "The request is too big";
        } else if(e.response.data.error == "NETWORK_MIGRATE_X"){
          this.showMessage = "Repeat the query to data-center X";
        } else if(e.response.data.error == "PHONE_MIGRATE_X"){
          this.showMessage = "Repeat the query to data-center X";
        } else if(e.response.data.error == "PHONE_NUMBER_APP_SIGNUP_FORBIDDEN"){
          this.showMessage = "You can't sign up using this app";
        } else if(e.response.data.error == "PHONE_NUMBER_FLOOD"){
          this.showMessage = "You asked for the code too many times.";
        } else if(e.response.data.error == "PHONE_NUMBER_INVALID"){
          this.showMessage = "Invalid phone number";
        } else if(e.response.data.error == "PHONE_PASSWORD_FLOOD"){
          this.showMessage = "You have tried logging in too many times";
        } else if(e.response.data.error == "PHONE_PASSWORD_PROTECTED"){
          this.showMessage = "This phone is password protected";
        } else if(e.response.data.error == "SMS_CODE_CREATE_FAILED"){
          this.showMessage = "An error occurred while creating the SMS code";
        } else if(e.response.data.error == "authParams.onError is not a function"){
          this.showMessage = "Invalid Code";
        } else{
          this.showMessage = e.response.data.error;
        }
        this.dialogError = true;
        this.loadingState.stopLoading();
      })
    },
    GetAllGroup(){
      if(this.userStore.user != "undefined"){
        const phone = JSON.parse(this.userStore.user.phone)
        this.loadingState.startLoading();
        axios.post(process.env.APP_URL + '/api/GetAllGroups', {
          phone: phone,
        }).then((res)=>{
          this.items = res.data.groups;
          this.loadingState.stopLoading();
        }).catch((e)=>{
          console.log(e);
          this.showMessage = e.response.data.error;
          this.dialogError = true;
          this.loadingState.stopLoading();
        })
      }
    },
    SelectedItem(item){
      const selectedId = item.path[0];
      const selectedUserId = item.path[1];

      const index = this.itemSelected.groups.indexOf(selectedId);
      const userIdIndex = this.itemSelected.users.indexOf(selectedUserId);


      if (item.path[0] === item.id) {
        if (item.value === true) {
          // Add if not already in the list
          if (index === -1) {
            this.itemSelected.groups.push(selectedId);
          }
        } else {
          // Remove if exists
          if (index !== -1) {
            this.itemSelected.groups.splice(index, 1);
          }
        }
      }

      if(item.path[1] == item.id){
        if(item.value == false){
          if(userIdIndex !== -1){
            this.itemSelected.users.splice(userIdIndex, 1);
            if (!this.itemSelected.usersRemove.includes(selectedUserId)) {
              this.itemSelected.usersRemove.push(selectedUserId);
            }
          }
        }
      }
    },
    UpdateItem(item){
      this.itemSelected.users = this.itemSelected.users.filter(user =>
        item.includes(user)
      );

      item.forEach(id => {
        const exists = this.itemSelected.users.some(user => user === id);
        if (!exists) {
          this.itemSelected.users.push(id);

          // If this user was in the "removed" list, remove from there
          const removeIndex = this.itemSelected.usersRemove.indexOf(id);
          if (removeIndex !== -1) {
            this.itemSelected.usersRemove.splice(removeIndex, 1);
          }
        }
      });
      console.log(this.itemSelected)
    },
    SendMessage(){
      if(this.itemSelected.users.length < 1){
        this.showMessage = "please select user";
        this.dialogError = true;
      }else{
        if(this.userStore.user != "undefined"){
          const phone = JSON.parse(this.userStore.user.phone)
          this.loadingState.startLoading();
          axios.post(process.env.APP_URL + '/api/SendMessage', {
            phone: phone,
            user: this.itemSelected.users.map(u => ({
              id: u.id,
              groupId: u.groupId,
              name: u.name,
              username: u.username,
            })),
            text: this.$refs.descriptionEditor?.getHTML()
          }).then((res)=>{
            this.showMessage = res.data.message;
            this.snackbar = true;
            this.loadingState.stopLoading();
          }).catch((e)=>{
            console.log(e);
            this.showMessage = e.response.data.error;
            this.dialogError = true;
            this.loadingState.stopLoading();
          })
        }
      }
    },
    async OpenItem(item){
      let id;

      if (typeof item.id === 'object' && item.id !== null && 'id' in item.id) {
        id = item.id.id;
      } else {
        id = item.id;
      }

      // Skip if this item (group) has already been fetched
      if (this.fetchedGroupIds.includes(id)) return;

      // Track this group as fetched
      this.fetchedGroupIds.push(id);
      if(this.userStore.user != "undefined"){
        const phone = JSON.parse(this.userStore.user.phone)
        this.loadingState.startLoading();
        await axios.post(process.env.APP_URL + '/api/GetAllGroupMembers', {
          phone: phone,
          id: id
        }).then((res)=>{
          const members = res.data.members;
          const groupIndex = this.items.findIndex(group => group.id === members[0].groupId);

          if (groupIndex !== -1) {
            // Initialize children if missing
            if (!this.items[groupIndex].children) {
              this.$set(this.items[groupIndex], 'children', []);
            }

            // Optional: create a set of existing children ids to avoid duplicates
            const existingIds = new Set(this.items[groupIndex].children.map(c => c.id));

            // Push each member as a child node if not already present
            members.forEach(member => {
              const memberId = member.id || member.userId.toString();
              if (!existingIds.has(memberId)) {
                this.items[groupIndex].children.push({
                  id: memberId,
                  groupId: member.groupId,
                  name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                  firstName: member.firstName,
                  lastName: member.lastName,
                  type: member.type,
                  photoUrl: member.photoUrl,
                  phone: member.phone,
                  username: member.username,
                  // children: [],
                });
              }
            });
          }
          this.loadingState.stopLoading();
        }).catch((e)=>{
          console.log(e);
          this.showMessage = e.response.data.error;
          this.dialogError = true;
          this.loadingState.stopLoading();
        })
      }
    },
    clear(){
      this.phone = null;
      this.code = null;
      this.password = null;
    },
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
.treeview-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.treeview-content {
  height: 100%;
  overflow-y: auto;
}
.treeview-wrapper,
.editor-wrapper {
  overflow-y: auto;
}
</style>
