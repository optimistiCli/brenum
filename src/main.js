#!/usr/bin/env jxapp

//include-once stdlib.js

//include-once print_and_log.js
//include-once process_info.js
//include-once workspace.js
//include-once options.js
//include-once cocoa_apps.js

function usage(aSelf) {
log(`Usage:
  ${aSelf} [-h] [-a] [-r] [-p | -u] [-M] <search string>

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
  M - Do NOT check for multiple browsers
`)
}

function confessAndDie(aMsg, aSelf) {
    log(`Error: ${aMsg}\n`)
    usage(aSelf)
    $.exit(1)
}

class Context {
    constructor(aWorkspace, aOptions) {
        this.workspace = aWorkspace
        this.options = aOptions
    }
}

function getOne(aContext) {
    const find_worker = aContext.options.first_browser_goes
        ? 'findFirst'
        : 'findOne'
    return [
        aContext.options.namePart
            ? aContext.workspace.browsers[find_worker](aContext.options.namePart)
            : aContext.workspace.browsers.default
    ]
}

function getAll(aContext) {
    return aContext.options.namePart
        ? aContext.workspace.browsers.findAll(aContext.options.namePart)
        : aContext.workspace.browsers.all
}

function getFilter(aContext) {
    return aContext.options.running
        ? new CocoaApps()
        : {filterAppURLs: (x=>x)}
}

function run() {
    const processInfo = new ProcessInfo()
    const context = new Context(
        new Workspace(),
        new Options(processInfo.argv)
    )
    if (context.options.help) {
        usage(processInfo.self)
        $.exit(0)
    }
    const filterObj = getFilter(context)
    const searchFunc = context.options.all
        ? getAll
        : getOne
    const browserURLs = (() => {
        try {
            return filterObj.filterAppURLs(searchFunc(context))
        } catch (error) {
            if (
                error instanceof BrowsersError
                || error instanceof CocoaAppsError
            ) {
                confessAndDie(
                    error.message, 
                    processInfo.self,
                )
            } else {
                throw error
            }
        }
    })()
    print(browserURLs.map(aUrl => context.options.output(aUrl)).join('\n'))
    // const browserApp = Application(browserUrl.path)
    // browserApp.activate()
    $.exit(0)
}
