import { Controller } from "stimulus";
import "core-js/fn/promise";
import "whatwg-fetch";
import qs from "qs";

export default class Reader extends Controller {
    connect() {
        if(!window.xbconfig) {
            console.error("No pre-seeded config for reader found!");
            return;
        }
        const __STORAGE_PREFIX__ = `xbr/${ this.data.get("comicUuid") }/`;
        window.xbconfig.mount = document.getElementById("XBContainer");

        // Add callback functions for XBReader
        window.xbconfig.onPublicationLoad = (reader) => {
            const savedSpread = window.localStorage.getItem(__STORAGE_PREFIX__ + "spread");
            if(savedSpread !== null)
                reader.spread = savedSpread === "true" ? true : false;
        };
        window.xbconfig.onReady = (reader) => {
            const savedDirection = window.localStorage.getItem(__STORAGE_PREFIX__ + "direction");
            if(savedDirection && typeof(savedDirection) != "undefined")
                reader.switchDirection(savedDirection);
        };
        let completionTimeout = null;
        window.xbconfig.onPageChange = (num, direction, isSpread) => {
            clearTimeout(completionTimeout);
            completionTimeout = setTimeout(() => {
                window.localStorage.setItem(__STORAGE_PREFIX__ + "direction", direction);
                window.localStorage.setItem(__STORAGE_PREFIX__ + "spread", isSpread);
            }, 2000); // Wait two seconds before next read completion update
        };
        window.xbconfig.onLastPage = (series) => {
            if(!series.next) {
                window.location = series.metadata[0].Identifier;
                return false;
            }
            return true;
        };
        window.xbconfig.loader = (cid) => {
            return fetch(`${window.xbconfig.prefix}/${cid}/manifest.json`).then(response => {
                if (!response.ok) {
                    var error = new Error(response.statusText);
                    error.message = response;
                    throw error;
                }
                return response.json();
            }).then(webpub => {
                const params = {
                    comic: this.data.get("comicId"),
                    language: this.data.get("chapterLanguage"),
                    ordering: "volume,chapter,subchapter",
                    n: 1000
                };
                return fetch(window.comicake.PATHS.api + "chapters.json?" + qs.stringify(params)).then(response => {
                    if (!response.ok) {
                        var error = new Error(response.statusText);
                        error.message = response;
                        throw error;
                    }
                    return response.json();
                }).then(data => {
                    if(data.next)
                        console.warn("Too many chapters to list!");
            
                    const chapters = data.results;
                    let volumeData = [];
                    let nVolume = 0;
                    let currentVolume = {
                        no: false,
                        chapters: []
                    };
                    chapters.forEach(chapter => {
                        if(chapter.volume != nVolume) {
                            currentVolume.no = nVolume == 0 ? false : nVolume;
                            currentVolume.title = nVolume > 0 ? ("Volume " + nVolume) : null;
                            volumeData.push(currentVolume);
                            nVolume = chapter.volume;
                            currentVolume = {
                                "chapters": []
                            };
                        }
                        currentVolume["chapters"].push({
                            no: parseFloat(`${chapter.chapter}.${chapter.subchapter}`),
                            selected: chapter.uniqid == cid ? true : false,
                            title: chapter.title,
                            uuid: chapter.uniqid
                        });
                    });
                    currentVolume["no"] = nVolume == 0 ? false : nVolume;
                    currentVolume.title = nVolume > 0 ? ("Volume " + nVolume) : null;
                    volumeData.push(currentVolume);
                    webpub.metadata.xbr = {
                        volumes: volumeData
                    };
                    return Promise.resolve(webpub);
                });
            }).catch(error => {
                console.error(error);
                document.body.innerHTML = `<span class="br__notifier">Error: ${error.message}</span>`;
            });
        };

        // Run XBReader
        window.xbreader(window.xbconfig);
    }
}