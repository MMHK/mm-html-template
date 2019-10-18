import app from "../common/app";
import index from "./page/index";
import home from "./page/home";
import vue from "./page/vue-sample"
const modules = {
    index,
    home,
    vue
};

app.render_page(modules);