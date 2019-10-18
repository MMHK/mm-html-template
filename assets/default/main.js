import app from "../common/app";
import index from "./page/index";
import home from "./page/home";
const modules = {
    index,
    home
};

app.render_page(modules);