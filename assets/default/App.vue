<template>
  <section class="app">
    <AppHeader />
    <div class="container">
      <router-view/>
    </div>
    <AppFooter />
  </section>
</template>

<script>
import { defineComponent } from 'vue';
import AppHeader from "./component/header"
import AppFooter from "./component/footer"

export default defineComponent({
  name: "App.vue",

  components: {
    AppHeader,
    AppFooter,
  }
});
</script>

<style lang="scss">
.app {
  background: linear-gradient(90deg, rgb(68, 55, 234), rgb(210, 176, 239));
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  > .container {
    width: 100%;
  }
}
</style>
