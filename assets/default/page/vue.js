import Vue from "vue"
import Sample from "../component/sample.vue"

let vm = new Vue({
    el: document.querySelector("#page_vue"),

    components: {
        Sample
    }
});