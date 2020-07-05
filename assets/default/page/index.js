define([
    "jquery",
    "css!default/page/index.css"
], function($){

    const $text = $("#text_span");

    setInterval(() => {
        let now = new Date();

        $text.text(`${now.toLocaleString()}`);
    }, 1000);
});