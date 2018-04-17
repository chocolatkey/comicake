@echo off
node r.js -o baseUrl=../assets/js name=main out=../static/js/build.js optimize=uglify2 uglify2.mangle=true
pause