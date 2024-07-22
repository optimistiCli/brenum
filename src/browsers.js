class Browsers {
    constructor (aUrls=[]) {
        this._urls = aUrls
    }

    get names() {
        return this._urls.map(url => url.lastPathComponentSansExtension)
    }

    get default() {
        return this._urls[0]
    }

    get all() {
        return this._urls.map(aUrl => aUrl.clone())
    }

    findAll(aPart) {
        const part = aPart.toLowerCase()
        const foundURLs = this._urls.filter(
            aUrl => aUrl.nameIncludesLower(part)
        )
        if (foundURLs.length < 1) {
            throw new NoneFoundError(aPart)
        }
        return foundURLs
    }

    findOne(aPart) {
        const part = aPart.toLowerCase()
        const foundUrl = this._urls.reduce(
            (aFound, aUrl) => {
                if (aUrl.nameIncludesLower(part)) {
                    if (aFound) {
                        throw new TooManyFoundError(aPart)
                    }
                    return aUrl
                } else {
                    return aFound
                }
            },
            undefined,
        )
        if (!foundUrl) {
            throw new NoneFoundError(aPart)
        }
        return foundUrl
    }

    findFirst(aPart) {
        const part = aPart.toLowerCase()
        const foundUrl = this._urls.find(
            (aUrl) => {
                return aUrl.nameIncludesLower(part)
            }
        )
        if (!foundUrl) {
            throw new NoneFoundError(aPart)
        }
        return foundUrl
    }
}


class BrowsersError extends Error {}

class TooManyFoundError extends BrowsersError {
    constructor(aPart) {
        super(`More than one browser includes “${aPart}”`)
    }
}

class NoneFoundError extends BrowsersError {
    constructor(aPart) {
        super(`No browser includes “${aPart}”`)
    }
}