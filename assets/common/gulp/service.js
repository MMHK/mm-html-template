define([
    "jquery",
    "promise"
], function($, _promise){

    _promise.polyfill();

    var base_path = BASE_PATH;

    return {
        test: function () {
            return $.get(base_path + "/hello")
                .then(function (json) {
                    return new Promise(function (resolve, reject) {
                        if (json) {
                            resolve(json);
                            return;
                        }

                        reject("error");
                    })
                });
        }
    }
});