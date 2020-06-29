import $ from 'jquery'

let $section = $(".page-index section:first");

$section.css({
    "overflow": "hidden",
    "height": "1.5em",
});

let start = 1.5;


const render = () => {
    start += 1.5;
    $section.css("height", start + "em");
    if (start < 28) {
        setTimeout(render, 1000);
    }
}
render();