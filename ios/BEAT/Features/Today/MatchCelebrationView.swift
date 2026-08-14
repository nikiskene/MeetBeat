import SwiftUI

struct MatchCelebrationView: View {
    let currentAvatarURL: URL?
    let matchedAvatarURL: URL?
    let matchedName: String
    let onMessage: () -> Void
    let onContinue: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var revealed = false
    @State private var shimmer = false

    var body: some View {
        ZStack {
            background
            sparkles

            VStack(spacing: 0) {
                Spacer()
                portraits
                    .scaleEffect(revealed ? 1 : 0.45)
                    .opacity(revealed ? 1 : 0)
                    .padding(.bottom, 38)

                Text("MATCH")
                    .font(BeatFont.semibold(54))
                    .tracking(7)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white, BeatTheme.gold, .white],
                            startPoint: shimmer ? .leading : .trailing,
                            endPoint: shimmer ? .trailing : .leading
                        )
                    )
                    .shadow(color: BeatTheme.gold.opacity(0.75), radius: 18)
                    .scaleEffect(revealed ? 1 : 0.8)
                    .opacity(revealed ? 1 : 0)

                Text("You two liked each other")
                    .font(BeatFont.medium(18))
                    .foregroundStyle(.white)
                    .padding(.top, 15)

                Text("You and \(matchedName) found the same beat.")
                    .font(BeatFont.regular(14))
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.top, 8)

                Spacer()

                Button("Send a message", action: onMessage)
                    .font(BeatFont.semibold(16))
                    .foregroundStyle(BeatTheme.brandDark)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(.white)
                    .clipShape(Capsule())

                Button("Keep exploring", action: onContinue)
                    .font(BeatFont.medium(15))
                    .foregroundStyle(.white.opacity(0.85))
                    .padding(.vertical, 18)
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 24)
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(reduceMotion ? nil : .spring(response: 0.75, dampingFraction: 0.68)) {
                revealed = true
            }
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: 1.6).repeatForever(autoreverses: true)) {
                shimmer.toggle()
            }
        }
    }

    private var background: some View {
        ZStack {
            Color(hex: 0x100E0D)
            RadialGradient(
                colors: [
                    BeatTheme.accent.opacity(0.48),
                    Color(hex: 0x4A202B).opacity(0.35),
                    .clear
                ],
                center: .top,
                startRadius: 20,
                endRadius: 520
            )
        }
    }

    private var portraits: some View {
        ZStack {
            portrait(url: currentAvatarURL, fallback: "Y")
                .offset(x: -65, y: 3)
                .rotationEffect(.degrees(revealed ? -5 : -18))
            portrait(url: matchedAvatarURL, fallback: String(matchedName.prefix(1)))
                .offset(x: 65, y: 3)
                .rotationEffect(.degrees(revealed ? 5 : 18))

            Image(systemName: "heart.fill")
                .font(.system(size: 31, weight: .semibold))
                .foregroundStyle(.white)
                .padding(15)
                .background(BeatTheme.accent, in: Circle())
                .shadow(color: BeatTheme.accent.opacity(0.8), radius: 18)
                .scaleEffect(revealed ? 1 : 0.2)
        }
        .frame(height: 180)
    }

    private func portrait(url: URL?, fallback: String) -> some View {
        AsyncImage(url: url) { phase in
            if case let .success(image) = phase {
                image.resizable().scaledToFill()
            } else {
                ZStack {
                    Color(hex: 0x332B27)
                    Text(fallback.uppercased())
                        .font(BeatFont.light(52))
                        .foregroundStyle(.white)
                }
            }
        }
        .frame(width: 154, height: 154)
        .clipShape(Circle())
        .overlay(Circle().stroke(BeatTheme.gold, lineWidth: 5))
        .shadow(color: BeatTheme.gold.opacity(0.38), radius: 18)
    }

    private var sparkles: some View {
        GeometryReader { proxy in
            ForEach(0..<18, id: \.self) { index in
                Image(systemName: index.isMultiple(of: 3) ? "heart.fill" : "sparkle")
                    .font(.system(size: CGFloat(8 + index % 8)))
                    .foregroundStyle(index.isMultiple(of: 3)
                                     ? BeatTheme.accent.opacity(0.65)
                                     : BeatTheme.gold.opacity(0.75))
                    .position(
                        x: proxy.size.width * CGFloat((index * 37) % 100) / 100,
                        y: proxy.size.height * CGFloat((index * 53 + 11) % 80) / 100
                    )
                    .offset(y: revealed && !reduceMotion ? -12 : 12)
                    .opacity(revealed ? 1 : 0)
                    .animation(
                        reduceMotion ? nil : .easeInOut(duration: 1.2)
                            .delay(Double(index) * 0.035),
                        value: revealed
                    )
            }
        }
        .allowsHitTesting(false)
    }
}
