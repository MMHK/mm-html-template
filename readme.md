# MM-HTML-TEMPLATE

MM 中型项目 `html` 模版

## 编译前端环境

- 准备好 [NodeJS](https://nodejs.org/download/release/v15.14.0/node-v15.14.0-x64.msi)  环境。
- 准备好编译环境，在项目根目录执行
  - `npm` 安装方式  `npm install`。
  - `yarn` 方式 `yarn install`, 如没有安装 yarn 请先安装 yarn `npm i -g yarn`

## 文件目录结构

- `assets`， 存放所有的 `images` 、 `fonts`、`css`、`js`  等资源文件。
- `assets/common`，存放所有的第三方`js`组件。
- `assets/static`，存放所有的 `images` 、 `fonts`、`css` 等资源文件。
- `assets/default`，存放项目`js`文件。
- `views`，存放项目页面文件。


## 开发服务器

- `npm run serve` 命令会使用`NodeJS`启动一个开发服务器并打开浏览器。

> 有同事反应开发服务器开久了， `scss` 文件编译会失效，这个时候请尝试重启开发服务器。

开发服务器还支持 `SSI` (Server Side Includes), 支持简单的模板嵌套使用，解决组件复用问题。
具体支持的语法如下：

```html
//嵌入文件
<!--# include file="path" -->
//变量输出
<!--# set var="k" value="v" -->
<!--# echo var="n" default="default" -->
//条件分支表单式
<!--# if expr="test" -->
<!--# elif expr="" -->
<!--# else -->
<!--# endif -->
```

- 开发服务器内置 `hotreload` 及 `scss` 编译功能。

此项目layout比较特别，desktop layout 最大宽度是`1440px`，所以此网站尝试使用rem单位（与vw混合）。

`_common.scss` 已经引入 新的function `rem()`, 制作的时候直接使用 `rem(100000px)` 即可。

scss看考请看：http://sass.bootcss.com/docs/scss-for-sass-users/

## Embed font 说明

参考 `assets/static/style/_fonts.scss`, 先准备好 `@font-face` block。

```
@font-face {
    font-family: "[FontName]";
    src: url("../fonts/[FontName].eot"); /* IE9 */
    src: url("../fonts/[FontName].eot?#iefix") format("embedded-opentype"), /* IE6-IE8 */
    url("../fonts/[FontName].woff") format("woff"), /* chrome, firefox */
    url("../fonts/[FontName].woff2") format("woff2"), /* chrome, firefox */
    url("../fonts/[FontName].ttf") format("truetype"), /* chrome, firefox, opera, Safari, Android, iOS 4.2+ */
    url("../fonts/[FontName].svg#[FontName]") format("svg"); /* iOS 4.1- */
    font-style: normal;
    font-weight: 400;
}
```

其中 `assets/static/fonts/` 目录下**必需要准备好 font 的 `ttf` 文件**，`fontmin-webpack` 会自动将`ttf` 文件转换成其他格式的文件。
如果 `ttf` 文件超过 500K，将会对font 进行裁剪（常见于中文font），裁剪字符集来自 `view` 目录下的所有的 `*.[html|shtml]`。

## 项目打包

- 执行编译命令 `npm run build`。


