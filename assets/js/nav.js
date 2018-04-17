define(["vendor/stimulus.umd", "vendor/turbolinks", "constants", "vendor/axios", "vendor/mustache", "vendor/text!mst/search.html"],
    function (Stimulus, turbolinks, constants, axios, Mustache, searchResultsTemplate) {
        class Search extends Stimulus.Controller {
            static get targets() {
                return ["popup", "toggler", "field", "results"];
            }

            connect() {
                this.hidden = true;
                this.suggestionAllowed = true;
                Mustache.parse(searchResultsTemplate);
            //console.log("Nav search attached", this.element);
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
                //console.log(query);
                    axios.get(constants.API_BASE + "/comics/", {
                        params: {
                            search: query
                        }
                    }).then(function (response) {
                        if(response.data.count > 0) {
                            const suggestions = response.data.results;
                            var mdata = {"results": []};
                            suggestions.forEach(function(comic) {
                                mdata["results"].push({
                                    "link": constants.seriesLink(comic.slug),
                                    "name": comic.name
                                });
                            });
                            this.set(mdata);
                            //console.log(this.resultsTarget);
                            setTimeout(function(){ // Crude rate-limiting
                                this.suggestionAllowed = true;
                            }, 500); // 500ms between requests
                            this.suggestionAllowed = false;
                        } else {
                            this.clear();
                        }
                    }.bind(this)).catch(function (error) {
                        console.error(error);
                        this.suggestionAllowed = false; // Kill to prevent hammering with errors
                    }.bind(this));
                }
            }
        }
        class Clickable extends Stimulus.Controller {
            static get targets() {
                return ["target"];
            }

            click(event) {
                const target = event.srcElement.querySelectorAll("[data-target='clickable.target']");
                if(target.length == 1) {
                    if(target[0].href.indexOf("/read/") == -1) // Dirty, need to fix
                        turbolinks.visit(target[0].href);
                    else
                        window.location = target[0].href;
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