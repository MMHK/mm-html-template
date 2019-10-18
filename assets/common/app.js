import $ from 'jquery'

let app = (()=>{
    var page_inited = false;

    return {
        render_page(modules) {
            if (this.page_inited) {
                return
            }

            //parse page
            $("*[data-page]").each((index, ele) => {
                var $ele = $(ele),
                    alias =  $ele.data("page");

                $ele.addClass("loading");

                let module = modules[alias];
                module();
                $ele.removeClass("loading");
            });

            this.page_inited = true;
        }
    }
})();

export default app