import SwiftUI

struct AdminUsersView: View {
    @State private var users: [AdminUser] = []
    @State private var search = ""
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        List {
            ForEach(users) { user in
                VStack(alignment: .leading, spacing: 7) {
                    HStack {
                        Text(user.displayName ?? user.email ?? "Unnamed member")
                            .font(BeatFont.medium(16))
                        Spacer()
                        Text(user.isBanned == true ? "Suspended" : "Active")
                            .font(BeatFont.medium(11))
                            .foregroundStyle(user.isBanned == true ? .red : .green)
                    }
                    if let email = user.email { Text(email).font(.caption).foregroundStyle(.secondary) }
                    Label([user.city, user.country].compactMap { $0 }.joined(separator: ", "),
                          systemImage: "mappin")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("Last active: \(user.lastActiveAt ?? "Never")")
                        .font(.caption2).foregroundStyle(.secondary)
                    Button(user.isBanned == true ? "Restore member" : "Suspend member") {
                        Task { await toggle(user) }
                    }
                    .foregroundStyle(user.isBanned == true ? .green : .red)
                }
                .padding(.vertical, 5)
            }
        }
        .overlay { if loading { ProgressView() } }
        .overlay(alignment: .bottom) {
            if let error { Text(error).font(.caption).foregroundStyle(.red).padding() }
        }
        .searchable(text: $search, prompt: "Name, email, city or country")
        .navigationTitle("Users")
        .task(id: search) { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        loading = true
        do { users = try await AdminRepository().fetchUsers(search: search); error = nil }
        catch { self.error = error.localizedDescription }
        loading = false
    }

    private func toggle(_ user: AdminUser) async {
        do {
            try await AdminRepository().setSuspended(userID: user.id, suspended: user.isBanned != true)
            await load()
        } catch { self.error = error.localizedDescription }
    }
}

struct AdminModerationView: View {
    @State private var cases: [AdminModerationCase] = []
    @State private var events: [AdminModerationEvent] = []
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        List {
            Section("Cases") {
                if cases.isEmpty && !loading {
                    Text("No moderation cases.")
                        .foregroundStyle(.secondary)
                }
                ForEach(cases) { item in
                    NavigationLink {
                        AdminModerationCaseView(item: item)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("#\(item.caseNumber) · \(item.title)")
                                    .font(BeatFont.medium(15))
                                Spacer()
                                Text(item.priority.capitalized)
                                    .font(BeatFont.medium(10))
                                    .foregroundStyle(item.priority == "critical" ? .red : .orange)
                            }
                            Text("\(item.type.replacingOccurrences(of: "_", with: " ").capitalized) · \(item.status.capitalized)")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            Section("Recent safety events") {
                ForEach(events.prefix(50)) { event in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.eventType.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(BeatFont.medium(14))
                        Text(event.summary ?? "No summary")
                            .font(.caption).foregroundStyle(.secondary)
                        Text(event.createdAt).font(.caption2).foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .overlay { if loading { ProgressView() } }
        .overlay(alignment: .bottom) {
            if let error { Text(error).font(.caption).foregroundStyle(.red).padding() }
        }
        .navigationTitle("Moderation")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        loading = true
        do {
            async let caseResult = AdminRepository().fetchModerationCases()
            async let eventResult = AdminRepository().fetchModerationEvents()
            (cases, events) = try await (caseResult, eventResult)
            error = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}

private struct AdminModerationCaseView: View {
    let item: AdminModerationCase

    var body: some View {
        List {
            Section("Case #\(item.caseNumber)") {
                LabeledContent("Status", value: item.status.capitalized)
                LabeledContent("Priority", value: item.priority.capitalized)
                LabeledContent("Type", value: item.type.replacingOccurrences(of: "_", with: " ").capitalized)
                LabeledContent("Created", value: item.createdAt)
                LabeledContent("Updated", value: item.updatedAt)
            }
            if let description = item.description {
                Section("Description") { Text(description) }
            }
            if let memberID = item.primaryMemberID {
                Section("Member") { Text(memberID.uuidString).font(.caption) }
            }
        }
        .navigationTitle(item.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
