import SwiftUI

enum DiscoveryInterest: String, CaseIterable, Identifiable {
    case woman
    case man
    case nonBinary = "non_binary"
    var id: String { rawValue }
    var label: String {
        switch self {
        case .woman: "Women"
        case .man: "Men"
        case .nonBinary: "Non-binary people"
        }
    }
    static func canonical(_ value: String) -> String? {
        switch value.lowercased().replacingOccurrences(of: "-", with: "_") {
        case "woman", "women": woman.rawValue
        case "man", "men": man.rawValue
        case "non_binary", "non_binary_people", "nonbinary": nonBinary.rawValue
        default: nil
        }
    }
}

enum BeatWheelSettings {
    static func normalized(_ values: [String]) -> [String] {
        let all = BeatOption.allCases.map(\.rawValue)
        let allowed = Set(all)
        guard !values.isEmpty, values.allSatisfy(allowed.contains) else { return all }
        let selected = Set(values)
        return all.filter(selected.contains)
    }

    static func toggling(_ value: String, enabled: Bool, in values: [String]) -> [String]? {
        var result = normalized(values)
        if enabled {
            result.append(value)
        } else {
            guard result.count > 1 else { return nil }
            result.removeAll { $0 == value }
        }
        let selected = Set(result)
        return BeatOption.allCases.map(\.rawValue).filter(selected.contains)
    }
}

struct AgeValueControl: View {
    let title: String
    let value: Int
    let canDecrease: Bool
    let canIncrease: Bool
    let decrease: () -> Void
    let increase: () -> Void
    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Button(action: decrease) { Image(systemName: "minus").frame(width: 32, height: 32) }
                .buttonStyle(.bordered).disabled(!canDecrease)
            Text("\(value)").font(BeatFont.medium(16)).monospacedDigit().frame(minWidth: 36)
            Button(action: increase) { Image(systemName: "plus").frame(width: 32, height: 32) }
                .buttonStyle(.bordered).disabled(!canIncrease)
        }
    }
}

#if DEBUG
struct AgeRangeDebugHarness: View {
    @State private var model = SettingsModel()
    var body: some View {
        Form {
            AgeValueControl(
                title: "Minimum", value: model.currentMinAge,
                canDecrease: model.currentMinAge > 18,
                canIncrease: model.currentMinAge < model.currentMaxAge - 1,
                decrease: { model.changeMinimum(by: -1) },
                increase: { model.changeMinimum(by: 1) }
            )
            AgeValueControl(
                title: "Maximum", value: model.currentMaxAge,
                canDecrease: model.currentMaxAge > model.currentMinAge + 1,
                canIncrease: model.currentMaxAge < 99,
                decrease: { model.changeMaximum(by: -1) },
                increase: { model.changeMaximum(by: 1) }
            )
        }
        .onAppear {
            model.settings = DiscoverySettings(
                userID: UUID(), interestedIn: [], minAge: 25, maxAge: 55,
                maxDistanceKM: 50, moodWheelOptions: BeatOption.allCases.map(\.rawValue)
            )
        }
    }
}
#endif

struct DeleteAccountView: View {
    @Environment(\.dismiss) private var dismiss
    let model: SettingsModel
    @State private var phrase = ""
    @State private var reason = ""
    var body: some View {
        NavigationStack {
            Form {
                Text("Your request can be cancelled for 7 days. After that, deletion is completed by the authorized operations workflow.")
                Section("Reason (optional)") { TextField("Reason", text: $reason, axis: .vertical) }
                Section("Type DELETE MY ACCOUNT to confirm") {
                    TextField("DELETE MY ACCOUNT", text: $phrase)
                        .textInputAutocapitalization(.characters)
                }
            }
            .navigationTitle("Delete account")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Schedule", role: .destructive) {
                        Task { await model.requestDeletion(reason: reason); dismiss() }
                    }
                    .disabled(phrase != "DELETE MY ACCOUNT")
                }
            }
        }
    }
}
