import XCTest
@testable import BEAT

final class ReleaseContractTests: XCTestCase {
    func testDimensionMappingAndMixedSummary() throws {
        let expected: [ConnectionDimension] = [
            .depth, .depth, .directness, .directness, .focus,
            .focus, .structure, .structure, .pace, .pace
        ]
        XCTAssertEqual(ConnectionInterview.questions.map(\.dimension), expected)
        let answers = Dictionary(uniqueKeysWithValues:
            ConnectionInterview.questions.enumerated().map { ($0.element.id, $0.offset.isMultiple(of: 2) ? "a" : "c") }
        )
        let profile = try ConnectionScorer.calculate(answers: answers)
        XCTAssertEqual(profile.identifier, "Balanced · Responsive · Flexible · Adaptable · Natural pace")
        XCTAssertEqual(profile.summary.components(separatedBy: ". ").count, 5)
    }

    func testCompatibilityWeightsAndMissingFallback() throws {
        let low = try ConnectionScorer.calculate(answers: all("a"))
        let high = try ConnectionScorer.calculate(answers: all("c"))
        XCTAssertEqual(CompatibilityScorer.score(low, low), 1, accuracy: 0.0001)
        XCTAssertEqual(CompatibilityScorer.score(low, high), 0, accuracy: 0.0001)
        XCTAssertEqual(CompatibilityScorer.score(low, nil), 0.5, accuracy: 0.0001)
    }

    func testCompatibilityDeterministicOrdering() throws {
        let profile = try ConnectionScorer.calculate(answers: all("b"))
        let first = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
        let second = UUID(uuidString: "00000000-0000-0000-0000-000000000002")!
        let ordered = CompatibilityScorer.ordered(
            [(second, profile, nil, 2), (first, profile, nil, 2)],
            current: profile
        )
        XCTAssertEqual(ordered, [first, second])
    }

    func testWheelDefaultsHiddenAndFinalProtection() {
        XCTAssertEqual(BeatWheelSettings.normalized([]).count, 13)
        XCTAssertEqual(
            BeatWheelSettings.normalized(["chat", "meet", "coffee", "flirt"]).count,
            13
        )
        let values = BeatOption.allCases.map(\.rawValue)
        XCTAssertEqual(BeatWheelSettings.toggling("coffee", enabled: false, in: values)?.count, 12)
        XCTAssertNil(BeatWheelSettings.toggling("coffee", enabled: false, in: ["coffee"]))
    }

    func testContentResolutionAndSafePlaceholders() {
        XCTAssertEqual(ContentService.resolve("Remote", fallback: "Bundled"), "Remote")
        XCTAssertEqual(ContentService.resolve(" ", fallback: "Bundled"), "Bundled")
        XCTAssertEqual(
            ContentService.resolve(
                "{current} {version} {selectedBeat} {unsafe}",
                fallback: "",
                values: ["current": "2", "version": "1", "selectedBeat": "Coffee", "unsafe": "x"]
            ),
            "2 1 Coffee {unsafe}"
        )
    }

    func testDraftRoundTripAndInvalidFiltering() {
        let suite = UserDefaults(suiteName: UUID().uuidString)!
        ConnectionDraftStore.save(["q1": "b", "bad": "c", "q2": "x"], defaults: suite)
        XCTAssertEqual(ConnectionDraftStore.load(defaults: suite), ["q1": "b"])
        XCTAssertEqual(ConnectionDraftStore.resumeIndex(for: ["q1": "b"]), 1)
        ConnectionDraftStore.clear(defaults: suite)
        XCTAssertTrue(ConnectionDraftStore.load(defaults: suite).isEmpty)
    }

    func testCoordinateEncodeIntegrity() throws {
        let value = PhoneLocationUpdate(
            city: "Vienna", country: "Austria", region: "Vienna",
            latitude: 48.2082, longitude: 16.3738,
            locationLabel: "Vienna, Austria", locationUpdatedAt: "2026-07-30T00:00:00Z"
        )
        let object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(value)) as! [String: Any]
        XCTAssertEqual(object["latitude"] as! Double, 48.2082, accuracy: 0.0001)
        XCTAssertEqual(object["longitude"] as! Double, 16.3738, accuracy: 0.0001)
        XCTAssertNotEqual(object["latitude"] as? Double, 0)
        XCTAssertNotEqual(object["longitude"] as? Double, 0)
    }

    private func all(_ answer: String) -> [String: String] {
        Dictionary(uniqueKeysWithValues: ConnectionInterview.questions.map { ($0.id, answer) })
    }
}
