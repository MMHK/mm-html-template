define(["jquery"], function ($) {

    var app = {};

    if (window['__app__']) {
        return window['__app__'];
    }
    window.__app__ = app;

    /**
     * 调用Page script
     * @type {boolean}
     */
    app.page_inited = false;
    /**
     * @param String namespace 命名空间
     */
    app.render_page = function() {
        var namespace = arguments.length > 0 ? arguments[0] + "/" : "";

        if (app.page_inited)
            return;
        //parse page
        $("*[data-page]").each(function(index, ele){
            var $ele = $(ele),
                alias =  namespace + "page" + "/" + $ele.data("page");

            $ele.addClass("loading");

            require([alias]);
            $ele.removeClass("loading");
        });

        app.page_inited = true;
    };

    return app;
});