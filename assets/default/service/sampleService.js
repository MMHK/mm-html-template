import axios from "axios";

const http = axios.create({
    baseURL: global.API_URI || "",
})

http.interceptors.response.use(function (resp) {
    return Promise.resolve(resp.data);
});

export default {
    getSampleText() {
        return http.get("/", {
            params: {
                type: "meat-and-filler",
                paras: 3,
                "start-with-lorem": 1,
                format: "html",
            }
        });
    },
    guwen() {
        return http.get("/../guwen/selectall", {
            params: {
                page: 1
            }
        });
    }
}