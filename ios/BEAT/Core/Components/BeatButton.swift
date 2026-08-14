import SwiftUI

struct BeatButton: View {
    let title: LocalizedStringKey
    var isLoading = false
    var secondary = false
    var onDark = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Group {
                if isLoading {
                    ProgressView()
                } else {
                    Text(title)
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.plain)
        .foregroundStyle(foregroundColor)
        .background(backgroundColor)
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(borderColor)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .disabled(isLoading)
    }

    private var foregroundColor: Color {
        if onDark { return secondary ? .white : BeatTheme.brandDark }
        return secondary ? BeatTheme.ink : BeatTheme.primaryActionText
    }

    private var backgroundColor: Color {
        if onDark { return secondary ? .clear : BeatTheme.paper }
        return secondary ? BeatTheme.surface : BeatTheme.primaryAction
    }

    private var borderColor: Color {
        if onDark && secondary { return .white.opacity(0.22) }
        return secondary ? BeatTheme.border : .clear
    }
}
