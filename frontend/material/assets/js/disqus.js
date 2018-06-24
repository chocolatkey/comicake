import { COMMENTS } from "./constants";
export default function loadDisqus(target, identifier, compact) {
    if(!COMMENTS)
        return;
    if(typeof COMMENTS != "string") {
        console.error("COMMENTS constant is not a string!");
        return;
    }
    target.innerHTML += "<div id=\"disqus_thread\"></div>";
    let dthread = document.getElementById("disqus_thread");

    window.disqus_config = function () {
        this.page.identifier = identifier;
        this.page.title = document.title;
    };
    var d = document, s = d.createElement("script");
    s.src = "https://" + COMMENTS + ".disqus.com/embed.js";
    s.setAttribute("data-timestamp", + new Date());
    (d.head || d.body).appendChild(s);

    if(compact)
        dthread.classList.add("compact");
    dthread.classList.add("shown");
}