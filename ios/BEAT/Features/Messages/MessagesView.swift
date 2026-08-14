import SwiftUI

struct MessagesView: View {
    @Binding var openWithUserID: UUID?
    @State private var conversations: [Conversation] = []
    @State private var selectedConversation: Conversation?
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let repository = MessageRepository()

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else if let errorMessage {
                    ContentUnavailableView(
                        "common.error",
                        systemImage: "exclamationmark.triangle",
                        description: Text(errorMessage)
                    )
                } else if conversations.isEmpty {
                    ContentUnavailableView(
                        "messages.empty",
                        systemImage: "message",
                        description: Text("messages.empty_description")
                    )
                } else {
                    List(conversations) { conversation in
                        Button {
                            selectedConversation = conversation
                        } label: {
                            ConversationRow(conversation: conversation)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(BeatTheme.surface)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .background(BeatTheme.paper)
            .navigationTitle("tab.messages")
            .navigationDestination(item: $selectedConversation) { conversation in
                ThreadView(conversation: conversation)
            }
            .task {
                await load(openUserID: openWithUserID)
                openWithUserID = nil
            }
            .onChange(of: openWithUserID) { _, userID in
                guard let userID else { return }
                Task {
                    await load(openUserID: userID)
                    openWithUserID = nil
                }
            }
            .refreshable { await load(openUserID: nil) }
        }
    }

    private func load(openUserID: UUID?) async {
        isLoading = true
        errorMessage = nil
        do {
            conversations = try await repository.fetchConversations()
            if let openUserID,
               let target = conversations.first(where: {
                   $0.matchedUserID == openUserID
               }) {
                selectedConversation = target
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

private struct ConversationRow: View {
    let conversation: Conversation

    var body: some View {
        HStack(spacing: 13) {
            avatar
            VStack(alignment: .leading, spacing: 4) {
                Text(conversation.displayName ?? String(localized: "profile.unknown"))
                    .font(.headline)
                Text(conversation.lastMessage ?? String(localized: "messages.start"))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
            if let count = conversation.unreadCount, count > 0 {
                Text("\(count)")
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .padding(7)
                    .background(BeatTheme.accent)
                    .clipShape(Circle())
            }
        }
        .padding(.vertical, 7)
    }

    @ViewBuilder
    private var avatar: some View {
        if let url = conversation.avatarURL {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                BeatTheme.accentLight.opacity(0.35)
            }
            .frame(width: 52, height: 52)
            .clipShape(Circle())
        } else {
            ZStack {
                Circle().fill(BeatTheme.accentLight.opacity(0.35))
                Text(conversation.displayName?.prefix(1).uppercased() ?? "?")
                    .foregroundStyle(BeatTheme.accent)
            }
            .frame(width: 52, height: 52)
        }
    }
}
