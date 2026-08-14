import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var model = ProfileFormModel()
    @State private var showAvatarPicker = false
    let isRequiredCompletion: Bool
    let onCompleted: (() -> Void)?

    init(isRequiredCompletion: Bool = false, onCompleted: (() -> Void)? = nil) {
        self.isRequiredCompletion = isRequiredCompletion
        self.onCompleted = onCompleted
    }

    var body: some View {
        NavigationStack {
            Form {
                if isRequiredCompletion {
                    Section {
                        Text("Complete the required details below before continuing. Account, legal and safety controls remain available in Settings.")
                            .foregroundStyle(.secondary)
                    } header: {
                        Text("Complete your profile")
                    }
                }
                Section {
                    Button { showAvatarPicker = true } label: {
                        VStack(spacing: 10) {
                            avatar
                            Text(model.avatarURL == nil ? "Add a profile image" : "Change profile image")
                                .font(BeatFont.medium(14))
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(Color.clear)
                }
                if model.avatarURL == nil {
                    Section {
                        Text(
                            "Your profile has no image yet. Upload your own photo or choose a BEAT alter-ego."
                        )
                        .foregroundStyle(.secondary)
                        Button("Choose a photo or avatar") {
                            showAvatarPicker = true
                        }
                    }
                }
                ProfilePhotoStrip(model: model, userID: auth.user?.id)
                Section("profile.about") {
                    TextField("profile.display_name", text: $model.displayName)
                    TextField("profile.bio", text: $model.bio, axis: .vertical)
                        .lineLimit(3...7)
                    TextField("profile.birthdate", text: $model.birthdate)
                        .textContentType(.dateTime)
                }
                Section("profile.location") {
                    Label(model.locationLabel, systemImage: "location.fill")
                    Text("Location is determined by this phone and cannot be edited.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Refresh phone location") {
                        Task { await model.refreshLocation(userID: auth.user?.id) }
                    }
                }
                Section("profile.preferences") {
                    Picker("profile.gender", selection: $model.gender) {
                        Text("profile.not_set").tag("")
                        Text("profile.gender_man").tag("man")
                        Text("profile.gender_woman").tag("woman")
                        Text("profile.gender_nonbinary").tag("non_binary")
                    }
                    TextField(
                        "profile.relationship_intention",
                        text: $model.relationshipIntention
                    )
                }
                ConnectionProfileSection(userID: auth.user?.id)
                if let errorMessage = model.errorMessage {
                    Section {
                        Text(errorMessage).foregroundStyle(.red)
                    }
                }
                if model.didSave {
                    Section {
                        Label("profile.saved", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(BeatTheme.paper)
            .navigationTitle("tab.profile")
            .toolbar {
                if isRequiredCompletion {
                    ToolbarItem(placement: .cancellationAction) {
                        NavigationLink("Settings") { SettingsView() }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.save") {
                        Task { await model.save(userID: auth.user?.id) }
                    }
                    .disabled(model.isLoading)
                }
            }
            .task {
                model.onSaved = onCompleted
                await model.load(userID: auth.user?.id)
            }
            .sheet(isPresented: $showAvatarPicker) {
                if let userID = auth.user?.id {
                    AvatarChoiceSheet(
                        userID: userID
                    ) { result in
                        model.applyAvatarChoice(result)
                    }
                }
            }
            .alert(
                "Complete your profile",
                isPresented: Binding(
                    get: { model.validationMessage != nil },
                    set: { if !$0 { model.validationMessage = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(model.validationMessage ?? "")
            }
            .overlay {
                if model.isLoading {
                    ProgressView()
                        .padding(20)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
        }
    }

    @ViewBuilder
    private var avatar: some View {
        if let url = model.avatarURL {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 112, height: 112)
            .clipShape(Circle())
        } else {
            ZStack {
                Circle().fill(BeatTheme.accentLight.opacity(0.42))
                Image(systemName: "person.fill")
                    .font(.system(size: 42))
                    .foregroundStyle(BeatTheme.accent)
            }
            .frame(width: 112, height: 112)
        }
    }
}
