//include-once stdlib.js
//include-once print_and_log.js

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