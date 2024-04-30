import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'buefy/dist/buefy.css'
import '@mdi/font/css/materialdesignicons.min.css'

createApp(App)
    .use(router)
    .mount('#app')
