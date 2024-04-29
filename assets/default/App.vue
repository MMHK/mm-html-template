<template>
  <div class="app wrap">
      <div class="wrap">
        <div class="container">
          <Header />
          <router-view/>
          <Footer />
        </div>
      </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import Header from "./component/header"
import Footer from "./component/footer"

export default defineComponent({
  name: "App.vue",

  components: {
    Header,
    Footer,
  }
});
</script>
