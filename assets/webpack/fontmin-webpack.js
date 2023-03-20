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

        // log("compilation.assets", compilation.assets);

        return _.uniqBy(regular.concat(extract), 'asset')
    }

    findRegularFontFiles(compilation) {
        return _(Array.from(compilation.modules))
            .filter(module => this.hasFontAsset(module.buildInfo.assets))
            .map(module => {
                return _.keys(module.buildInfo.assets).map(asset => {
                    const filename = module.buildInfo.assetsInfo.get(asset)?.sourceFilename || asset;
                    const buffer = module.buildInfo.assets[asset].source()
                    const extension = path.extname(asset)
                    const font = path.basename(filename, path.extname(filename))
                    return {asset, extension, font, buffer}
                }).filter(asset => {
                    return FONT_REGEX.test(asset.asset);
                })
            })
            .flatten()
            .value()
    }

    findExtractTextFontFiles(compilation) {
        const fileDependencies = _(Array.from(compilation.modules))
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

        // log('mergeAssetsAndFiles', group);

        return _.map(byExtension, (item, extension) => {
                // const isWoff2 = (extension === '.woff2');
                const buffer = item.contents;
                if (!buffer) {
                    return undefined
                }

                const minified = buffer;
                const asset = first.asset.replace(first.extension, extension);
                const font = first.font;
                // log('mini out', {minified, asset, extension, font, buffer })
                return {minified, asset, extension, font, buffer}
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
        // log('fontFiles', fontFiles);
        const glyphsInCss = this.findUnicodeGlyphs(compilation)
        // log(`found ${glyphsInCss.length} glyphs in CSS`)
        const minifiableFonts = _(fontFiles).groupBy('font').values();

        // log('minifiableFonts', _(fontFiles).groupBy('font'));

        const glyphs = await this.computeFinalGlyphs(glyphsInCss)
        await minifiableFonts.reduce((prev, group) => {
            return prev
                .then(() => {
                    return this.minifyFontGroup(group, glyphs)
                })
                .then(files => {
                    // log('after minifyFontGroup', files);

                    files.forEach(file => {
                        if (compilation.assets[file.asset]) {
                            compilation.assets[file.asset].buffer = file.minified;
                        } else {
                            compilation.assets[file.asset] = new RawSource(file.minified);
                        }
                        // log("minified", compilation.assets[file.asset]);
                    });
                    return Promise.resolve();
                })
        }, Promise.resolve())
    }

    apply(compiler) {
        compiler.hooks.thisCompilation.tap('FontminPlugin', compilation => {
            compilation.hooks.additionalAssets.tapPromise('FontminPlugin', () => {
                if (!compilation.modules || !compilation.assets) {
                    // eslint-disable-next-line no-console
                    console.warn(`[FontminPlugin] Failed to detect modules. Check your webpack version!`)
                    return Promise.resolve()
                }
                return this.onAdditionalAssets(compilation);
            })
        });
    }
}

module.exports = FontminPlugin
