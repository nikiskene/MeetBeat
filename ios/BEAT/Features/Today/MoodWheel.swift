import SwiftUI

struct MoodWheel: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let options: [BeatOption]
    @Binding var selectedIndex: Int
    @Binding var isMoving: Bool
    let isSaving: Bool
    let onConfirm: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                arrow("chevron.up", -1)
                ZStack {
                    RoundedRectangle(cornerRadius: 21).fill(BeatTheme.moodCanvas)
                    Text(selected.label).font(BeatFont.light(29))
                        .multilineTextAlignment(.center).padding(22)
                        .opacity(isMoving ? 0.55 : 1)
                }
                .frame(height: 154)
                .gesture(DragGesture(minimumDistance: 15).onEnded {
                    move($0.translation.height > 0 ? -1 : 1)
                })
                .accessibilityLabel("BEAT wheel")
                .accessibilityValue(selected.accessibilityLabel)
                .accessibilityAdjustableAction { move($0 == .increment ? 1 : -1) }
                arrow("chevron.down", 1)
            }
            .padding(15).background(Color(hex: 0x211E1B))
            .clipShape(RoundedRectangle(cornerRadius: 28))

            if !isMoving {
                VStack(spacing: 8) {
                    Text("Today I’d love to…").font(BeatFont.medium(11))
                        .tracking(1.4).foregroundStyle(BeatTheme.accent)
                    Text(selected.answer).font(BeatFont.medium(21)).multilineTextAlignment(.center)
                    Text(selected.description).font(BeatFont.regular(14))
                        .foregroundStyle(.secondary).multilineTextAlignment(.center)
                }
                .padding(.horizontal, 8)
            }

            BeatButton(title: "Choose this BEAT", isLoading: isSaving, action: onConfirm)
                .disabled(isMoving)
            Button {
                Task { await surprise() }
            } label: {
                Label("Surprise me", systemImage: "sparkles")
                    .frame(maxWidth: .infinity).frame(height: 50)
            }
            .buttonStyle(.plain).background(BeatTheme.moodButton)
            .clipShape(RoundedRectangle(cornerRadius: 16)).disabled(isMoving)
        }
        .padding(19).background(BeatTheme.moodPanel)
        .clipShape(RoundedRectangle(cornerRadius: 34))
    }

    private var selected: BeatOption { options[selectedIndex.clamped(to: options.indices)] }
    private func arrow(_ symbol: String, _ direction: Int) -> some View {
        Button { move(direction) } label: {
            Image(systemName: symbol).foregroundStyle(.white.opacity(0.65))
                .frame(width: 50, height: 36)
        }
        .accessibilityLabel(direction > 0 ? "Next BEAT" : "Previous BEAT")
    }
    private func move(_ direction: Int) {
        guard !options.isEmpty else { return }
        selectedIndex = (selectedIndex + direction + options.count) % options.count
        isMoving = false
    }
    private func surprise() async {
        isMoving = true
        let destination = Int.random(in: 0..<options.count)
        if !reduceMotion {
            for _ in 0..<12 {
                selectedIndex = (selectedIndex + 1) % options.count
                try? await Task.sleep(for: .milliseconds(55))
            }
        }
        selectedIndex = destination
        isMoving = false
    }
}

struct ActiveBeatCard: View {
    let beat: BeatOption
    let onChange: () -> Void
    var body: some View {
        VStack(spacing: 12) {
            Text("TODAY’S BEAT").font(BeatFont.medium(11)).tracking(2)
                .foregroundStyle(BeatTheme.accent)
            Text(beat.label).font(BeatFont.light(30))
            Text(beat.description).font(BeatFont.regular(14))
                .foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("Change", action: onChange).font(BeatFont.medium(14))
        }
        .frame(maxWidth: .infinity).padding(28)
        .background(BeatTheme.moodPanel).clipShape(RoundedRectangle(cornerRadius: 28))
    }
}

private extension Int {
    func clamped(to range: Range<Int>) -> Int {
        Swift.min(Swift.max(self, range.lowerBound), range.upperBound - 1)
    }
}
