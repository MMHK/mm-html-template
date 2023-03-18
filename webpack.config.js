const webpack = require('webpack');
const {globSync} = require("glob");
const path = require("path");
const fs = require("fs");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const frp = require("mmhk-frp");
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();
const http = require('http');

const FRP_ENDPOINT = process.env.FRP_ENDPOINT || 'localhost';
const FRP_ENDPOINT_PORT = process.env.FRP_ENDPOINT_PORT || 7000;
const FRP_API_PORT = process.env.FRP_ENDPOINT_PORT || 7001;
const FRP_API_USER = process.env.FRP_API_USER || 'admin';
const FRP_API_PWD = process.env.FRP_API_PWD || 'admin';
const isDevServer = process.env.WEBPACK_DEV_SERVER;

const checkSubDomainExist = (domain) => {
	const auth = `${FRP_API_USER}:${FRP_API_PWD}`;

	return new Promise((resolve, reject) => {
		const req = http.get({
			hostname: FRP_ENDPOINT,
			port: FRP_API_PORT,
			path: '/api/proxy/http',
			headers: { 'Content-Type': 'application/json' },
			auth: auth,
		}, (resp) => {
			resp.setEncoding('utf8');
			let data = '';

			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk;
			});

			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				let json = {};
				try {
					json = JSON.parse(data);
					resolve(json);
				} catch (err) {
					reject(err)
				}
			});

		});
		req.on('error', (err) => {
			console.error(`http error: ${err}`);
			reject(err);
		});
		req.end();
	})
		.then((data) => {
			const list = Array.from(data.proxies || []);
			if (list.find((row) => {
				return row.name === domain && row.status === 'online';
			})) {
				return Promise.resolve(true);
			}

			return Promise.resolve(false);
		})
}

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
const { VueLoaderPlugin } = require('vue-loader');
const FontminPlugin = require('./assets/webpack/fontmin-webpack.js');

/*
 * We've enabled HtmlWebpackPlugin for you! This generates a html
 * page for you when you compile webpack, which will make you start
 * developing and prototyping faster.
 *
 * https://github.com/jantimon/html-webpack-plugin
 *
 */

const HTMlEntryList = globSync("./views/*.html").map((ele) => {
	return new HtmlWebpackPlugin({
		filename: path.basename(ele),
		template: ele,
		hash: true
	})
});

const getFontmin = () => {
	let charList = globSync("views/*.{html,shtml}").map((file) => {
		return fs.readFileSync(file)
	})

	return new FontminPlugin({
		autodetect: false, // automatically pull unicode characters from CSS
		glyphs: Buffer.concat(charList).toString('utf-8').split(""),
	})
};

const config = {
	mode: 'development',
	entry: [
		'./assets/default/main.js',
		'./assets/static/style/main.scss'
	],

	output: {
		path: path.resolve(__dirname, 'dist'),
		chunkFilename: 'js/[name].js',
		filename: 'js/[name].js',
		assetModuleFilename: 'assets/[hash][ext][query]',
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
			// chunkFilename: 'css/[id].css',
			ignoreOrder: false, // Enable to remove warnings about conflicting order
		}),

		new CleanWebpackPlugin(),

		new VueLoaderPlugin(),

		getFontmin(),

	].concat(HTMlEntryList),

	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
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
							postcssOptions: {
								plugins: [
									"autoprefixer",
								],
							},
							sourceMap: true,
						}
					},
					{
						loader: 'sass-loader',
						options: {
							additionalData: '@import "common";',
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
				type: 'asset',
			},
			{
				test: require.resolve('jquery'),
				loader:'expose-loader',
				options: {
					exposes: ["$", "jQuery"],
				}
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
			// cacheGroups: {
			// 	vendors: {
			// 		name: 'vendor',
			// 		chunks: 'initial',
			// 		test: /node_modules/,
			// 		priority: 10,
			// 	}
			// },


			chunks: 'async',
			minChunks: 1,
			minSize: 30000,
			name: false
		},

		minimizer: [
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						'default',
						{
							mergeLonghand: false,
							cssDeclarationSorter: false
						}
					]
				},
			}),
		],

		minimize: process.env.NODE_ENV !== 'development',
	},

	devtool: "source-map",
	// watch: process.env.NODE_ENV === 'development',
	watchOptions: {
		ignored: /(node_modules|webpack)/
	},
	devServer: {
		open: true,
		// static: {
		// 	directory: path.join(__dirname, 'dist'),
		// },
		compress: true,
		allowedHosts: [
			"localhost",
			".demo2.mixmedia.com",
		],
		proxy: {
			"/api": {
				target: "https://baconipsum.com/api",
				secure: false,
				changeOrigin: true,
			}
		},
	}
};

if (!isDevServer) {
	module.exports = config;
	return;
}

module.exports = prompt([
	{
		type: 'list',
		name: 'public',
		message: '请问是否允外网访问',
		choices: [
			{
				name: "允许",
				value: true
			},
			{
				name: "不需要",
				value: false
			},
		],
	},
	{
		type: 'input',
		name: 'subdomain',
		message: '请配一个霸气的域名',
		validate: (input) => {
			return /^([a-z0-9\-]{4,})$/i.test(input);
		},
		when: ({public}) => {
			return public;
		}
	},
]).then(({public, subdomain}) => {
	return Promise.resolve({
		...config,
		devServer: {
			...config.devServer,
			open: !public ? true : {
				target: `http://${subdomain}.localhost`,
			},
			onListening: (devServer) => {
				if (!devServer) {
					throw new Error('webpack-dev-server is not defined');
				}
				if (!public) {
					return;
				}
				const addr = devServer.server.address();

				console.log('set domain:', subdomain);

				checkSubDomainExist(subdomain)
					.then((exist) => {
						if (!exist) {
							let conf = {
									common: {
										serverPort: FRP_ENDPOINT_PORT,
										serverAddr: FRP_ENDPOINT,
									},
								};
							conf[subdomain] = {
								type: "http",
								localIp: "127.0.0.1",
								localPort: addr.port,
								subdomain,
							};

							return frp.startClient(conf);
						}
						return Promise.reject(new Error('已经有人使用此霸气的名字'));
					})
					.catch((err) => {
						console.error(err);
						return Promise.reject(err);
					})
			},
		}
	})
})
