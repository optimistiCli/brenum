#!/usr/bin/env osascript -l JavaScript
ObjC.import('stdlib')

function print(s) {
    $.NSFileHandle.fileHandleWithStandardOutput.writeData(
            $.NSString.alloc.initWithString(String(s) + "\n").dataUsingEncoding($.NSUTF8StringEncoding)
            )
}

function log(s) {
    $.NSFileHandle.fileHandleWithStandardError.writeData(
            $.NSString.alloc.initWithString(String(s) + "\n").dataUsingEncoding($.NSUTF8StringEncoding)
            )
}
ObjC.import('Foundation')

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
ObjC.import('AppKit');

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
/*
 * getopt.js for jxapp is derived from
 * https://github.com/TritonDataCenter/node-getopt
 */

/*
 * getopt.js: node.js implementation of POSIX getopt() (and then some)
 *
 * Copyright 2011 David Pacheco. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var assert = {
    'ok': (
        aExpr,
        aMsg='Something went terribly wrong',
    ) => {
        if (aExpr !== 0 || aExpr) {
            return
        }
        log(`Error: ${aMsg}`)
        $.exit(1)
    }
}
var ASSERT = assert.ok;

class GetOptError extends Error {
    constructor(aMsg) {
        super(`getopt: ${aMsg}`)
    }
}

/*
 * The BasicParser is our primary interface to the outside world.  The
 * documentation for this object and its public methods is contained in
 * the included README.md.
 */
class BasicParser {
	constructor(aOptstring, aArgv, aOptind=1) {
		ASSERT(aOptstring || aOptstring === '', 'aOptstring is required');
		ASSERT(aOptstring.constructor === String, 'aOptstring must be a string');
		ASSERT(aArgv, 'aArgv is required');
		ASSERT(aArgv.constructor === Array, 'aArgv must be an array');

		this.gop_argv = new Array(aArgv.length);
		this.gop_options = {};
		this.gop_aliases = {};
		this.gop_optind = aOptind; // Assuming argv[0] is the the script itself
		this.gop_subind = 0;

		for (let i = 0; i < aArgv.length; i++) {
			ASSERT(aArgv[i].constructor === String,
				'aArgv must be string array');
			this.gop_argv[i] = aArgv[i];
		}

		this.parseOptstr(aOptstring);
	}

	/*
	* Parse the option string and update the following fields:
	*
	*	gop_silent	Whether to log errors to stderr.  Silent mode is
	*			indicated by a leading ':' in the option string.
	*
	*	gop_options	Maps valid single-letter-options to booleans indicating
	*			whether each option is required.
	*
	*	gop_aliases	Maps valid long options to the corresponding
	*			single-letter short option.
	*/
	parseOptstr(aOptstr) {
		let i = 0;
		if (aOptstr.length > 0 && aOptstr[0] == ':') {
			this.gop_silent = true;
			i++;
		} else {
			this.gop_silent = false;
		}

		while (i < aOptstr.length) {
			const chr = aOptstr[i];
			let arg = false;

			if (!/^[\w\d\u1000-\u1100]$/.test(chr))
				throw (GetOptError('invalid optstring: only alphanumeric ' +
					'characters and unicode characters between ' +
					'\\u1000-\\u1100 may be used as options: ' + chr));

			if (i + 1 < aOptstr.length && aOptstr[i + 1] == ':') {
				arg = true;
				i++;
			}

			this.gop_options[chr] = arg;

			while (i + 1 < aOptstr.length && aOptstr[i + 1] == '(') {
				i++;
				const cp = aOptstr.indexOf(')', i + 1);
				if (cp == -1)
					throw (GetOptError('invalid optstring: missing ' +
						'")" to match "(" at char ' + i));

				const alias = aOptstr.substring(i + 1, cp);
				this.gop_aliases[alias] = chr;
				i = cp;
			}

			i++;
		}
	};

	get optind() {
		return (this.gop_optind);
	};

	/*
	* For documentation on what getopt() does, see README.md.  The following
	* implementation invariants are maintained by getopt() and its helper methods:
	*
	*	this.gop_optind		Refers to the element of gop_argv that contains
	*				the next argument to be processed.  This may
	*				exceed gop_argv, in which case the end of input
	*				has been reached.
	*
	*	this.gop_subind		Refers to the character inside
	*				this.gop_options[this.gop_optind] which begins
	*				the next option to be processed.  This may never
	*				exceed the length of gop_argv[gop_optind], so
	*				when incrementing this value we must always
	*				check if we should instead increment optind and
	*				reset subind to 0.
	*
	* That is, when any of these functions is entered, the above indices' values
	* are as described above.  getopt() itself and getoptArgument() may both be
	* called at the end of the input, so they check whether optind exceeds
	* argv.length.  getoptShort() and getoptLong() are called only when the indices
	* already point to a valid short or long option, respectively.
	*
	* getopt() processes the next option as follows:
	*
	*	o If gop_optind > gop_argv.length, then we already parsed all arguments.
	*
	*	o If gop_subind == 0, then we're looking at the start of an argument:
	*
	*	    o Check for special cases like '-', '--', and non-option arguments.
	*	      If present, update the indices and return the appropriate value.
	*
	*	    o Check for a long-form option (beginning with '--').  If present,
	*	      delegate to getoptLong() and return the result.
	*
	*	    o Otherwise, advance subind past the argument's leading '-' and
	*	      continue as though gop_subind != 0 (since that's now the case).
	*
	*	o Delegate to getoptShort() and return the result.
	*/
	getopt() {
		if (this.gop_optind >= this.gop_argv.length)
			/* end of input */
			return (undefined);

		const arg = this.gop_argv[this.gop_optind];

		if (this.gop_subind === 0) {
			if (arg == '-' || arg === '' || arg[0] != '-')
				return (undefined);

			if (arg == '--') {
				this.gop_optind++;
				this.gop_subind = 0;
				return (undefined);
			}

			if (arg[1] == '-')
				return (this.getoptLong());

			this.gop_subind++;
			ASSERT(this.gop_subind < arg.length);
		}

		return (this.getoptShort());
	};

	/*
	* Implements getopt() for the case where optind/subind point to a short option.
	*/
	getoptShort() {
		ASSERT(this.gop_optind < this.gop_argv.length);
		const arg = this.gop_argv[this.gop_optind];
		ASSERT(this.gop_subind < arg.length);
		const chr = arg[this.gop_subind];

		if (++this.gop_subind >= arg.length) {
			this.gop_optind++;
			this.gop_subind = 0;
		}

		if (!(chr in this.gop_options))
			return (this.errInvalidOption(chr));

		if (!this.gop_options[chr])
			return ({ option: chr });

		return (this.getoptArgument(chr));
	};

	/*
	* Implements getopt() for the case where optind/subind point to a long option.
	*/
	getoptLong() {
		ASSERT(this.gop_subind === 0);
		ASSERT(this.gop_optind < this.gop_argv.length);
		const arg = this.gop_argv[this.gop_optind];
		ASSERT(arg.length > 2 && arg[0] == '-' && arg[1] == '-');

		const eq = arg.indexOf('=');
		const alias = arg.substring(2, eq == -1 ? arg.length : eq);
		if (!(alias in this.gop_aliases))
			return (this.errInvalidOption(alias));

		const chr = this.gop_aliases[alias];
		ASSERT(chr in this.gop_options);

		if (!this.gop_options[chr]) {
			if (eq != -1)
				return (this.errExtraArg(alias));

			this.gop_optind++; /* eat this argument */
			return ({ option: chr });
		}

		/*
		* Advance optind/subind for the argument value and retrieve it.
		*/
		if (eq == -1)
			this.gop_optind++;
		else
			this.gop_subind = eq + 1;

		return (this.getoptArgument(chr));
	};

	/*
	* For the given option letter 'chr' that takes an argument, assumes that
	* optind/subind point to the argument (or denote the end of input) and return
	* the appropriate getopt() return value for this option and argument (or return
	* the appropriate error).
	*/
	getoptArgument(aChr) {
		if (this.gop_optind >= this.gop_argv.length)
			return (this.errMissingArg(aChr));

		const arg = this.gop_argv[this.gop_optind].substring(this.gop_subind);
		this.gop_optind++;
		this.gop_subind = 0;
		return ({ option: aChr, optarg: arg });
	};

	errMissingArg(aChr) {
		if (this.gop_silent)
			return ({ option: ':', optopt: aChr });

		process.stderr.write('option requires an argument -- ' + aChr + '\n');
		return ({ option: '?', optopt: aChr, error: true });
	};

	errInvalidOption(aChr) {
		if (!this.gop_silent)
			process.stderr.write('illegal option -- ' + aChr + '\n');

		return ({ option: '?', optopt: aChr, error: true });
	};

	/*
	* This error is not specified by POSIX, but neither is the notion of specifying
	* long option arguments using "=" in the same argv-argument, but it's common
	* practice and pretty convenient.
	*/
	errExtraArg(aChr) {
		if (!this.gop_silent)
			process.stderr.write('option expects no argument -- ' +
				aChr + '\n');

		return ({ option: '?', optopt: aChr, error: true });
	};
}

const Output = Object.freeze({
    NAME:   (aUrl => aUrl.lastPathComponentSansExtension),
    URL:    (aUrl => aUrl.absoluteString),
    PATH:   (aUrl => aUrl.posixFile),
});

class Options {
    constructor(aArgv) {
        this.all = false;
        this.running = false;
        this.output = Output.NAME;
        const optParser = new BasicParser(
            ':harup',
            aArgv
        );
        while (true) {
            const o = optParser.getopt();
            if (o === undefined) {
                break;
            }
            switch (o.option) {
                case 'h':
                    this.help = true;
                    break;
                case 'a':
                    log('Getting all browsers');
                    this.all = true;
                    break;
                case 'r':
                    log('Getting only running browsers');
                    this.running = true;
                    break;
                case 'u':
                    log('Printing URL(s)');
                    this.output = Output.URL;
                    break;
                case 'p':
                    log('Printing path(s)');
                    this.output = Output.PATH;
                    break;
            }
        }
        this.namePart = aArgv[optParser.optind];
    }
}
ObjC.import('CoreGraphics')

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

function usage(aSelf) {
log(`Usage:
  ${aSelf} [-h] [-a] [-r] [-p | -u] <search string>

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
    return [
        aContext.options.namePart
            ? aContext.workspace.browsers.findOne(aContext.options.namePart)
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
