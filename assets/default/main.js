import app from "../common/app";
import index from "./page/index";
import home from "./page/home";
import vue from "./page/vue-sample"
import amd from "./page/amd"

const modules = {
    index,
    home,
    vue,
    amd
};

app.render_page(modules);