import $ from 'jquery'
import Service from "../service/sampleService"

let $wrapper = $(".page-home"),
    data = [];

Service.guwen()
    .then((json) => {
        $wrapper.addClass("ready");
        data = json.data;
        render()
    })
    .catch(() => {
        
    });


const render = () => {
    let article = data.pop();
    $wrapper.html(`
    <article class="content">
                    <h3>${article.title}</h3>
                    <p>${article.writer}</p>
                    <section>${article.content}</section>
                </article>`)

    setTimeout(render, 1000);
};

