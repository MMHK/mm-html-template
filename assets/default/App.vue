<template>
  <div class="app">
      <div class="wrap">
        <div class="app container">
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

<style lang="scss">
.app {
  background: linear-gradient(90deg, rgb(68, 55, 234), rgb(210, 176, 239));
  min-height: 100vh;

  &.container {
    display: flex;
    flex-direction: column;
  }

}
</style>
