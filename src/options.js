//include-once getopt.js

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
