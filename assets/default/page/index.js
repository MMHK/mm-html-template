import $ from 'jquery'
import { hidden } from 'ansi-colors';

export default {
    render() {
        let $section = $(".page-index section:first");

        $section.css({
            "overflow": "hidden",
            "height": "1.5em",
        });

        let start = 1.5;


        (function init() {
            start += 1.5;
            $section.css("height", start + "em");
            console.log(start);
            if (start < 28) {
                setTimeout(init, 1000);
            }
        })();
    }
}
