import SwiftUI

struct LandingHero: View {
    let onJoin: () -> Void
    let onSignIn: () -> Void

    @State private var imageIndex = 0
    @ObservedObject private var copyService = ContentService.shared
    private let images = [
        URL(string: "https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%201.png")!,
        URL(string: "https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%202.png")!,
        URL(string: "https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%203.png")!
    ]

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                AsyncImage(url: images[imageIndex]) { phase in
                    if case let .success(image) = phase {
                        image.resizable().scaledToFill()
                    } else {
                        BeatTheme.brandDark
                    }
                }
                .frame(width: geometry.size.width, height: geometry.size.height)
                .clipped()
                .animation(.easeInOut(duration: 0.7), value: imageIndex)

                LinearGradient(
                    colors: [.black.opacity(0.34), .black.opacity(0.18), .black.opacity(0.72)],
                    startPoint: .top,
                    endPoint: .bottom
                )

                VStack(spacing: 0) {
                    nav
                    Spacer(minLength: 52)
                    content
                    Spacer(minLength: 24)
                    Image(systemName: "chevron.down")
                        .font(.title3)
                        .foregroundStyle(.white.opacity(0.65))
                        .padding(.bottom, 24)
                }
                .padding(.top, max(geometry.safeAreaInsets.top, 52))
            }
        }
        .frame(minHeight: 780)
        .containerRelativeFrame(.vertical, alignment: .top) { availableHeight, _ in
            max(availableHeight, 780)
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(5))
                withAnimation { imageIndex = (imageIndex + 1) % images.count }
            }
        }
    }

    private var nav: some View {
        HStack {
            Text("BEAT")
                .font(BeatFont.medium(20))
                .tracking(5)
                .foregroundStyle(.white)
            Spacer()
            Button(copyService.text("welcome.hero.sign_in", fallback: "Already a member? Sign in"), action: onSignIn)
                .font(BeatFont.medium(13))
                .foregroundStyle(.white)
            Button(copyService.text("welcome.hero.join", fallback: "Join BEAT"), action: onJoin)
                .font(BeatFont.medium(13))
                .foregroundStyle(BeatTheme.brandDark)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(.white)
                .clipShape(Capsule())
        }
        .padding(.horizontal, 22)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(copyService.text("welcome.hero.eyebrow", fallback: "There are many ways to connect").uppercased())
                .font(BeatFont.medium(13))
                .tracking(2.6)
                .foregroundStyle(Color(hex: 0xE8C4BB))
                .padding(.bottom, 22)
            Text(copyService.text("welcome.hero.title", fallback: "Find someone on your wavelength."))
                .font(BeatFont.light(47))
                .foregroundStyle(.white)
            Text(copyService.text(
                "welcome.hero.body",
                fallback: "Choose what would feel good today. Then meet people nearby who chose the same BEAT and fit what you are looking for."
            ))
                .font(BeatFont.light(17))
                .foregroundStyle(.white.opacity(0.82))
                .lineSpacing(6)
                .padding(.top, 22)
            VStack(spacing: 12) {
                Button(action: onJoin) {
                    Label(copyService.text("welcome.hero.join", fallback: "Join BEAT"), systemImage: "arrow.right")
                        .labelStyle(TrailingIconLabelStyle())
                        .font(BeatFont.medium(15))
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                }
                .foregroundStyle(BeatTheme.brandDark)
                .background(.white)
                .clipShape(Capsule())

                Button(copyService.text("welcome.hero.sign_in", fallback: "Already a member? Sign in"), action: onSignIn)
                    .font(BeatFont.medium(15))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .overlay(Capsule().stroke(.white.opacity(0.45)))
            }
            .padding(.top, 30)
        }
        .padding(.horizontal, 24)
    }
}

private struct TrailingIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            configuration.title
            configuration.icon
        }
    }
}
