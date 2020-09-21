@echo off

rem  <<  Config

set source=%~dp0\src\sheet.sass
set target=%~dp0\sheet.css

rem  <<  Exec

rem sass --no-source-map --indented --no-charset --style=compressed %source% %target%
sass --no-source-map --indented --no-charset --style=expanded %source% %target%
