/* global require module */
var path = require("path"),
    webpack = require("webpack"),
    ini = require("ini"),
    fs = require("fs"),
    BundleTracker = require("webpack-bundle-tracker"),
    pp = "/static/bundles/";
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

var config = ini.parse(fs.readFileSync("../../frontend_settings.ini", "utf-8"));

let getBuildNumber = function() {
    var now = "", date = new Date();
    [
        date.getYear() + 1900,
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()/*,
        date.getSeconds()*/
    ].forEach(function(d) {
        now += (d < 10 ? "0" : "") + d;
    });
    return now;
};

// 4 hotreload: node server.js
module.exports = {
    //context: __dirname,
    //mode: "development",
    entry: {
        comicake: [
            "./assets/js/index",
            "./assets/css/main.scss"
        ]
    },
    resolve: {
        modules: [
            "./assets/js",
            "./assets/css",
            "node_modules"
        ]
    },
    output: {
        path: path.resolve("./assets/bundles/"),
        filename: "[name]-[hash].js",
        publicPath: pp
    },
    /*optimization: {
        runtimeChunk: {
            name: 'vendor'
        },
    },*/
    module: {
        rules: [{
            test: /\.(s*)css$/,
            use: [
                /*{
                    loader: "file-loader",
                    options: {
                        name: "[name]-[hash].css",
                    },
                },*/
                MiniCssExtractPlugin.loader,
                //{ loader: "extract-loader" },
                { loader: "css-loader", options:
                    {
                        sourceMap: true
                    }
                },
                {
                    loader: "sass-loader",
                    options: {
                        sourceMap: true,
                        includePaths: [
                            "./assets/css",
                            "./node_modules"
                        ]
                    }
                },
            ]
        },
        {
            test: /\.js$/,
            loader: "babel-loader",
            query: {
                presets: [
                    ["@babel/preset-env", {
                        targets: {
                            chrome: 44,
                            ie: 11
                        }
                    }]
                ]
            }
        },
        {
            test: /\.(html)$/,
            use: {
                loader: "html-loader",
                options: {
                    attrs: [":data-src"],
                    ignoreCustomFragments: [/\{\{.*?}}/]
                }
            }
        }],
    },
    plugins: [
        new BundleTracker({filename: "../../webpack-stats.json"}),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name]-[hash].css",
            chunkFilename: "[id].css"
        }),
        new WorkboxPlugin.GenerateSW({
            swDest: "./templates/sw.js",
            importWorkboxFrom: "local",
            importsDirectory: "sw",
            clientsClaim: true,
            skipWaiting: true,
            // Exclude images from the precache
            exclude: [/\.(?:png|jpg|jpeg|webp|gif|tiff)$/],
            // Define runtime caching rules.
            runtimeCaching: [{
                // Match any request ends with .png, .jpg, .jpeg or .svg. \.(?:png|jpg|jpeg|webp|gif|tiff)$
                urlPattern: /\/static\/.*\.(?:png|jpg|jpeg|webp|gif|tiff)$/g, //
                // Apply a cache-first strategy.
                handler: "cacheFirst",
                options: {
                    cacheName: "img-cache",
                    // Cache 50 imgs
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 3600,
                    }
                },
            }],
        })
    ]
};