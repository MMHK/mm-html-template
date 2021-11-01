import $ from 'jquery'
import Service from "../service/sampleService"

let $wrapper = $(".page-home"),
    $article = $wrapper.find("article");

const render = () => {

    Service.getSampleText()
        .then((data) => {
            $wrapper.addClass("ready");
            let text = data.split("\n").map((item) => {
                return `<p>${item}</p>`;
            }).join("");
            $article.html(`<section>${text}</section>`)

            setTimeout(render, 1000);
        })
    
};

render();

