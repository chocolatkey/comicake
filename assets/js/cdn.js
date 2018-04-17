define(["constants", "parseuri"], function (constants, p) {
    return {
        image: function(absolutePath) {
            //console.log(p.parse(absolutePath));
            if(constants.useCDN)
                console.log("Use CDN");
            return absolutePath;
        }
    };
});