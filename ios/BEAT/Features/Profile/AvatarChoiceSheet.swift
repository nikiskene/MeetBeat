import PhotosUI
import SwiftUI

struct AvatarChoiceSheet: View {
    @Environment(\.dismiss) private var dismiss
    let userID: UUID
    let onSelected: (AvatarChoiceResult) -> Void

    @State private var model = AvatarChoiceModel()
    @State private var photoItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    invitation
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        Label("Upload your own photo", systemImage: "photo.badge.plus")
                            .font(BeatFont.medium(16))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .foregroundStyle(BeatTheme.primaryActionText)
                            .background(BeatTheme.primaryAction)
                            .clipShape(Capsule())
                    }
                    .disabled(model.isBusy)

                    HStack {
                        Rectangle().frame(height: 1).foregroundStyle(.tertiary)
                        Text("OR CHOOSE AN ALTER-EGO")
                            .font(BeatFont.medium(11))
                            .tracking(1.4)
                            .foregroundStyle(.secondary)
                            .fixedSize()
                        Rectangle().frame(height: 1).foregroundStyle(.tertiary)
                    }

                    Grid(horizontalSpacing: 14, verticalSpacing: 14) {
                        ForEach(0..<(AvatarOption.all.count / 2), id: \.self) { row in
                            GridRow {
                                ForEach(AvatarOption.all[(row * 2)..<(row * 2 + 2)]) { option in
                                    Button {
                                        Task { await choose(option) }
                                    } label: {
                                        avatarCard(option)
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(model.isBusy)
                                }
                            }
                        }
                    }

                    if let errorMessage = model.errorMessage {
                        Text(errorMessage)
                            .font(BeatFont.regular(14))
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(20)
            }
            .background(BeatTheme.paper)
            .navigationTitle("Add a profile image")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Not now") { dismiss() }
                }
            }
            .overlay {
                if model.isBusy {
                    ProgressView()
                        .padding(18)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task { await upload(item) }
            }
            .alert(
                "Couldn’t add avatar",
                isPresented: Binding(
                    get: { model.errorMessage != nil },
                    set: { if !$0 { model.errorMessage = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(model.errorMessage ?? "")
            }
        }
    }

    private var invitation: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Let people recognize your profile")
                .font(BeatFont.light(26))
            Text(
                "Add your own photo, or choose an illustrated BEAT alter-ego. You can change it anytime."
            )
            .font(BeatFont.regular(15))
            .foregroundStyle(.secondary)
            .lineSpacing(3)
        }
    }

    private func avatarCard(_ option: AvatarOption) -> some View {
        VStack(spacing: 9) {
            AsyncImage(url: option.url) { phase in
                if case let .success(image) = phase {
                    image.resizable().scaledToFill()
                } else if case .failure = phase {
                    Image(systemName: "person.crop.circle.badge.exclamationmark")
                        .font(.system(size: 34))
                        .foregroundStyle(.secondary)
                } else {
                    ProgressView()
                }
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(BeatTheme.accentLight.opacity(0.18))
            .clipShape(RoundedRectangle(cornerRadius: 20))

            Text(option.name)
                .font(BeatFont.medium(14))
                .foregroundStyle(BeatTheme.ink)
        }
        .padding(8)
        .background(BeatTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    private func choose(_ option: AvatarOption) async {
        guard let result = await model.choose(
            option,
            userID: userID
        ) else { return }
        onSelected(result)
        dismiss()
    }

    private func upload(_ item: PhotosPickerItem) async {
        guard let url = await model.upload(item, userID: userID) else { return }
        onSelected(.primary(url))
        dismiss()
    }
}
