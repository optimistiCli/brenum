//include-once foundation.js
//include-once appkit.js

//include-once url.js
//include-once browsers.js

//include-once print_and_log.js

class Workspace {
    constructor() {
        this._shared = $.NSWorkspace.sharedWorkspace
        this._https = $.NSURL.URLWithString('https:')
    }

    get browsers() {
        const browsers = new Browsers(
            ObjC.unwrap(
                this._shared.URLsForApplicationsToOpenURL(
                    this._https
                )
            ).map(
                nsurl => new URL(nsurl)
            )
        )
        Object.defineProperty(this, "browsers", {
            get: () => browsers
        });
        return browsers
    }
}
