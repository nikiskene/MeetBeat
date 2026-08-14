import PhotosUI
import SwiftUI

struct ProfilePhotoStrip: View {
    let model: ProfileFormModel
    let userID: UUID?
    @State private var selection: PhotosPickerItem?
    @State private var target: ProfilePhoto?

    var body: some View {
        Section("Profile photos") {
            if !model.profilePhotos.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(model.profilePhotos) { photo in
                            AsyncImage(url: photo.photoURL) { image in
                                image.resizable().scaledToFill()
                            } placeholder: { ProgressView() }
                            .frame(width: 104, height: 104)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                            .overlay(alignment: .topTrailing) {
                                photoMenu(photo)
                            }
                        }
                    }
                }
            }
            if model.profilePhotos.count < 3 {
                PhotosPicker(selection: $selection, matching: .images) {
                    Label("Add profile photo", systemImage: "photo.badge.plus")
                }
                .onTapGesture { target = nil }
            }
            Text("Use the menu on any photo to replace, reorder, remove, or make it primary.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .onChange(of: selection) { _, item in
            guard let item else { return }
            Task {
                guard let data = try? await item.loadTransferable(type: Data.self) else { return }
                if let target { await model.replace(target, data: data, userID: userID) }
                else { await model.addPhoto(data: data, userID: userID) }
                selection = nil
            }
        }
    }

    private func photoMenu(_ photo: ProfilePhoto) -> some View {
        Menu {
            PhotosPicker(selection: $selection, matching: .images) {
                Label("Replace photo", systemImage: "arrow.triangle.2.circlepath")
            }
            .simultaneousGesture(TapGesture().onEnded { target = photo })
            Button("Make primary", systemImage: "star") {
                Task { await model.makePrimary(photo, userID: userID) }
            }
            Button("Move earlier", systemImage: "arrow.left") {
                Task { await model.move(photo, by: -1, userID: userID) }
            }
            Button("Move later", systemImage: "arrow.right") {
                Task { await model.move(photo, by: 1, userID: userID) }
            }
            Button("Remove photo", systemImage: "trash", role: .destructive) {
                Task { await model.remove(photo, userID: userID) }
            }
            .disabled(model.profilePhotos.count == 1 || photo.photoURL == model.avatarURL)
        } label: {
            Image(systemName: photo.photoURL == model.avatarURL
                  ? "star.circle.fill" : "ellipsis.circle.fill")
                .font(.title3).foregroundStyle(.white, BeatTheme.accent).padding(6)
        }
    }
}
