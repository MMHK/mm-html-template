import $ from 'jquery'

let app = (()=>{
    var page_inited = false;

    return {
        render_page(namespace) {
            if (this.page_inited) {
                return
            }

            //parse page
            $("*[data-page]").each((index, ele) => {
                var $ele = $(ele),
                    alias =  $ele.data("page");

                $ele.addClass("loading");

                import(
                    /* webpackMode: "eager" */
                    /* webpackInclude: /\.js$/ */
                    `../${namespace}/page/${alias}.js`
                )

                $ele.removeClass("loading");
            });

            this.page_inited = true;
        }
    }
})();

export default app