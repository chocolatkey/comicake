define(['vendor/stimulus.umd', 'vendor/turbolinks'], function (Stimulus, turbolinks) {
    class Search extends Stimulus.Controller {
        static get targets() {
            return ["popup", "toggler"]
        }

        connect() {
            this.hidden = true;
            //console.log("Nav search attached", this.element);
        }

        toggle() {
            this.popupTarget.classList.toggle('hide');
            if(this.hidden) {
                this.togglerTarget.textContent = 'close';
            } else {
                this.togglerTarget.textContent = 'search';
            }
            this.hidden = !this.hidden;
        }
    }
    class Clickable extends Stimulus.Controller {
        static get targets() {
            return ["target"]
        }

        connect() {
            //console.log("Clickable attached", this.element);
        }

        click(event) {
            let target = event.srcElement.querySelectorAll("[data-target='clickable.target']");
            if(target.length == 1) {
                turbolinks.visit(target[0].href);
            } else {
                // TODO Raven error
                console.error("Failed to acquire clickable target link");
            }
        }
    }
    return {
        Search, Clickable
    };
});