import Foundation
import Supabase
import UIKit

struct BugReportRepository: Sendable {
    private let client = SupabaseProvider.client
    private let bucket = "beta-bug-screenshots"

    func isEnabled() async -> Bool {
        do {
            let flag: BugReporterFlag = try await client
                .from("feature_flags")
                .select("enabled")
                .eq("name", value: "ios_beta_bug_reporter")
                .single()
                .execute()
                .value
            return flag.enabled
        } catch {
            return false
        }
    }

    func submit(userID: UUID, submission: BugReportSubmission) async throws {
        let reportID = UUID()
        let description = submission.details.isEmpty
            ? submission.summary
            : submission.details
        let screenshotPath = try await uploadScreenshot(
            submission.screenshotData,
            userID: userID,
            reportID: reportID
        )
        do {
            try await client.from("beta_bug_reports")
                .insert(
                    BetaBugReportInsert(
                        id: reportID,
                        reporterID: userID,
                        category: submission.category,
                        summary: submission.summary,
                        details: description,
                        currentScreen: submission.currentScreen,
                        appVersion: Bundle.main.releaseVersion,
                        buildNumber: Bundle.main.buildNumber,
                        iosVersion: UIDevice.current.systemVersion,
                        deviceModel: UIDevice.current.model,
                        appearance: submission.appearance,
                        locale: Locale.current.identifier,
                        screenshotPath: screenshotPath,
                        metadata: [
                            "screen_width": "\(UIScreen.main.bounds.width)",
                            "screen_height": "\(UIScreen.main.bounds.height)"
                        ]
                    )
                )
                .execute()
        } catch {
            if let screenshotPath {
                _ = try? await client.storage.from(bucket).remove(paths: [screenshotPath])
            }
            throw error
        }
    }

    private func uploadScreenshot(
        _ data: Data?,
        userID: UUID,
        reportID: UUID
    ) async throws -> String? {
        guard let data else { return nil }
        let path = "\(userID.uuidString.lowercased())/\(reportID.uuidString.lowercased()).png"
        try await client.storage.from(bucket).upload(
            path,
            data: data,
            options: FileOptions(contentType: "image/png", upsert: false)
        )
        return path
    }
}

private struct BugReporterFlag: Decodable {
    let enabled: Bool
}

private struct BetaBugReportInsert: Encodable {
    let id: UUID
    let reporterID: UUID
    let category: String
    let summary: String
    let details: String
    let currentScreen: String
    let appVersion: String
    let buildNumber: String
    let iosVersion: String
    let deviceModel: String
    let appearance: String
    let locale: String
    let screenshotPath: String?
    let metadata: [String: String]

    enum CodingKeys: String, CodingKey {
        case id, category, summary, details, appearance, locale, metadata
        case reporterID = "reporter_id"
        case currentScreen = "current_screen"
        case appVersion = "app_version"
        case buildNumber = "build_number"
        case iosVersion = "ios_version"
        case deviceModel = "device_model"
        case screenshotPath = "screenshot_path"
    }
}

private extension Bundle {
    var releaseVersion: String {
        object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "Unknown"
    }

    var buildNumber: String {
        object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "Unknown"
    }
}
