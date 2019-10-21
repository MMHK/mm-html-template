const loaderUtils = require("loader-utils");

module.exports = function (source, map, meta) {
    let callback = this.async()
    let wrapper = source;

    let define = function() {
        let args = arguments;
        let deps = [];
        let amdFunc = "";

        //mode 1 define("module_name", [deps], function)
        if (args.length == 3 && 
            args[0] instanceof String && 
            args[1] instanceof Array &&
            args[2] instanceof Function) {

            deps = args[1];
            amdFunc = args[2].toString();
        }

        //mode 2 define([deps], function)
        if (args.length == 2 && 
            args[0] instanceof Array &&
            args[1] instanceof Function) {
                deps = args[0];
                amdFunc = args[1].toString();
        }

        let header = deps.map((item, i) => {
            return `const var${i} = require("${item}");`
        }).join("\r\n");
        let argsList = Array.from(Array(deps.length).keys()).map((v, k) => {
            return `var${k}`;
        }).join(",");

        wrapper = `export default () => {${header}\r\n(${amdFunc})(${argsList})}`;
    };
    if (source.indexOf("define") > -1) {
        let bodyFunction = new Function("define", source)
        bodyFunction(define);
    }

    const options = Object.assign({},
        loaderUtils.getOptions(this) // it is safe to pass null to Object.assign()
    );


    callback(null, wrapper);
};