//include-once foundation.js
//include-once url.js

class ProcessInfo {
    get argv() {
        const argv = ObjC.unwrap(
            $.NSProcessInfo.processInfo.arguments
        ).map(
            arg => ObjC.unwrap(arg)
        ).slice(3)
        Object.defineProperty(this, "argv", {
            get: () => argv
        });
        return argv
    }

    get self() {
        const self = URL.fileUrlWithPath(this.argv[0]).lastPathComponent
        Object.defineProperty(this, "self", {
            get: () => self
        });
        return self
    }
}
