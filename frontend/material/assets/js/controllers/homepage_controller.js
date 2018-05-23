import { Controller } from "stimulus";
import Mustache from "mustache";
import discordTemplate from "../mst/discord.html";
import { DISCORD } from "../constants";
import loadDisqus from "../disqus";
import "whatwg-fetch";
import Siema from "siema";
//import Turbolinks from "turbolinks";
export default class Homepage extends Controller {
    static get targets() {
        return ["slideshow", "nextslide", "prevslide", "main", "discord"];
    }

    connect() {
        this.slideshow = new Siema({
            selector: this.slideshowTarget,
            duration: 200,
            easing: "ease-out",
            perPage: {
                0: 1,
                300: 2,
                600: 3,
                800: 4,
            },
            startIndex: 0,
            draggable: true,
            multipleDrag: true,
            threshold: 20,
            loop: true,
            rtl: false,
        });
        //loadDisqus(this.mainTarget);
        Mustache.parse(discordTemplate);
        this.doDiscord();
        
    }

    doDiscord() {
        if(!DISCORD)
            return;
        return fetch("https://discordapp.com/api/guilds/" + DISCORD + "/widget.json").then(response => {
            if (!response.ok) {
                var error = new Error(response.statusText);
                error.message = response;
                throw error;
            }
            return response.json();
        }).then(data => {
            if(!data.instant_invite) {
                console.warn("Discord instant invite in widget not enabled");
                return;
            }
            this.discordTarget.innerHTML = Mustache.render(discordTemplate, {
                name: data.name,
                online: data.members.length,
                invite: data.instant_invite
            });
        }).catch(error => {
            console.error(error);
        });
    }

    next() {
        this.slideshow.next();
    }

    prev() {
        this.slideshow.prev();
    }
}