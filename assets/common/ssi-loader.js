const loaderUtils = require("loader-utils");
const SSI = require("node-ssi");

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

	ssi.compile(source, (err, content) => {
        callback(err, content)
    });
};