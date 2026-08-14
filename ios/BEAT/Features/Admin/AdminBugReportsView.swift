import SwiftUI

struct AdminBugReportsView: View {
    @State private var reports: [BetaBugReport] = []
    @State private var reporterNames: [UUID: String] = [:]
    @State private var filter = "open"
    @State private var loading = true
    @State private var error: String?

    private var filteredReports: [BetaBugReport] {
        switch filter {
        case "new": reports.filter { $0.status == "new" }
        case "resolved": reports.filter { ["resolved", "wont_fix", "duplicate"].contains($0.status) }
        case "all": reports
        default: reports.filter { !["resolved", "wont_fix", "duplicate"].contains($0.status) }
        }
    }

    var body: some View {
        List {
            Section {
                Picker("Filter", selection: $filter) {
                    Text("Open").tag("open")
                    Text("New").tag("new")
                    Text("Resolved").tag("resolved")
                    Text("All").tag("all")
                }
                .pickerStyle(.segmented)
            }
            if filteredReports.isEmpty && !loading {
                ContentUnavailableView(
                    "No bug reports",
                    systemImage: "ladybug",
                    description: Text("No reports match this filter.")
                )
            }
            ForEach(filteredReports) { report in
                NavigationLink {
                    AdminBugReportDetail(
                        report: report,
                        reporterName: reporterNames[report.reporterID] ?? "Unknown member"
                    ) {
                        await load()
                    }
                } label: {
                    reportRow(report)
                }
            }
        }
        .overlay { if loading { ProgressView() } }
        .overlay(alignment: .bottom) {
            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding()
                    .background(.regularMaterial)
            }
        }
        .navigationTitle("Bug Reports")
        .task { await load() }
        .refreshable { await load() }
    }

    private func reportRow(_ report: BetaBugReport) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(report.summary).font(BeatFont.medium(15)).lineLimit(2)
                Spacer()
                Text(report.priority.capitalized)
                    .font(BeatFont.medium(10))
                    .foregroundStyle(priorityColor(report.priority))
            }
            Text("\(report.category.capitalized) · \(report.status.replacingOccurrences(of: "_", with: " ").capitalized)")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text(reporterNames[report.reporterID] ?? report.reporterID.uuidString)
                Spacer()
                Text(report.createdAt)
            }
            .font(.caption2)
            .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }

    private func priorityColor(_ priority: String) -> Color {
        priority == "critical" ? .red : priority == "high" ? .orange : .secondary
    }

    private func load() async {
        loading = true
        do {
            async let reportResult = AdminRepository().fetchBugReports()
            async let userResult = AdminRepository().fetchUsers()
            let (loadedReports, users) = try await (reportResult, userResult)
            reports = loadedReports
            reporterNames = Dictionary(
                uniqueKeysWithValues: users.map {
                    ($0.id, $0.displayName ?? $0.email ?? "Unnamed member")
                }
            )
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
