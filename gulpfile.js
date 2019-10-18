const gulp = require('gulp');
const fontmin = require("gulp-fontmin");

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
        .src(['./views/*.html', './views/*.shtml'])
        .on('data', function (file) {
            buffers.push(file.contents);
        })
        .on('end', function () {
            var text = Buffer.concat(buffers).toString('utf-8');
            minifyFont(text, cb);
        });
});