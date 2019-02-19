var gulp = require('gulp');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var concat = require('gulp-concat');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var webserver = require('gulp-webserver');
var connectSSI = require('connect-ssi');
var ssi = require("node-ssi");
var gutil = require('gulp-util');
var fontmin = require("gulp-fontmin");
var through = require('through2'); 
var htmlreplace = require('gulp-html-replace');
var crypto = require('crypto');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var glob = require("glob");
var path = require("path");
var prompt = require("gulp-prompt");
var rename = require("gulp-rename");
var modifyCssUrls = require('gulp-modify-css-urls');
var rjs = require('gulp-requirejs-optimize');

/**
 * 获取AMD模块 
 */
var getAMDModule = function (basepath, globlist) {
    var list = [];

    globlist.forEach(function (item) {
        list = list.concat(glob.sync(path.join(basepath, item)));
    });

    list = list.map(function (item) {
        return path.relative(basepath, item).replace(".js", "").split(path.sep).join("/");
    })
    
    return list;
}

/**
 *
 * 打包css
 */
function bundleCSS(rjsConfig) {
    var basePath = rjsConfig.entryDir,
        CssList = rjsConfig.css.concat([
            __dirname + "/FUNCTION.css"
        ]);
    
    var processors = [
        //自动增加css平台兼容前缀
        autoprefixer({
            browsers: ['> 0.5%']
        }),
        //css 压缩去重
        cssnano({
            safe: true,
            autoprefixer: false,
        })
    ];
    return gulp.src(CssList)
        .pipe(modifyCssUrls({
            modify: function (url, filepath) {
                var p = path.join(path.dirname(filepath), url);
                return path.relative(basePath, p).replace(/\\/ig, '/');
            }
        }))
        .pipe(sourcemaps.init({
            largeFile: true,
            loadMaps: false
        }))
        .pipe(concat('main.min.css'))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(basePath))
        .on("end", function () {
            console.log("minify bundle css complete");
        });
}

/**
 * 通用requireJS打包
 */
function rjsCommon(basePath, configPath) {
    console.log("begin bundle amd modules");
    var extraConfig = arguments.length > 2 ? arguments[2] : {};

    global.window = {};
    global.BASE_PATH = basePath;
    global.VERSION = (new Date()).getMilliseconds();
    global.requirejs = function(){};
    global.requirejs.config = function (options) {
        rjsConfig = Object.assign({
            wrapShim: true,
            useStrict: true,
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

    return gulp.src(rjsConfig.entry)
        .pipe(sourcemaps.init({
            largeFile: true
        }))
        .pipe(rjs(rjsConfig))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(basePath))
        .on("end", function () {
            console.log("bundle amd modules complete");
            /**
             * 合并js
             */
            console.log("begin minify main js");
            gulp.src(rjsConfig.vendor.concat([
                    rjsConfig.entryDir + "/modules.js"
                ]))
                .pipe(sourcemaps.init({
                    loadMaps: true,
                    largeFile: true
                }))
                .pipe(concat("main.min.js"))
                .pipe(uglify().on("error", function () {
                    console.log(arguments);
                }))
                .pipe(sourcemaps.write("."))
                .pipe(gulp.dest(rjsConfig.entryDir))
                .on("end", function () {
                    console.log("minify main js complete");
                });
            /**
             * 合并css
             */
            console.log("begin minify bundle css");
            return bundleCSS(rjsConfig);
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
     gulp.src("*")
        .pipe(prompt.prompt([
            {
                type:'list',
                name:'namespace',
                message:'请选择存放位置',
                choices: glob.sync(__dirname + "/assets/*/").map(function (p) {
                    return path.basename(p);
                }),
            },
            {
                type:'list',
                name:'type',
                message:'请选择模板类型?',
                choices: ['page', 'service', 'component'],
            },
            {
                type: 'input',
                name: 'name',
                message: "请填写文件名（不包含路径）",
                validate: function(value) {
                    var reg = /^([0-9a-z\-\/]{1,12})$/i
                    if (reg.test(value)) {
                        return true;
                    }
                    return '请填写正确的文件名';
                }
            }
        ], function(result){
            gulp.src("./assets/common/gulp/" + result.type + ".js")
                .pipe(replace("<?= page ?>", result.name))
                .pipe(replace("<?= type ?>", result.type))
                .pipe(replace("<?= namespace ?>", result.namespace))
                .pipe(rename( result.name + (result.type == "component" ? ".vue" : ".js")))
                .pipe(gulp.dest([basePath, result.namespace, result.type].join("/") + "/"))
        }))
}
//js 模板生成器
gulp.task("generator", function () {
    return commonTemplate("./assets")
});

/**
 * 编译前端代码
 */
gulp.task("build",function () {
    gulp.src("*")
        .pipe(prompt.prompt([
            {
                type:'list',
                name:'namespace',
                message:'请选择编译目录',
                choices: glob.sync(__dirname + "/assets/*/").map(function (p) {
                    return path.basename(p);
                }),
            }
        ], function(result){
            return bundle(__dirname + "/assets", result.namespace);
        }));
});

gulp.task("dist", ["build", "html", "sass"], function(){
    gulp.src([
        "./assets/default/main.min.*"
    ])
    .pipe(gulp.dest("./dist/assets/default/"));
});

//ssi 编译处理
var ssiHandler = function(options) {
    if (arguments.length <= 0) {
        options = {};
    }
    var opt = Object.assign({
        baseDir: "./",
        encoding: "utf-8"
    }, options);
    
    var handler = new ssi(opt);
    
    return through.obj(function(file, encoding, callback) {
        if (file.isNull()) {
            return callback();
        }
        if (file.isStream()) {
            callback(new gutil.PluginError("ssiHandler", 'Streaming not supported'));
            return;
        }
        if (file.isBuffer()) {
            handler.compileFile(file.path, {
                encoding: encoding
            }, function(error, content){
                file.contents = new Buffer(content);
                callback(error, file);
            });
        }
    });
};
// 生成随即字符
function getHash() {
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
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
gulp.task('font', function (cb) {
    var buffers = [];
    gulp
        .src(['./*.html', '*.shtml'])
        .on('data', function (file) {
            buffers.push(file.contents);
        })
        .on('end', function () {
            var text = Buffer.concat(buffers).toString('utf-8');
            minifyFont(text, cb);
        });
});

gulp.task("static", function () {
    return gulp.src(['./assets/static/images/**/*'])
        .pipe(gulp.dest('./dist/assets/static/images/'))
        .on("end", function(){
            return gulp.src("./assets/static/fonts/*")
            .pipe(gulp.dest('./dist/assets/static/fonts/'));
        })
});

gulp.task("html", ["static"], function () {
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

gulp.task('sass:watch', function () {
    gulp.watch('./assets/static/style/*.scss', ['sass']);
});
/**
 * 开发服务器
 */
gulp.task("dev", ["sass", "sass:watch"],function (cb) {

    gulp.src('./')
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



//开发脚手架
gulp.task("default", ["dev"]);