<template>
    <main class="page-home">
      <article>
        <h3>短歌行</h3>
        <p class="author">
          朝代：魏晉<br>
          作者：曹操
        </p>
        <section class="content-text" ref="contentText" :style="contentTextStyle">
          <p>對酒當歌，人生幾何！<br class="mobile-view">譬如朝露，去日苦多。</p>
          <p>慨當以慷，憂思難忘。<br class="mobile-view">何以解憂？唯有杜康。</p>
          <p>青青子衿，悠悠我心。<br class="mobile-view">但爲君故，沉吟至今。</p>
          <p>呦呦鹿鳴，食野之苹。<br class="mobile-view">我有嘉賓，鼓瑟吹笙。</p>
          <p>明明如月，何時可掇？<br class="mobile-view">憂從中來，不可斷絕。</p>
          <p>越陌度阡，枉用相存。<br class="mobile-view">契闊談宴，心念舊恩。</p>
          <p>月明星稀，烏鵲南飛。<br class="mobile-view">繞樹三匝，何枝可依？</p>
          <p>山不厭高，海不厭深。<br class="mobile-view">周公吐哺，天下歸心。</p>
        </section>
      </article>
    </main>
</template>

<script setup>
import {defineComponent, onMounted, ref} from 'vue';
const contentText  =ref(null)
const contentTextStyle = ref({
  height: '1.5em'
})

onMounted(() => {

  contentTextStyle.value = {
    height: `${contentText.value.scrollHeight}px`
  }

  console.log(contentTextStyle);
});
</script>

<style lang="scss">
.page-home {
  min-height: rem(550px);
  text-align: center;

  font-family: "MSungHK", Arial, Helvetica, sans-serif;

  line-height: 1.5;

  color: white;

  h3 {
    padding: 0.5em 0;
    font-size: 2em;
  }

  .author {
    padding: 0.5em;
    font-size: 0.8em;
  }

  .content-text {
    display: block;
    height: 1.5em;
    overflow: hidden;
    transition: height 15s linear;
  }

  article {
    padding-bottom: 2em;
  }
}



@media (max-width: 768px) {
  .page-home {
    font-size: rem(42px);
  }
}
</style>
