# Enumerate registered browsers on macOS
Any app registered to handle HTTPS URIs is considered a browser.

## Installation
Just put it sowhere on the `$PATH`
```bash
sudo cp -iv brenum.js /usr/local/bin/
```
## Usecases
### Get Default Browser
```bash
$ brenum.js
Firefox
```
### Get Safari Bundle Path
```bash
$ brenum.js -p saf
Printing path(s)
/System/Volumes/Preboot/Cryptexes/App/System/Applications/Safari.app
```
### List All Installed Browsers
```bash
$ brenum.js -a
Getting all browsers
Firefox
Safari
Chromium
Vivaldi
Opera
iTerm
Google Chrome
Brave Browser
```
### List All Running Browsers
```bash
$ brenum.js -ar
Getting all browsers
Getting only running browsers
Vivaldi
Brave Browser
```
### Check If Firefox Is Running
```bash
if brenum.js -r fire >/dev/null 2>/dev/null; then
    echo 'Firefox is running'
else
    echo 'Firefox is dormant'
fi
```
### Check If SeaMonkey Is Installed
```bash
if brenum.js seamonk >/dev/null 2>/dev/null; then
    echo 'SeaMonkey detected'
else
    echo 'You system is SeaMonkey-free'
fi
```
### Run Chrome
```bash
open -a "$(brenum.js 'e c')"
```
### Figure Out What Else It Is Good For
```
$ brenum.js -h
Usage:
  brenum.js [-h] [-a] [-r] [-p | -u] <search string>

  Enumerates browsers. Returns default browser if no options are specified.
  If a search string is provided shows the browser with name containing given
  string case insensitively. Unless the ‘-a’ option is specified fails if more
  than one browser fits the criteria. Also fails if no matching browsers are
  found.

Options:
  h - Print usage and exit
  a - Show all browsers that fit the bill
  r - Show only currently running browser(s)
  p - Show browsers' path(s)
  u - Show browsers' path(s) as URL(s)
```
## Getting Handy With The Source
### Get jxapp
Please make sure to install [JXA Pre-Processor](https://github.com/optimistiCli/jxapp). No need for node.js or any such thing.
### Run From Source
```bash
$ ./src/main.js 
Firefox
```
### “Compile” brenum.js
```bash
jxapp -cs src/main.js > brenum.js
```
