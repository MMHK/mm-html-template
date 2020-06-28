import $ from 'jquery'

export default {
    matchPage: function () {

        const inited = global.inited || false;

        if (inited) {
            return [];
        }

        const pageList = $("*[data-page]").map(function(index, ele) {
            const $ele = $(ele),
                alias =  $ele.data("page");

            return alias;
        });

        global.inited = true;

        return Array.from(pageList);
    }
};