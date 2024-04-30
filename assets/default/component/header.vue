<template>
  <header>
    <b-navbar>
      <template #brand>
        <b-navbar-item tag="router-link" :to="{path:'/'}">
          Vue3 + webpack + buefy
        </b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item tag="router-link" :to="{path:'/'}">
          Home
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{path:'/about'}">
          About
        </b-navbar-item>
      </template>
    </b-navbar>
  </header>
</template>

<script>
import {BNavbar, BNavbarItem} from "buefy/src/components/navbar"
import {RouterLink} from "vue-router"
import { defineComponent} from 'vue';

export default defineComponent({
  name: "header",

  components: {
    BNavbar,
    BNavbarItem,
    RouterLink
  },
  setup() {
    return {

    }
  }
});
</script>
