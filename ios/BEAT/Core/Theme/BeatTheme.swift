import SwiftUI
import UIKit

enum BeatTheme {
    static let paper = Color.adaptive(light: 0xFDFCF9, dark: 0x11100F)
    static let surface = Color.adaptive(light: 0xF9F6F0, dark: 0x1B1917)
    static let card = Color.adaptive(light: 0xFFFFFF, dark: 0x24211E)
    static let ink = Color.adaptive(light: 0x141414, dark: 0xF5F0E8)
    static let muted = Color.adaptive(light: 0x333333, dark: 0xC5BDB3)
    static let border = Color.adaptive(light: 0xE8E0D0, dark: 0x403A34)
    static let accent = Color.adaptive(light: 0xB07D6C, dark: 0xD6A18E)
    static let accentLight = Color.adaptive(light: 0xDFC4B8, dark: 0x9A6C5E)
    static let gold = Color.adaptive(light: 0xC9B48A, dark: 0xD8C293)

    static let brandDark = Color(hex: 0x141414)
    static let primaryAction = Color.adaptive(light: 0x141414, dark: 0xF5F0E8)
    static let primaryActionText = Color.adaptive(light: 0xFFFFFF, dark: 0x141414)
    static let moodPanel = Color.adaptive(light: 0xEEE5D8, dark: 0x211E1B)
    static let moodCanvas = Color.adaptive(light: 0xF7F0E6, dark: 0x302B27)
    static let moodButton = Color.adaptive(light: 0xF8F2E9, dark: 0x2A2622)
    static let moodBorder = Color.adaptive(light: 0xDFD4C6, dark: 0x4B433C)
}

enum BeatFont {
    static func regular(_ size: CGFloat) -> Font {
        .custom("Inter-Regular", size: size)
    }

    static func light(_ size: CGFloat) -> Font {
        .custom("Inter-Regular_Light", size: size)
    }

    static func medium(_ size: CGFloat) -> Font {
        .custom("Inter-Regular_Medium", size: size)
    }

    static func semibold(_ size: CGFloat) -> Font {
        .custom("Inter-Regular_SemiBold", size: size)
    }

    static func italic(_ size: CGFloat) -> Font {
        .custom("Inter-Italic_Light-Italic", size: size)
    }

    static let body = regular(16)
}

extension Color {
    static func adaptive(light: UInt, dark: UInt) -> Color {
        Color(
            UIColor { traits in
                UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
            }
        )
    }

    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

private extension UIColor {
    convenience init(hex: UInt) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
