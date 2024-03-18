//include-once coregraphics.js

class CocoaApps {
    constructor() {
        const kCGWindowOwnerName = ObjC.unwrap(ObjC.castRefToObject($.kCGWindowOwnerName));
        const kCGWindowOwnerPID = ObjC.unwrap(ObjC.castRefToObject($.kCGWindowOwnerPID));
        let dict = {};
        for (const winInfo of ObjC.deepUnwrap(ObjC.castRefToObject(
            $.CGWindowListCopyWindowInfo(
                $.kCGWindowListOptionAll,
                $.kCGNullWindowID
            )
        ))) {
            const name = winInfo[kCGWindowOwnerName]
            const pid = winInfo[kCGWindowOwnerPID]
            if (!dict[name]) {
                dict[name] = new Set()
            }
            dict[name].add(pid)
        }
        this._apps = {} // { <app name>: [<pid>] }
        for (const name in dict) {
            this._apps[name] = Array.from(dict[name]).sort()
        }
    }

    // TODO: Go through PID and process info to ensure those are not just namesakes.
    filterAppURLs(aAppURLs) {
        const running = aAppURLs.filter(
            aUrl => aUrl.lastPathComponentSansExtension in this._apps
        )
        if (running.length < 1) {
            throw new NoneRunningError()
        }
        return running
    }
}

class CocoaAppsError extends Error {}

class NoneRunningError extends CocoaAppsError {
    constructor() {
        super(`None of the apps are running`)
    }
}
