const gulp = require('gulp');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const webserver = require('gulp-webserver');
const connectSSI = require('connect-ssi');
const ssi = require("node-ssi");
const PluginError = require('plugin-error');
const fontmin = require("gulp-fontmin");
const through = require('through2');
const htmlreplace = require('gulp-html-replace');
const crypto = require('crypto');
const sass = require('gulp-sass');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const glob = require("glob");
const path = require("path");
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();
const rename = require("gulp-rename");
const modifyCssUrls = require('gulp-modify-css-urls');
const rjs = require('gulp-requirejs-optimize');
const fs = require("fs");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require('vinyl-buffer');

/**
 * 获取AMD模块 
 */
const getAMDModule = function (basepath, globlist) {
    let list = [];

    globlist.forEach(function (item) {
        list = list.concat(glob.sync(path.join(basepath, item)));
    });

    list = list.map(function (item) {
        return path.relative(basepath, item).replace(".js", "").split(path.sep).join("/");
    });

    return list;
};

/**
 *
 * 打包css
 */
function bundleCSS(rjsConfig) {
    /**
     * 合并css
     */
    console.log("begin minify bundle css");

    let basePath = rjsConfig.entryDir,
        CssList = rjsConfig.css.concat([
            __dirname + "/FUNCTION.css"
        ]);

    let processors = [
        //自动增加css平台兼容前缀
        autoprefixer(),
        //css 压缩去重
        cssnano({
            safe: true,
            autoprefixer: false,
        })
    ];

    return new Promise((resolve) => {
        gulp.src(CssList, {
                allowEmpty: true,
                sourcemaps: true
            })
            .pipe(modifyCssUrls({
                modify: function (url, filepath) {
                    const p = path.join(path.dirname(filepath), url);
                    return path.relative(basePath, p).replace(/\\/ig, '/');
                }
            }))
            .pipe(sourcemaps.init({
                largeFile: true,
                loadMaps: true
            }))
            .pipe(concat('main.min.css'))
            .pipe(postcss(processors))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest(basePath))
            .on("end", function () {
                console.log("minify bundle css complete");
                resolve();
            });
    });
}

/**
 * 通用requireJS打包
 */
function rjsCommon(basePath, configPath) {
    console.log("begin bundle amd modules");
    let extraConfig = arguments.length > 2 ? arguments[2] : {};

    global.window = {};
    global.BASE_PATH = basePath;
    global.VERSION = (new Date()).getMilliseconds();
    global.requirejs = function () {};
    global.requirejs.config = function (options) {
        rjsConfig = Object.assign({
            wrapShim: true,
            useStrict: true,
            skipPragmas:true,
            baseUrl: basePath,
            generateSourceMaps: true,
            preserveLicenseComments: false,
            optimize: "none",
            out: "modules.js"
        }, options);
    };
    require(configPath);
    global.requirejs = undefined;
    global.JSBASE = undefined;
    rjsConfig.include = getAMDModule(rjsConfig.baseUrl, [
        "main.js"
    ]);
    /**
     * 不将CSS 打包到rjs里面
     */
    rjsConfig.separateCSS = true;
    rjsConfig = Object.assign(rjsConfig, extraConfig);

    rjsConfig = beforeRjsbuild(rjsConfig);

    const done = new Promise(function (resolve) {
        gulp.src(rjsConfig.entry)
            .pipe(sourcemaps.init({
                largeFile: true
            }))
            .pipe(rjs(rjsConfig))
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest(basePath))
            .on("end", function () {
                console.log("bundle amd modules complete");
                resolve(rjsConfig);
            })
    });

    return done.then(function (rjsConfig) {
        const done1 = new Promise(function (resolve) {
            /**
             * 合并js
             */
            console.log("begin minify main js");
            const modulesPath = rjsConfig.entryDir + "/modules.js";
            gulp.src(rjsConfig.vendor.concat([
                    modulesPath
                ]), {
                    sourcemaps: true
                })
                .pipe(sourcemaps.init({
                    loadMaps: true,
                    largeFile: true
                }))
                .pipe(concat("main.min.js"))
                .pipe(sourcemaps.write("."))
                .pipe(gulp.dest(rjsConfig.entryDir))
                .on("end", function () {
                    // fs.unlinkSync(modulesPath);
                    resolve(modulesPath);
                });
        })
        .then((modulesPath) => {
            return new Promise(resolve => {
                browserify({
                    entries: rjsConfig.entryDir + "/main.min.js",
                    debug: true
                })
                    .transform("babelify", {
                        presets: [
                            ["@babel/preset-env", {
                                useBuiltIns: "usage",
                                corejs: 3
                            }]
                        ],
                        plugins: [
                            ["@babel/plugin-transform-runtime", {
                                "absoluteRuntime": false,
                                "helpers": true,
                                "regenerator": true,
                                "useESModules": false
                            }],
                            "@babel/plugin-syntax-dynamic-import"
                        ],
                        exclude: [
                            /(common)/i
                        ]
                    })
                    .bundle()
                    .pipe(source('main.min.js'))
                    .pipe(buffer())
                    .pipe(sourcemaps.init({loadMaps: true}))
                    .pipe(uglify().on("error", function () {
                        console.log(arguments);
                    }))
                    .pipe(sourcemaps.write('.'))
                    .pipe(gulp.dest(rjsConfig.entryDir))
                    .on("end", () =>{
                        console.log("minify main js complete");
                        resolve();
                    })
            });
        });

        return Promise.all([done1, bundleCSS(rjsConfig)]);
    })

}

function bundle(basePath, namespace) {
    return rjsCommon(basePath, __dirname + "/assets/common/config.js", {
        include: getAMDModule(basePath, [
            namespace + "/page/**/*.js",
            namespace + "/main.js"
        ]),
        _namespace: namespace,
        siteRoot: __dirname,
        out: namespace + "/modules.js",
        css: [
            __dirname + "/assets/static/style/main.css"
        ],
        entryDir: basePath + "/" + namespace,
        vendor: [
            __dirname + "/assets/common/requirejs/require.js",
            __dirname + "/assets/common/config.js"
        ],
        entry: [
            basePath + "/" + namespace + "/main.js"
        ]
    });
}

function beforeRjsbuild(rjsConfig) {
    return rjsConfig;
}

//公共模板生成器 用于生成前台及后台的js模板
function commonTemplate(basePath) {

    return prompt([{
            type: 'list',
            name: 'namespace',
            message: '请选择存放位置',
            choices: glob.sync(__dirname + "/assets/*/").map(function (p) {
                return path.basename(p);
            }),
        },
        {
            type: 'list',
            name: 'type',
            message: '请选择模板类型?',
            choices: ['page', 'service', 'component'],
        },
        {
            type: 'input',
            name: 'name',
            message: "请填写文件名（不包含路径）",
            validate: function (value) {
                const reg = /^([0-9a-z\-\/]{1,12})$/i
                if (reg.test(value)) {
                    return true;
                }
                return '请填写正确的文件名';
            }
        }
    ]).then(function (result) {
        return new Promise(function (resolve, reject) {
            gulp.src("./assets/common/gulp/" + result.type + ".js")
                .pipe(replace("<?= page ?>", result.name))
                .pipe(replace("<?= type ?>", result.type))
                .pipe(replace("<?= namespace ?>", result.namespace))
                .pipe(rename(result.name + (result.type == "component" ? ".vue" : ".js")))
                .pipe(gulp.dest([basePath, result.namespace, result.type].join("/") + "/"))
                .on("end", function () {
                    resolve();
                })
        });
    });
}
//js 模板生成器
gulp.task("generator", function () {
    return commonTemplate("./assets")
});

/**
 * 编译前端代码
 */
gulp.task("build", function (done) {
    return prompt([{
        type: 'list',
        name: 'namespace',
        message: '请选择编译目录',
        choices: glob.sync(__dirname + "/assets/*/").map(function (p) {
            return path.basename(p);
        }),
    }]).then(function (result) {
        return bundle(__dirname + "/assets", result.namespace);
    });
});

gulp.task("copy", function () {
    return gulp.src([
            "./assets/default/main.min.*"
        ])
        .pipe(gulp.dest("./dist/assets/default/"));
});



//ssi 编译处理
const ssiHandler = function (options) {
    if (arguments.length <= 0) {
        options = {};
    }
    let opt = Object.assign({
        baseDir: "./",
        encoding: "utf-8"
    }, options);

    const handler = new ssi(opt);

    return through.obj(function (file, encoding, callback) {
        if (file.isNull()) {
            return callback();
        }
        if (file.isStream()) {
            callback(new PluginError("ssiHandler", {
                message: "Streaming not supported"
            }));
            return;
        }
        if (file.isBuffer()) {
            handler.compileFile(file.path, {
                encoding: encoding
            }, function (error, content) {
                file.contents = new Buffer(content);
                callback(error, file);
            });
        }
    });
};
// 生成随即字符
function getHash() {
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    return crypto.createHash('sha1').update(current_date + random).digest('hex');
}

function minifyFont(text, cb) {
    gulp
        .src('./assets/static/fonts/src/*.ttf')
        .pipe(fontmin({
            text: text
        }))
        .pipe(gulp.dest('./assets/static/fonts/'))
        .on('end', cb);
}


/**
 * 压缩中文字体
 */
gulp.task('font', function (next) {
    let buffers = [];
    gulp
        .src(['./*.html', '*.shtml'])
        .on('data', function (file) {
            buffers.push(file.contents);
        })
        .on('end', function () {
            const text = Buffer.concat(buffers).toString('utf-8');
            minifyFont(text, next);
        });
});

gulp.task("font:watch", () => {
    return gulp.watch([
        "./*.html",
        "./*.shtml"
    ], gulp.parallel("font"));
});

gulp.task("static", gulp.series(()=> {
    return gulp.src(['./assets/static/images/**/*'])
        .pipe(gulp.dest('./dist/assets/static/images/'))
}, () => {
    return gulp.src(["./assets/static/fonts/*"])
        .pipe(gulp.dest('./dist/assets/static/fonts/'));
}));

gulp.task("html", function () {
    return gulp.src("./*.html")
        .pipe(ssiHandler({
            baseDir: "./"
        }))
        .pipe(htmlreplace({
            'css': 'assets/default/main.min.css?v=' + getHash(),
            'js': 'assets/default/main.min.js?v=' + getHash()
        }))
        .pipe(gulp.dest("./dist/"));
});

gulp.task('sass', function () {
    return gulp.src('./assets/static/style/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./assets/static/style/'));
});

gulp.task('sass:watch', () => {
    return gulp.watch('./assets/static/style/*.scss', gulp.parallel("sass"));
});
/**
 * 开发服务器
 */
gulp.task("serve", async () => {

    return await gulp.src('./')
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            open: true,
            middleware: [
                new connectSSI({
                    ext: '.html',
                    baseDir: __dirname
                })
            ]
        }));
});

/**
 * 打包前端
 */
gulp.task("dist", gulp.series("sass", "build", gulp.parallel("html", gulp.series("font", "static"), "copy")));

//开发脚手架
gulp.task("default", gulp.series("sass", gulp.parallel("font:watch", "sass:watch", "serve")));