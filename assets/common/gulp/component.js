<template>
    <div class="text">{{text}}</div>
</template>
<style>
.text {
    color:red;
}
<style>
<script>
define(["vue"], function(Vue) {
  Vue.component("<?= namespace ?>-<?= type ?>-<?= page ?>", {
      template: template, // the variable template will be injected
      data: function() {
          return {"text": "Ok"};
      }
  });
});
</script>