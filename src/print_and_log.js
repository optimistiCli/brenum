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
