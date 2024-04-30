<template>
  <header class="tc">
    <a href="#">Vue3 + Webpack</a>
  </header>
</template>

<script>
import { defineComponent} from 'vue';

export default defineComponent({
  name: "header"
});
</script>

<style lang="scss">
header.tc {
  padding: rem(14px) 0;
  text-align: center;

  font-family: Arial, Helvetica, sans-serif;
  font-size: rem(24px);
  font-weight: 700;

  background-color: #05053e;
  color: white;

  a {
    color: white;
  }
}
</style>
