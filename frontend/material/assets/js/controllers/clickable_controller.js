import { Controller } from "stimulus";
//import Turbolinks from "turbolinks";
export default class Clickable extends Controller {
    static get targets() {
        return ["target"];
    }

    click(event) {
        let it = event.target || event.srcElement;
        const target = it.querySelectorAll("[data-target='clickable.target']");
        if(target.length == 1) {
            //Turbolinks.visit(target[0].href);
            window.location = target[0].href;
        } else {
            // TODO Raven error
            console.error("Failed to acquire clickable target link");
        }
    }
}