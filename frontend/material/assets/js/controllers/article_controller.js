import { Controller } from "stimulus";
import loadDisqus from "../disqus";
//import Turbolinks from "turbolinks";
export default class Article extends Controller {
    static get targets() {
        return ["main"];
    }

    connect() {
        loadDisqus(this.mainTarget);
    }
}