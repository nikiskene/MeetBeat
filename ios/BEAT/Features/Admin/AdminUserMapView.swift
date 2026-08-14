import MapKit
import SwiftUI

struct AdminUserMapView: View {
    @State private var users: [AdminMapUser] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var camera: MapCameraPosition = .automatic

    var body: some View {
        ZStack {
            Map(position: $camera) {
                ForEach(users) { user in
                    Annotation(user.displayName ?? "Member", coordinate: user.coordinate) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.white, BeatTheme.accent)
                            .padding(3)
                            .background(.regularMaterial, in: Circle())
                            .accessibilityLabel(label(for: user))
                    }
                }
            }
            if isLoading {
                ProgressView("Loading member locations…")
                    .padding(18).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            } else if let errorMessage {
                ContentUnavailableView(
                    "Map unavailable", systemImage: "map",
                    description: Text(errorMessage)
                )
            } else if users.isEmpty {
                ContentUnavailableView(
                    "No shared locations", systemImage: "mappin.slash",
                    description: Text("Member locations will appear here when available.")
                )
            }
        }
        .navigationTitle("User Map")
        .task { await load() }
    }

    private func label(for user: AdminMapUser) -> String {
        let location = [user.city, user.country].compactMap { $0 }.joined(separator: ", ")
        return [user.displayName ?? "Member", location].filter { !$0.isEmpty }.joined(separator: ", ")
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            users = try await AdminRepository().fetchMapUsers()
            camera = .automatic
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
