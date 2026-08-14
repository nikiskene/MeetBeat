import AppKit

let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)

image.lockFocus()
NSColor(calibratedWhite: 0.075, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center

let wordAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont(name: "Bodoni 72", size: 205) ?? NSFont.systemFont(ofSize: 205, weight: .light),
    .foregroundColor: NSColor.white,
    .paragraphStyle: paragraph,
    .kern: 32
]

let subtitleAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 35, weight: .medium),
    .foregroundColor: NSColor(calibratedRed: 0.79, green: 0.71, blue: 0.54, alpha: 1),
    .paragraphStyle: paragraph,
    .kern: 9
]

NSString(string: "BEAT").draw(
    in: NSRect(x: 40, y: 385, width: 944, height: 245),
    withAttributes: wordAttributes
)
NSString(string: "CONVERSATION FIRST").draw(
    in: NSRect(x: 40, y: 330, width: 944, height: 60),
    withAttributes: subtitleAttributes
)
image.unlockFocus()

guard
    let data = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: data),
    let png = bitmap.representation(using: .png, properties: [:])
else {
    fatalError("Unable to render the app icon.")
}

let output = URL(fileURLWithPath: CommandLine.arguments[1])
try png.write(to: output)
