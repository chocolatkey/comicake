var path = require("path");
var webpack = require("webpack");
var BundleTracker = require("webpack-bundle-tracker");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
var pp = "/static/bundles/";

// 4 hotreload: node server.js
module.exports = {
    //context: __dirname,
    //mode: "development",
    entry: {
        comicake: [
            "./assets/js/index",
            "./assets/css/main.scss"
        ],
        reader: [
            "./assets/js/reader/index"
        ],/*
        styles: [
            "./assets/css/main.scss"
        ]*/
        //styles: "./assets/css/main.scss"
    },
    resolve: {
        modules: [
            "./assets/js",
            "./assets/css",
            "node_modules",
            "bower_components"
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
                }/*,{
                    loader: "postcss-loader",
                }*/,
                {
                    loader: "sass-loader",
                    options: {
                        sourceMap: true,
                        includePaths: ["./assets/css","./node_modules"],
                        importer: function(url, prev) {
                            if(url.indexOf("@material") === 0) {
                                var filePath = url.split("@material")[1];
                                var nodeModulePath = `./node_modules/@material/${filePath}`;
                                return { file: require("path").resolve(nodeModulePath) };
                            }
                            return { file: url };
                        }
                    }
                },
            ]
        },
        {
            test: /\.js$/,
            loader: "babel-loader",
            query: {
                presets: ["@babel/preset-env"]
            }
        },
        {
            test: /\.(html)$/,
            use: {
                loader: "html-loader",
                options: {
                    attrs: [":data-src"]
                }
            }
        }],
    },
    plugins: [
        new BundleTracker({filename: "./webpack-stats.json"}),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name]-[hash].css",
            chunkFilename: "[id].css"
        }),
        new UglifyJsPlugin({
            parallel: true
        })
    ]
};