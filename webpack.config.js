const webpack = require('webpack');
const glob = require("glob");
const path = require("path");
const fs = require("fs");
const autoprefixer = require('autoprefixer');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const FontminPlugin = require('./assets/webpack/fontmin-webpack.js');

/*
 * We've enabled HtmlWebpackPlugin for you! This generates a html
 * page for you when you compile webpack, which will make you start
 * developing and prototyping faster.
 *
 * https://github.com/jantimon/html-webpack-plugin
 *
 */

const HTMlEntryList = glob.sync("./views/*.html").map((ele) => {
	return new HtmlWebpackPlugin({
		filename: path.basename(ele),
		template: ele,
		hash: true
	})
});

const getFontmin = () => {
	let charList = glob.sync(path.join(__dirname, "/views/*")).map((file) => {
		return fs.readFileSync(file)
	})
	
	return new FontminPlugin({
		autodetect: true, // automatically pull unicode characters from CSS
		glyphs: Buffer.concat(charList).toString('utf-8').split(""),
	})
};



module.exports = {
	mode: 'development',
	entry: [
		'./assets/default/main.js',
		'./assets/static/style/main.scss'
    ],

	output: {
		path: path.resolve(__dirname, 'dist'),
		chunkFilename: 'js/[name].js',
		filename: 'js/[name].js',
	},

	resolve: {
		alias: {
			'vue$': (process.env.NODE_ENV === 'development' ? 
			"vue/dist/vue.esm.js" : 
			"vue/dist/vue.min.js"),
		}
	},

	plugins: [new webpack.ProgressPlugin(),

	new MiniCssExtractPlugin({
		// Options similar to the same options in webpackOptions.output
		// all options are optional
		filename: 'css/[name].css',
		chunkFilename: 'css/[id].css',
		ignoreOrder: false, // Enable to remove warnings about conflicting order
	}),

	new OptimizeCssnanoPlugin({
		sourceMap: true,
		cssnanoOptions: {
			preset: [
				'default',
				{
					mergeLonghand: false,
					cssDeclarationSorter: false
				}
			]
		}
	}),

	new CleanWebpackPlugin(),

	new VueLoaderPlugin(),

	getFontmin(),

	].concat(HTMlEntryList),

	module: {
		rules: [
			{
				test: /.(js)$/,
				include: [
					path.resolve(__dirname, 'assets'),
				],
                exclude: /(node_modules|webpack)/,
                use: [
					{
						loader: 'babel-loader',
						options: {
							plugins: [
								[
									"@babel/plugin-transform-template-literals", {
									loose: true
								}],
								"@babel/plugin-transform-runtime",
								"@babel/plugin-syntax-dynamic-import"
							],

							presets: [
								[
									'@babel/preset-env',
									{
										modules: false,
										useBuiltIns: "usage",
										corejs: 3
									}
								]
							]
						}
					},
				],
				
			},
			{
				test: /\.html$/,
				use: [
					{ loader: 'html-loader' },
					{
						loader: path.resolve('./assets/webpack/ssi-loader'),
						options: {
							baseDir: path.join(__dirname, "views/"),
						}
					},
				]
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							// you can specify a publicPath here
							// by default it uses publicPath in webpackOptions.output
							publicPath: "../",
							hmr: process.env.NODE_ENV === 'development',
						},
					},
					{
						loader: 'css-loader',
						options: {
							sourceMap: true
						}
					},
					{
						loader: 'postcss-loader',
						options: {
						  sourceMap: true,
						  plugins: () => [autoprefixer()],
						}
					},
					{
						loader: 'sass-loader',
						options: {
							prependData: '@import "common";',
							sourceMap: true,
							sassOptions: {
								includePaths: [
									path.resolve(__dirname, "./assets/static/style/")
								]
							}
						}
					},
				],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpe?g|gif)$/i,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[path][name].[ext]'
						},
					},
				],
			},
			{
				test:require.resolve('jquery'),
				use:'expose-loader?$'
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
			{
				test: /\.css$/,
				use: [
					'vue-style-loader',
					'css-loader'
				]
			},
		]
	},

	optimization: {
		splitChunks: {
			cacheGroups: {
				// vendors: {
				// 	name: 'vendor',
				// 	chunks: 'initial',
				// 	test: /node_modules/,
				// 	priority: 10,
				// }
			},


			chunks: 'async',
			minChunks: 1,
			minSize: 30000,
			name: true
		},

		minimize: process.env.NODE_ENV !== 'development',
	},

	devtool: process.env.NODE_ENV === 'development' ? false : "source-map",
	watch: process.env.NODE_ENV === 'development',
	watchOptions: {
		ignored: /node_modules/
	},
	devServer: {
		open: true,
		contentBase: path.join(__dirname, 'dist'),
		compress: true,
		proxy: {
            "/api": {
				target: "https://baconipsum.com/api",
				secure: false,
    			changeOrigin: true,
			}
        },
	}
};
