<template>
  <ul class="example">
    <li v-for="msg in list" v-html="msg"></li>
  </ul>
</template>

<script>
export default {
  data () {
    return {
      counter: 0,
      list: ['Hello world!']
    }
  },

  methods: {
    addMsg(text) {
      this.list.push(text)
      this.counter++;
    },
    renderList() {
      this.addMsg("Text List " + this.counter);

      if (this.counter < 10) {
        setTimeout(this.renderList, 1000);
      }
    }
  },

  mounted() {
    this.renderList()
  }
}
</script>

<style>
.example {
  color: red;
}
</style>