import { Controller } from "stimulus";
import Mustache from "mustache";
import axios from "axios";
import delayPromise from "delay-promise";

import searchResultsTemplate from "../mst/search.html";
import * as constants from "../constants";
import { MDCTextField } from "@material/textfield";

export default class Search extends Controller {
    static get targets() {
        return ["popup", "toggler", "field", "results", "wrapper"];
    }

    connect() {
        this.hidden = true;
        this.suggestionAllowed = true;
        //this.queryQueue = [];
        this.queryQueue = 0;
        Mustache.parse(searchResultsTemplate);
        //console.log("Nav search attached", this.element);
        MDCTextField.attachTo(this.wrapperTarget);
    }

    toggle() {
        this.popupTarget.classList.toggle("hide");
        if(this.hidden) {
            this.togglerTarget.textContent = "close";
            this.fieldTarget.focus();
        } else {
            this.togglerTarget.textContent = "search";
        }
        this.hidden = !this.hidden;
    }

    clear() {
        this.resultsTarget.innerHTML = "";
    }

    set(data) {
        this.resultsTarget.innerHTML = Mustache.render(searchResultsTemplate, data);
    }

    suggest() {
        const query = this.fieldTarget.value;
        if(query < 2) { // Too small of a query string
            this.clear();
            return;
        }
        if(this.suggestionAllowed) {
            this.suggestionAllowed = false;
            this.doSuggest(query).then(delayPromise(500)).then(() => {
                if(this.queryQueue) {
                    this.queryQueue = 0;
                    this.suggestionAllowed = true;
                    this.suggest();
                }
            }).then(() => this.suggestionAllowed = true);
        } else {
            this.queryQueue++;
        }
    }

    doSuggest(query) {
        
        return axios.get(constants.API_BASE + "/comics/", {
            params: {
                search: query
            }
        }).then(function (response) {
            if(response.data.count > 0) {
                const suggestions = response.data.results;
                let mdata = {"results": []};
                suggestions.forEach(function(comic) {
                    mdata["results"].push({
                        "link": constants.seriesLink(comic.slug),
                        "name": comic.name,
                        //"cover": comic.cover
                    });
                });
                this.set(mdata);
                console.log(this.suggestionAllowed);
            } else {
                this.clear();
            }
        }.bind(this)).catch(function (error) {
            console.error(error);
            this.suggestionAllowed = false; // Kill to prevent hammering with errors
        }.bind(this));
    }
}