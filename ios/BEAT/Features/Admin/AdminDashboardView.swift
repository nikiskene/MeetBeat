import SwiftUI

struct AdminDashboardView: View {
    @State private var dashboard: AdminDashboard?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Live operational overview and production controls.")
                    .foregroundStyle(.secondary)
                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding(50)
                } else if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                } else if let dashboard {
                    LazyVGrid(columns: [.init(), .init()], spacing: 12) {
                        metric("Registered users", dashboard.users.total, "person.2")
                        metric("Active today", dashboard.users.activeToday, "waveform.path.ecg")
                        metric("Messages today", dashboard.activity.messagesToday, "message")
                        NavigationLink {
                            AdminModerationView()
                        } label: {
                            metric("Open cases", dashboard.cases.open, "exclamationmark.triangle")
                        }
                        .buttonStyle(.plain)
                    }
                    sectionLinks
                }
            }
            .padding(20)
        }
        .background(BeatTheme.paper)
        .navigationTitle("Admin Dashboard")
        .task { await load() }
        .refreshable { await load() }
    }

    private func metric(_ label: String, _ value: Int, _ symbol: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: symbol).foregroundStyle(BeatTheme.accent)
            Text("\(value)").font(BeatFont.semibold(30))
            Text(label).font(BeatFont.regular(12)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(17)
        .background(BeatTheme.card)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(BeatTheme.border))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var sectionLinks: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Operations").font(BeatFont.medium(20)).padding(.top, 8)
            operationLink("Users", "person.2", "View and manage registered users.") {
                AdminUsersView()
            }
            operationLink("User Map", "map", "See where members are located.") {
                AdminUserMapView()
            }
            operationLink("Moderation", "shield", "Review reports, blocks and support cases.") {
                AdminModerationView()
            }
            operationLink("Bug Reports", "ladybug", "Review beta feedback, screenshots and device context.") {
                AdminBugReportsView()
            }
            operationLink("Messages", "megaphone", "Send community announcements.") {
                AdminBroadcastView()
            }
            operationLink("System Health", "waveform.path.ecg", "Monitor the health of the BEAT platform.") {
                AdminHealthView()
            }
            operationLink("Design", "paintpalette", "Inspect homepage assets and feature flags.") {
                AdminDesignView()
            }
        }
    }

    private func operationLink<Destination: View>(
        _ title: String,
        _ symbol: String,
        _ subtitle: String,
        @ViewBuilder destination: () -> Destination
    ) -> some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 14) {
                Image(systemName: symbol).foregroundStyle(BeatTheme.accent)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BeatFont.medium(15))
                    Text(subtitle).font(BeatFont.regular(12)).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            .padding(16)
            .background(BeatTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 17))
        }
        .buttonStyle(.plain)
    }

    private func load() async {
        isLoading = true
        do {
            dashboard = try await AdminRepository().fetchDashboard()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
