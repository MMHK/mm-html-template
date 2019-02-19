# MM-HTML-TEMPLATE

MM 中型项目 `html` 模版

## 编译前端环境

- 准备好 [NodeJS](https://nodejs.org/dist/v8.9.1/node-v8.9.1-x64.msi)  环境。
- 准备好编译环境，在项目根目录执行 `npm install`。


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


## 打包中文字体

`gulp font` 命令会将`assets/static/fonts/src`文件中使用过的中文字体压缩到`assets/static/fonts`目录下，

**中文源字体请放到 `assets/static/fonts/src` 目录下**。

## 项目打包

- 执行编译命令 `npm run dist`。


