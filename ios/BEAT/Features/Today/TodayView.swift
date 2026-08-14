import SwiftUI

struct TodayView: View {
    let onOpenConversation: (UUID) -> Void
    @EnvironmentObject private var auth: AuthStore
    @ObservedObject private var content = ContentService.shared
    @State private var activeBeat: ActiveBeat?
    @State private var selectedIndex = 0
    @State private var isMoving = false
    @State private var isEditing = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var enabledOptions = BeatOption.allCases

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("TODAY").font(BeatFont.medium(12))
                        .tracking(2.5).foregroundStyle(BeatTheme.accent)
                    Text(showWheel
                         ? content.text("wheel.question", fallback: "What would feel good today?")
                         : "People on your wavelength")
                        .font(BeatFont.light(34))
                    if showWheel {
                        Text(content.text("wheel.instruction", fallback: "Spin, scroll or use the arrows to explore."))
                            .font(BeatFont.regular(14)).foregroundStyle(.secondary)
                        MoodWheel(
                            options: enabledOptions,
                            selectedIndex: $selectedIndex,
                            isMoving: $isMoving,
                            isSaving: isSaving,
                            onConfirm: { Task { await confirmBeat() } }
                        )
                    } else if let activeBeat {
                        ActiveBeatCard(beat: activeBeat.beat) { isEditing = true }
                        DiscoveryView(
                            beat: activeBeat.beat,
                            onOpenConversation: onOpenConversation,
                            onChangeBeat: { isEditing = true }
                        )
                    }
                    if let errorMessage {
                        Text(errorMessage).font(.footnote).foregroundStyle(.red)
                    }
                }
                .padding(20)
            }
            .background(BeatTheme.paper)
            .navigationTitle("BEAT")
            .navigationBarTitleDisplayMode(.inline)
            .task(id: auth.user?.id) { await load() }
            .onReceive(NotificationCenter.default.publisher(for: .beatWheelSettingsChanged)) { _ in
                Task { await loadOptions() }
            }
        }
    }

    private var showWheel: Bool { activeBeat == nil || isEditing }
    private func load() async {
        guard let userID = auth.user?.id else { return }
        activeBeat = ActiveBeatCache.load()
        await loadOptions()
        do { activeBeat = try await ActiveBeatRepository().fetch(userID: userID) }
        catch { errorMessage = "Your current BEAT could not be refreshed. Please try again." }
    }

    private func loadOptions() async {
        guard let userID = auth.user?.id,
              let settings = try? await SettingsRepository().fetchSettings(userID: userID)
        else { return }
        let values = BeatWheelSettings.normalized(settings.moodWheelOptions)
        enabledOptions = values.compactMap(BeatOption.init(rawValue:))
        selectedIndex = min(selectedIndex, max(enabledOptions.count - 1, 0))
    }

    private func confirmBeat() async {
        guard let userID = auth.user?.id, enabledOptions.indices.contains(selectedIndex) else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            activeBeat = try await ActiveBeatRepository().select(
                userID: userID,
                beat: enabledOptions[selectedIndex]
            )
            isEditing = false
        } catch {
            errorMessage = "Your BEAT was not saved. Check your connection and try again."
        }
    }
}
