const loaderUtils = require("loader-utils");
const path = require("path");
const SSI = require("node-ssi");

const includeFileReg = /<!--#\s*include\s+(file|virtual)=(['"])([^\r\n\s]+?)\2\s*(.*)-->/;
const fileReg = /\=(['"]([^"']+)['"])/g;

module.exports = function (source) {
    let callback = this.async()

    const options = Object.assign({},
        {
            dirname: "",
            baseDir: "",
            encoding: 'utf-8'
        },
        loaderUtils.getOptions(this) // it is safe to pass null to Object.assign()
    );

    const ssi = new SSI(options);
    let result = includeFileReg.exec(source.toString("UTF-8"));
    if (result) {
        let matches = result.join("").match(fileReg).map(item => {
            return item.replace(/["'=]+/g, "");
        });
        let basePath = path.dirname(this.resourcePath);
        matches.forEach(file => {
            let local = path.join(basePath, file);
            this.addDependency(local);
        });
    }


	ssi.compile(source, (err, content) => {
        callback(err, content)
    });
};