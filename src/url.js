//include-once 'foundation.js'

class URL {
    static fileUrlWithPath(aPath) {
        return new URL($.NSURL.fileURLWithPath(aPath))
    }

    constructor(aNSURL) {
        this._nsurl = aNSURL
    }

    clone() {
        return new URL(this._nsurl)
    }

    get nsurl() {
        return this._nsurl
    }

    get path() {
        return ObjC.unwrap(this._nsurl.path)
    }

    get posixFile() {
        return Path(this.path)
    }

    get absoluteString() {
        return ObjC.unwrap(this._nsurl.absoluteString)
    }

    get lastPathComponent() {
        return ObjC.unwrap(this._nsurl.lastPathComponent)
    }

    get pathExtension() {
        return ObjC.unwrap(this._nsurl.pathExtension)
    }

    cookRelative(aPath) {
        let url = new URL()
        url._nsurl = $.NSURL.fileURLWithPathRelativeToURL(aPath, this._nsurl)
        return url
    }

    get lastPathComponentSansExtension() {
        let name = this.lastPathComponent
        let ext = this.pathExtension
        let ind = name.lastIndexOf(ext) - 1 // To account for the dot
        if (ind < 0) {
            return undefined
        }
        return name.substring(0, ind)
    }

    get exists() {
        return URL._fileManager.fileExistsAtPath(this._nsurl.path)
    }

    get creationDate() {
        let error = $()
        let attributes = URL._fileManager.attributesOfItemAtPathError(this._nsurl.path, error)
        if (attributes.isNil()) {
            tb.brag_and_exit(error.isNil()
                ? `Can't get attributes of file “${this.path}”`
                : ObjC.unwrap(error.localizedDescription)
                )
        }
        let nsdate = attributes.objectForKey($.NSFileCreationDate) // or $.NSFileModificationDate
        if (nsdate.isNil()) {
            tb.brag_and_exit(`Can't get creation date of file “${this.path}”`)
        }
        return new Date(1000 * nsdate.timeIntervalSince1970)
    }

    nameIncludesLower(aStr) {
        return this
            .lastPathComponentSansExtension
            .toLowerCase()
            .includes(aStr)
    }
}

// Apparently JXA on Catalina doesn't support static properties :-(
URL._fileManager = $.NSFileManager.defaultManager
