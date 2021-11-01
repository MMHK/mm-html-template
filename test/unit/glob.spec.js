// import assert from 'assert'
const path = require("path") 
const glob = require("glob") 
const mlog = require("mocha-logger")
const assert = require("assert")

describe('Glob', () => {
    it("show glob item", () => {
        let basePath = path.join(__dirname, "../../assets/default/page/*.js")
        let list = glob.sync(basePath)
        list.map((item) => {
            mlog.success(JSON.stringify(item))
            assert.notEqual(item, null)
        });
    })

});