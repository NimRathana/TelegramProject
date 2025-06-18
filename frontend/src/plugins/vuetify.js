/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { VTreeview } from 'vuetify/labs/VTreeview'
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import { ImageDrop } from 'quill-image-drop-module';
Quill.register('modules/imageDrop', ImageDrop)
Quill.register('modules/imageResize', ImageResize);
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
  components: {
    VTreeview,
  },
})
