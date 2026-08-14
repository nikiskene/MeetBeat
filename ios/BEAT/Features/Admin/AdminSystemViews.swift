import SwiftUI

struct AdminHealthView: View {
    @State private var entries: [HealthEntry] = []
    @State private var error: String?
    var body: some View {
        List(entries) { entry in
            HStack(alignment: .top, spacing: 12) {
                Circle().fill(color(entry.status)).frame(width: 11, height: 11).padding(.top, 5)
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.feature).font(BeatFont.medium(16))
                    Text(entry.message).font(.caption).foregroundStyle(.secondary)
                    Text(entry.checkedAt).font(.caption2).foregroundStyle(.tertiary)
                }
            }
        }
        .overlay { if let error { Text(error).foregroundStyle(.red).padding() } }
        .navigationTitle("System Health")
        .task { await load() }
        .refreshable { await load() }
    }
    private func color(_ status: String) -> Color {
        status == "green" ? .green : status == "orange" ? .orange : .red
    }
    private func load() async {
        do { entries = try await AdminRepository().fetchHealth(); error = nil }
        catch { self.error = error.localizedDescription }
    }
}

struct AdminBroadcastView: View {
    @State private var title = ""
    @State private var message = ""
    @State private var audience = "all_active"
    @State private var result: String?
    @State private var sending = false
    var body: some View {
        Form {
            Section("Announcement") {
                TextField("Title", text: $title)
                TextField("Message", text: $message, axis: .vertical).lineLimit(4...10)
                Picker("Audience", selection: $audience) {
                    Text("All active members").tag("all_active")
                    Text("Verified members").tag("verified")
                    Text("Active in last 30 days").tag("recently_active")
                }
            }
            Section {
                Button("Publish announcement") { Task { await publish() } }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty ||
                              message.trimmingCharacters(in: .whitespaces).isEmpty || sending)
            } footer: {
                Text("Publishing queues delivery through the protected production operation.")
            }
            if let result { Section { Text(result) } }
        }
        .navigationTitle("Messages")
    }
    private func publish() async {
        sending = true
        do {
            let response = try await AdminRepository().publishBroadcast(
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                body: message.trimmingCharacters(in: .whitespacesAndNewlines),
                audience: audience
            )
            result = "\(response.status ?? "Published") · \(response.queuedDeliveries ?? 0) deliveries queued"
            title = ""; message = ""
        } catch { result = error.localizedDescription }
        sending = false
    }
}

struct AdminDesignView: View {
    @State private var slides: [HomepageSlide] = []
    @State private var flags: [AdminFeatureFlag] = []
    @State private var error: String?
    var body: some View {
        List {
            Section("Published homepage images") {
                ForEach(slides) { slide in
                    HStack {
                        AsyncImage(url: slide.imageURL) { image in
                            image.resizable().scaledToFill()
                        } placeholder: { ProgressView() }
                        .frame(width: 72, height: 52).clipped()
                        Text("Position \(slide.position + 1)")
                        Spacer()
                        Image(systemName: slide.published ? "checkmark.circle.fill" : "circle")
                    }
                }
            }
            Section("Feature flags") {
                ForEach(flags) { flag in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(flag.name)
                            if let description = flag.description {
                                Text(description).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Image(systemName: flag.enabled ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(flag.enabled ? .green : .secondary)
                    }
                }
            }
        }
        .overlay { if let error { Text(error).foregroundStyle(.red).padding() } }
        .navigationTitle("Design")
        .task { await load() }
        .refreshable { await load() }
    }
    private func load() async {
        do {
            async let slideResult = AdminRepository().fetchSlides()
            async let flagResult = AdminRepository().fetchFeatureFlags()
            (slides, flags) = try await (slideResult, flagResult)
            error = nil
        } catch { self.error = error.localizedDescription }
    }
}
