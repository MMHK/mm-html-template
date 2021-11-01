const fs = require('fs')
const path = require('path')
const log = require('debug')('fontmin-webpack');

const _ = require('lodash');
const ttf2woff2 = require('ttf2woff2');
const Fontmin = require('fontmin');
const RawSource = require('webpack-sources').RawSource;

const FONT_REGEX = /\.(eot|ttf|svg|woff|woff2)$/;
const TEXT_REGEX = /\.(js|css|html)$/
const GLYPH_REGEX = /content\s*:[^};]*?('|")(.*?)\s*('|"|;)/g;
const UNICODE_REGEX = /\\(\w{4})/;
const FONTMIN_EXTENSIONS = ['eot', 'woff', 'svg', 'woff2'];

class FontminPlugin {
    constructor(options) {
        this._options = _.assign({
            glyphs: [],
            autodetect: true,
        }, options)
    }

    async computeFinalGlyphs(foundGlyphs) {
        let glyphs;
        if (this._options.glyphs && this._options.glyphs instanceof Promise) {
            glyphs = await this._options.glyphs;
        }

        glyphs = _.clone(glyphs || this._options.glyphs);
        if (this._options.autodetect) {
            glyphs = glyphs.concat(foundGlyphs)
        }

        return glyphs
    }

    hasFontAsset(assets) {
        return _.find(assets, (val, key) => FONT_REGEX.test(key))
    }

    findFontFiles(compilation) {
        const regular = this.findRegularFontFiles(compilation)
        const extract = this.findExtractTextFontFiles(compilation)

        return _.uniqBy(regular.concat(extract), 'asset')
    }

    findRegularFontFiles(compilation) {
        return _(compilation.modules)
            .filter(module => this.hasFontAsset(module.buildInfo.assets))
            .map(module => {
                const filename = Array.from(module.buildInfo.fileDependencies)[0]

                // log(module.buildInfo)
                return _.keys(module.buildInfo.assets).map(asset => {
                    const buffer = module.buildInfo.assets[asset].source()
                    const extension = path.extname(asset)
                    const font = path.basename(asset, path.extname(asset))
                    return {asset, extension, font, buffer}
                })
            })
            .flatten()
            .value()
    }

    findExtractTextFontFiles(compilation) {
        const fileDependencies = _(compilation.modules)
            .map(module => Array.from(module.buildInfo.fileDependencies || new Set()))
            .flatten()
            .filter(filename => FONT_REGEX.test(filename))
            .map(filename => {
                return {
                    filename,
                    stats: fs.statSync(filename),
                }
            })
            .value()

        return _(compilation.assets)
            .keys()
            .filter(name => FONT_REGEX.test(name))
            .map(asset => {
                const buffer = compilation.assets[asset].source()
                const extension = path.extname(asset)
                const dependency = fileDependencies.find(dependency => {
                    return path.extname(dependency.filename) === extension &&
                        buffer.length === dependency.stats.size
                })
                const filename = (dependency && dependency.filename) || asset
                const font = path.basename(filename, extension)
                return {asset, extension, font, buffer}
            })
            .value()
    }

    findUnicodeGlyphs(compilation) {
        return _(compilation.assets)
            .map((asset, name) => ({asset, name}))
            .filter(item => TEXT_REGEX.test(item.name))
            .map(item => {
                const content = item.asset.source()
                const matches = content.match(GLYPH_REGEX) || []
                return matches
                    .map(match => {
                        const unicodeMatch = match.match(UNICODE_REGEX)
                        return unicodeMatch ?
                            String.fromCharCode(parseInt(unicodeMatch[1], 16)) :
                            false
                    })
                    .filter(Boolean)
            })
            .flatten()
            .value()
    }

    setupFontmin(extensions, usedGlyphs = []) {
        usedGlyphs = _.isArray(usedGlyphs) ? usedGlyphs : [usedGlyphs]
        let fontmin = new Fontmin().use(Fontmin.glyph({text: usedGlyphs.join(' ')}))
        FONTMIN_EXTENSIONS.forEach(ext => {
            // if (extensions.includes('.' + ext)) {
                fontmin = fontmin.use(Fontmin[`ttf2${ext}`]())
            // }
        });

        return fontmin
    }

    mergeAssetsAndFiles(group, files) {
        const byExtension = _.keyBy(files, 'extname')

        const first = group[0];

        return _.map(byExtension, (item, extension) => {
                // const isWoff2 = (extension === '.woff2');
                const buffer = item.contents;
                if (!buffer) {
                    return undefined
                }

                const minified = buffer;
                const asset = first.asset.replace(first.extension, extension);
                const font = first.font;
                return {minified, asset, extension, font, buffer }
            });

    }

    minifyFontGroup(group, usedGlyphs = []) {
        let _usedGlyphs = usedGlyphs;
        log('analyzing font group:', _.get(group, '0.font'))

        const ttfInfo = _.find(group, {extension: '.ttf'})
        if (!ttfInfo) {
            log('font group has no TTF file, skipping...')
            return Promise.resolve([])
        }

        if (ttfInfo.buffer.length <= (500 * 1024)) {
            log('TTF file <= 500K, skipping usedGlyphs...');
            _usedGlyphs = [];
        }

        const extensions = _.map(group, 'extension')
        const fontmin = this.setupFontmin(extensions, _usedGlyphs)
        return new Promise((resolve, reject) => {
            fontmin
                .src(ttfInfo.buffer)
                .run((err, files) => {
                    // console.log(files);
                    if (err) {
                        reject(err)
                    } else {
                        resolve(this.mergeAssetsAndFiles(group, files))
                    }
                })
        })
    }

    async onAdditionalAssets(compilation) {
        const fontFiles = this.findFontFiles(compilation)

        const glyphsInCss = this.findUnicodeGlyphs(compilation)
        log(`found ${glyphsInCss.length} glyphs in CSS`)
        const minifiableFonts = _(fontFiles).groupBy('font').values();

        // console.log(minifiableFonts);

        const glyphs = await this.computeFinalGlyphs(glyphsInCss)
        await minifiableFonts.reduce((prev, group) => {
            return prev
                .then(() => {
                    return this.minifyFontGroup(group, glyphs)
                })
                .then(files => {
                    // console.log(files);

                    files.forEach(file => {
                        compilation.assets[file.asset] = new RawSource(file.minified)
                    });
                    return Promise.resolve();
                })
        }, Promise.resolve())
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap('FontminPlugin', compilation => {
            compilation.hooks.additionalAssets.tapAsync('FontminPlugin', async (done) => {
                await this.onAdditionalAssets(compilation);
                done()
            })
        });

        compiler.resolverFactory.plugin('resolver normal', resolver => {
            resolver.hooks.resolve.tapAsync('FontminPlugin', (request, resolveContext, callback) => {

                const testReg = /\.(woff|woff2|svg|eot)$/i;
                const filePath = path.join(request.path, request.request);
                if (testReg.test(filePath) && !fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, "");

                    return resolver.doResolve(resolver.hooks.resolve, request, null, resolveContext, callback);
                }

                callback();
            });
        });
    }
}

module.exports = FontminPlugin
