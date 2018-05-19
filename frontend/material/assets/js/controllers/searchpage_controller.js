import { Controller } from "stimulus";
import Mustache from "mustache";
import "whatwg-fetch";
import qs from "qs";
import delayPromise from "delay-promise";

import searchResultsTemplate from "../mst/search.html";
import * as constants from "../constants";
import { MDCTextField } from "@material/textfield";

export default class SearchPage extends Controller {
    static get targets() {
        return ["field", "results"];
    }

    connect() {
        console.log("Search page connected");
        this.hidden = true;
        this.suggestionAllowed = true;
        //this.queryQueue = [];
        this.queryQueue = 0;
        Mustache.parse(searchResultsTemplate);
        //console.log("Nav search attached", this.element);
        MDCTextField.attachTo(this.wrapperTarget);
    }
}