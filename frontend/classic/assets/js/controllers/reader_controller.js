import { Controller } from "stimulus";
import "core-js/fn/promise";
import Turbolinks from "turbolinks";
import preLoader from "pre-loader";
import cdn from "../cdn";

const PRELOAD_BACK = 2;
const PRELOAD_NEXT = 5;

export default class Reader extends Controller {
    static get targets() {
        return ["popup", "toggler", "pagecontainer", "pagelink", "page", "pagenum", "pageselector", "numbers", "topbar"];
    }

    connect() {
        //Turbolinks.visit(this.data.get("chapterBase"), { action: "replace" });
        this.isSpread = false;
        this.button_down = false;
        this.button_down_code = null;
        this.timeStamp37 = 0;
        this.timeStamp39 = 0;
        this.spineCache = [];

        this.orientation = this.data.get("comicProgression");
        if(!this.orientation) this.orientation = "ltr";

        if(!this.ttb) {
            this.create_numberPanel();
            const lc = location.hash.split("/");
            if(lc.length === 3 && lc[1] === "page")
                this.page = parseInt(lc[2]) - ((this.page > this.spine.length) ? 1 : 0);
            else if(this.page >= this.spine.length)
                this.page--;
            else
                this.page = this.page;
        }
    }

    get ttb() {
        return this.orientation === "ttb";
    }

    get pageData() {
        if(this.spine) {
            return this.spine[this.page - 1];
        }
        return {
            href: "" // TODO error
        };
    }

    get spine() {
        if(this.spineCache.length == 0) {
            const pj = JSON.parse(this.data.get("chapterSpine"));
            if(pj && pj.length > 0) this.spineCache = pj;
        }
        return this.spineCache;        
    }

    get page() {
        return parseInt(this.data.get("page"));
    }

    set page(value) {
        if(this.data.get("page") === value) return;
        this.data.set("page", value);
        if(value > 0 && value <= this.spine.length) {
            Turbolinks.controller.replaceHistoryWithLocationAndRestorationIdentifier(
                this.data.get("chapterBase") + "page/" + value,
                Turbolinks.uuid()
            );
        }
        this.changePage(value - 1);
    }

    create_numberPanel() {
        let result = "";
        const len = this.spine.length;
        for (let j = len + 1; j > 0; j--) {
            let nextnumber = ((j/1000 < 1 && len >= 1000) ? "0" : "") + ((j / 100 < 1 && len >= 100)? "0" : "" ) + ((j / 10 < 1 && len >= 10) ? "0" : "") + j;
            result += "<div class='number number_" + j +" dnone'><a href='" + this.data.get("chapterBase") + "page/" + j + "' data-action='click->reader#changeNumber'>" + nextnumber + "</a></div>";
        }

        this.numbersTarget.innerHTML = result;
    }

    getNumberButton(query, single = true) {
        const cp = this.numbersTarget.getElementsByClassName(query);
        if(cp && cp.length > 0)
            return single ? cp[0] : cp;
        else return null;
    }

    update_numberPanel() {
        const cp = this.getNumberButton("current_page");
        if(cp)
            cp.classList.remove("current_page");
        
        const ncp = this.getNumberButton("number_" + (this.page));
        if(ncp)
            ncp.classList.add("current_page");
        
        const numbers = this.getNumberButton("number", false);

        if(numbers)
            for(let number of numbers)
                number.classList.add("dnone");

        let val, i;
        for (i = ((val = this.page - 2) <= 0) ? (1) : val; i <= this.spine.length && i < this.page + 3; i++) {
            const num = this.getNumberButton("number_" + i);
            if(num)
                num.classList.remove("dnone");
        }
        this.pageselectorTarget.value = this.page;
        this.pagenumTarget.innerHTML = this.page;
    }

    preload(id) {
        let array = [];
        let arraydata = [];
        let page;
        for(let i = -PRELOAD_BACK; i < PRELOAD_NEXT; i++)
        {
            if(id + i >= 0 && id + i < this.spine.length)
            {
                if(this.spine[(id+i)].loaded) continue;
                array.push(cdn.image(this.spine[(id+i)].href));
                this.spine[(id+i)].href = window.comicake.PATHS.static + "img/placeholder.svg";
                arraydata.push(id+i);
            }
        }

        new preLoader(array, {
            onProgress: (src, element, index) => {
                const idx = index - 1;
                if(index == page)
                    return false;
                page = arraydata[idx];
                this.spine[page].loaded = true;
                this.spine[page].href = src;
                const num = this.getNumberButton("number_" + (page + 1));
                if(num)
                    num.classList.add("loaded");
                if(this.page - 1 == page)
                {
                    this.pageTarget.style.opacity = 1; // TODO animate
                    this.pageTarget.src = this.pageData.href;
                    /* TODO onError
                    if(!data.found) { // Image failed to load
                        //$('#page .inner .open').attr('src', reader.base + '/content/themes/' + reader.theme + '/assets/images/pagefail.svg');
                        //create_message('error_page', 3000, reader.locale.pagefail.replace("#", (id + 1)));
                    } else
                        this.pageTarget.src = this.pageData.href;
                    */
                }
            }
        });
    }

    changeNumber(e) {
        e.preventDefault();
        this.page = parseInt(e.target.innerText.match(/\d{1,4}/i)[0], 10);
    }

    changePage(id, noscroll, nohash) {
        if(!this.spine || (this.spine && this.spine.length == 0)) return;

        if(id > (this.spine.length - 1))
        {
            Turbolinks.visit(this.data.get("nextChapter"));
            return false;
        } else if(id < 0){
            this.page = 1;
            return;
        }
        if(!this.ttb) this.preload(id);

        if(!noscroll) {
            let y = 0;
            if(this.ttb && this.page > 1) {
                const cp = document.getElementById("page-" + this.page);
                if(cp) y = cp.getBoundingClientRect().top;
            }
            else
                y = this.topbarTarget.getBoundingClientRect().top + window.scrollY;
            window.scroll(0, y);
            if(this.ttb) return;
        }

        if(this.pageData.loaded !== true) {
            this.pageTarget.style.opacity = 0;
            this.pageTarget.src = window.comicake.PATHS.static + "img/placeholder.svg";
        } else {
            this.pageTarget.style.opacity = 1;
            this.pageTarget.src = this.pageData.href;
        }

        this.resizePage(id);
        this.pagelinkTarget.href = `${this.data.get("chapterBase")}page/${this.page + 1}`;

        if(!this.ttb)
            this.update_numberPanel();
        //$('#pagelist .current').removeClass('current');
        return false;
    }

    asel(e) {
        if(!e.target) return;
        Turbolinks.visit(e.target.value);
    }

    psel(e) {
        const s = e.target;
        if(!s) return;
        this.page = parseInt(s[s.selectedIndex].value, 10);
    }

    scroll(e) {
        if(!this.ttb) return;
        
    }

    nextPage(e) {
        if(e) e.preventDefault();
        this.page++;
        return false;
    }

    prevPage(e) {
        if(e) e.preventDefault();
        this.page--;
        return false;
    }

    resizePage(id) {
        const doc_width = document.documentElement.clientWidth;
        const page_width = parseInt(this.pageData.width);
        const page_height = parseInt(this.pageData.height);
        let nice_width = 980;
        let perfect_width = 980;

        if(doc_width > 1200) {
            nice_width = 1120;
            perfect_width = 1000;
        }
        if(doc_width > 1600) {
            nice_width = 1400;
            perfect_width = 1300;
        }
        if(doc_width > 1800) {
            nice_width = 1600;
            perfect_width = 1500;
        }

        // TODO

        /*if (page_width > nice_width && (page_width / page_height) > 1.2) {
            if(page_height < 1610) {
                width = page_width;
                height = page_height;
            }
            else {
                height = 1600;
                width = page_width;
                width = (height * width) / (page_height);
            }

            if(reader.chapter.protected)
                genCanv(reader.chapter.pages[id], width, height);
            $("#page").css({'max-width': 'none', 'overflow':'auto'});
            $("#page").animate({scrollLeft:9000},250);
            $("#page .inner .open").css({'max-width':'99999px'});
            $('#page .inner .open').attr({width:width, height:height});
            if($("#page").width() < $("#page .inner .open").width()) {
                isSpread = true;
                //create_message('is_spread', 3000, 'Tap the arrows twice to change page');
            } else {
                $("#page").css({'max-width': width + 10, 'overflow':'hidden'});
                isSpread = false;
                //delete_message('is_spread');
            }
        }
        else{
            if(page_width < nice_width && doc_width > page_width + 10) {
                width = page_width;
                height = page_height;
            }
            else {
                width = (doc_width > perfect_width) ? perfect_width : doc_width; //  - 10
                height = page_height;
                height = (height * width) / page_width;
            }
            if(reader.chapter.protected)
                genCanv(reader.chapter.pages[id], width, height);
            $('#page .inner .open').attr({width:width, height:height});
            $("#page").css({'max-width':(width + 10) + 'px','overflow':'hidden'});
            $("#page .inner .open").css({'max-width':'100%'});
            isSpread = false;
            //delete_message('is_spread');
        }*/

        this.pagecontainerTarget.style = {
            maxWidth: "100%",
            overflow: "hidden"
        };
    }

    resize(e) {
        this.resizePage(this.page);
    }

    keyup(e) {
        this.button_down_code = window.clearInterval(this.button_down_code);
        this.button_down = false;
    }

    keydown(e) {
        if(this.button_down) return;
        if(document.activeElement && document.activeElement.nodeName === "INPUT") return;
        this.button_down = true;
        const code = e.keyCode || e.which;

        if(code === 37 || code === 65 || code === 8)
        {
            if(!this.isSpread) this.prevPage();
            else if(e.timeStamp - this.timeStamp37 < 400 && e.timeStamp - timeStamp37 > 150) this.prevPage();
            this.timeStamp37 = e.timeStamp;

            this.button_down = true;
            e.preventDefault();
            this.button_down_code = setInterval(function() {
                if (this.button_down) {
                    //$('#page').scrollTo("-=13",{axis:"x"});
                }
            }, 20);
        }
        if(code === 39 || code === 68)
        {
            if(!this.isSpread) this.nextPage();
            else if(e.timeStamp - this.timeStamp39 < 400 && e.timeStamp - this.timeStamp39 > 150) this.nextPage();
            this.timeStamp39 = e.timeStamp;

            this.button_down = true;
            e.preventDefault();
            this.button_down_code = setInterval(function() {
                if (this.button_down) {
                    //$('#page').scrollTo("+=13",{axis:"x"});
                }
            }, 20);
        }
    }
}