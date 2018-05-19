import { Controller } from "stimulus";
import Mustache from "mustache";
import "whatwg-fetch";
import qs from "qs";
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
        if(query.length < 2) { // Too small of a query string
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
        return fetch(constants.API_BASE + "/comics.json?" + qs.stringify({
            search: query
        })).then(response => {
            if (!response.ok) {
                var error = new Error(response.statusText);
                error.message = response;
                throw error;
            }
            return response.json();
        }).then(data => {
            if(data.count > 0) {
                const suggestions = data.results;
                let mdata = {"results": []};
                suggestions.forEach(comic => {
                    mdata["results"].push({
                        "link": constants.seriesLink(comic.slug),
                        "name": comic.name,
                        //"cover": comic.cover
                    });
                });
                this.set(mdata);
            } else {
                this.clear();
            }
        }).catch(error => {
            console.error(error);
            this.suggestionAllowed = false; // Kill to prevent hammering with errors
        });
    }
}