import SwiftUI

struct ThreadView: View {
    @EnvironmentObject private var auth: AuthStore
    let conversation: Conversation

    @State private var messages: [BeatMessage] = []
    @State private var draft = ""
    @State private var isLoading = true
    @State private var isSending = false
    @State private var errorMessage: String?

    private let repository = MessageRepository()

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(messages) { message in
                            MessageBubble(
                                message: message,
                                isMine: message.senderID == auth.user?.id,
                                currentUserID: auth.user?.id,
                                onReaction: { emoji in
                                    Task { await react(to: message, emoji: emoji) }
                                }
                            )
                            .id(message.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: messages.count) {
                    if let lastID = messages.last?.id {
                        withAnimation { proxy.scrollTo(lastID, anchor: .bottom) }
                    }
                }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            HStack(alignment: .bottom, spacing: 10) {
                TextField("messages.placeholder", text: $draft, axis: .vertical)
                    .lineLimit(1...5)
                    .padding(.horizontal, 15)
                    .padding(.vertical, 11)
                    .background(BeatTheme.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                Button {
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.headline.bold())
                        .foregroundStyle(BeatTheme.primaryActionText)
                        .frame(width: 44, height: 44)
                        .background(BeatTheme.primaryAction)
                        .clipShape(Circle())
                }
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
            }
            .padding(12)
            .background(.bar)
        }
        .background(BeatTheme.paper)
        .navigationTitle(conversation.displayName ?? String(localized: "tab.messages"))
        .navigationBarTitleDisplayMode(.inline)
        .overlay {
            if isLoading { ProgressView() }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            messages = try await repository.fetchMessages(matchID: conversation.id)
            try? await repository.markDelivered(matchID: conversation.id)
            try? await repository.markRead(matchID: conversation.id)
            messages = try await repository.fetchMessages(matchID: conversation.id)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func send() async {
        let content = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }
        draft = ""
        isSending = true
        errorMessage = nil
        do {
            let message = try await repository.sendMessage(
                matchID: conversation.id,
                content: content
            )
            messages.append(message)
        } catch {
            draft = content
            errorMessage = error.localizedDescription
        }
        isSending = false
    }

    private func react(to message: BeatMessage, emoji: String) async {
        guard let userID = auth.user?.id else { return }
        let existing = message.reactions?.first(where: { $0.userID == userID })?.emoji
        do {
            try await repository.setReaction(
                messageID: message.id,
                emoji: existing == emoji ? nil : emoji
            )
            messages = try await repository.fetchMessages(matchID: conversation.id)
        } catch { errorMessage = "Your reaction could not be updated. Please try again." }
    }
}

private struct MessageBubble: View {
    let message: BeatMessage
    let isMine: Bool
    let currentUserID: UUID?
    let onReaction: (String) -> Void

    var body: some View {
        HStack {
            if isMine { Spacer(minLength: 52) }
            VStack(alignment: isMine ? .trailing : .leading, spacing: 5) {
                Text(message.content)
                    .font(BeatFont.regular(16))
                HStack(spacing: 4) {
                    Text(message.createdAt.messageTime)
                    if isMine {
                        Image(systemName: message.readAt == nil ? "checkmark" : "checkmark.2")
                        Text(message.readAt != nil ? "Read" : message.deliveredAt != nil ? "Delivered" : "Sent")
                    }
                }
                .font(BeatFont.regular(10))
                .opacity(0.68)
                ReactionSummary(reactions: message.reactions ?? [])
            }
                .foregroundStyle(isMine ? BeatTheme.primaryActionText : BeatTheme.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(isMine ? BeatTheme.primaryAction : BeatTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 18))
            if !isMine { Spacer(minLength: 52) }
        }
        .contextMenu {
            ForEach(ReactionOption.allCases) { reaction in
                Button {
                    onReaction(reaction.rawValue)
                } label: {
                    Label("\(reaction.rawValue) \(reaction.label)", systemImage: "face.smiling")
                }
                .accessibilityLabel("\(reaction.label) reaction")
            }
        }
    }
}

private struct ReactionSummary: View {
    let reactions: [MessageReaction]
    var body: some View {
        if !reactions.isEmpty {
            HStack(spacing: 5) {
                ForEach(grouped, id: \.emoji) { item in
                    Text(item.count > 1 ? "\(item.emoji) \(item.count)" : item.emoji)
                        .font(.caption).padding(.horizontal, 7).padding(.vertical, 3)
                        .background(.thinMaterial).clipShape(Capsule())
                        .accessibilityLabel("\(item.count) \(item.emoji) reactions")
                }
            }
        }
    }
    private var grouped: [(emoji: String, count: Int)] {
        Dictionary(grouping: reactions, by: \.emoji)
            .map { ($0.key, $0.value.count) }.sorted { $0.emoji < $1.emoji }
    }
}

private extension String {
    var messageTime: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: self) ?? ISO8601DateFormatter().date(from: self)
        guard let date else { return "" }
        return date.formatted(date: .omitted, time: .shortened)
    }
}
