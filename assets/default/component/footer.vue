<template>
  <footer class="tc">
    {{ Year }} &copy; MixMedia
  </footer>

</template>

<script>
import { defineComponent, ref } from 'vue';
export default defineComponent({
  name: "footer",

  setup() {
    const Year = ref(new Date().getFullYear())
    return {
      Year
    }
  }
});
</script>

<style lang="scss">
footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  font-size: rem(12px);

  background-color: #05053e;
  color: white;

  padding: 1em 0;
  text-align: center;
}
</style>
