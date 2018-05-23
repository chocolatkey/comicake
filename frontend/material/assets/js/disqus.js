import { COMMENTS } from "./constants";
export default function loadDisqus(target) {
    if(!COMMENTS)
        return;
    target.innerHTML += "<div id=\"disqus_thread\"></div>";
    let dthread = document.getElementById("disqus_thread");

    window.disqus_config = function () {
        this.page.identifier = document.URL;
        this.page.title = document.title;
    };
    var d = document, s = d.createElement("script");
    s.src = "https://" + COMMENTS + ".disqus.com/embed.js";
    s.setAttribute("data-timestamp", + new Date());
    (d.head || d.body).appendChild(s);

    dthread.classList.add("shown");
}