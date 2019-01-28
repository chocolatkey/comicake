import { USECDN } from "./constants";
import { parse } from "./vendor/parseuri";
export default {
    seededRandom: function(seed, max, min) {
        max = max || 1;
        min = min || 0;
        seed = (seed * 9301 + 49297) % 233280;
        var rnd = seed / 233280;
        return min + rnd * (max - min);
    },
    hash: function(host, index, min, max) {
        let hash = index;
        for (var i = 0; i < host.length; i++) {
            hash = ((hash << 5) - hash) + host.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.floor(this.seededRandom(hash, min, max));
    },
    // For now just Photon
    image: function(item, index) {
        if(!USECDN || item.endsWith(".svg")) return item;
        if(!item) return null;
        const ele = parse(item);
        return "https://i" + this.hash(ele.host, index, 0, 2) + ".wp.com/" + ele.authority + ele.path + "?quality=100";
    }
};