/**
 * Created by mixmedia on 2018/3/1.
 */
/**
 * requireJS 依赖配置
 */
requirejs.config({
    baseUrl: BASE_PATH,
    waitSeconds: 10,
    paths: {
        "text": "common/text/text",
        "lodash": "common/lodash/dist/lodash.min",
        "promise": "common/es6-promise/es6-promise.min",
        "jquery": "common/jquery/jquery.min",
        "app": "common/app",
        "css": "common/require-css/css"
    },
    map: {
        '*': {
            'css': 'common/require-css/css'
        }
    },
    shim: {
        
    }
    , urlArgs : window['VERSION'] ? "v=" + VERSION : ""
});