import modules from "../default/page/*.js";
import app from "../common/app";


const pageList = app.matchPage();

pageList.forEach((page) => {
    const found = modules.find((item) => {
        return item.fileName.includes(page)
    });

    const { module } = found,
        { __esModule } = module;

    if (__esModule) {
        module.default.render();
    } else {
        module.render();
    }
});
