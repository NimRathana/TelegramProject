/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'

// Styles
import 'unfonts.css'

const app = createApp(App)
app.component('QuillEditor', QuillEditor)
import { createHead } from '@vueuse/head'

registerPlugins(app)

app.use(createHead())
app.mount('#app')
