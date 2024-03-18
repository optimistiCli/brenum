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

//include-once assert_ok.js
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