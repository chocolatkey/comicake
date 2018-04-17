@echo off
java -classpath rhino.jar;closure.jar org.mozilla.javascript.tools.shell.Main -opt -1 r.js -o baseUrl=../assets/js name=main optimize=closure out=../static/js/build.js
REM closure.CompilationLevel=ADVANCED_OPTIMIZATIONS
pause