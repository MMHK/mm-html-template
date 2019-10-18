import $ from 'jquery'
import Service from "../service/sampleService"

export default () => {


    const render = () => {
        Service.getSampleText()
            .then((text) => {
                let $text = $(".page-home")
                $text.width(Math.random() * 500 + 500);
                $text.html(text);
                setTimeout(render, 1000);
            })
        };

    render()

}