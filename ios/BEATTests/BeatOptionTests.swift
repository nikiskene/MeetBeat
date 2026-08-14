import XCTest
@testable import BEAT

final class BeatOptionTests: XCTestCase {
    func testAllowedValues() throws {
        XCTAssertEqual(BeatOption.allCases.count, 13)
        for option in BeatOption.allCases {
            let data = try JSONEncoder().encode(option)
            XCTAssertEqual(try JSONDecoder().decode(BeatOption.self, from: data), option)
            XCTAssertFalse(option.label.isEmpty)
            XCTAssertFalse(option.answer.isEmpty)
            XCTAssertFalse(option.description.isEmpty)
        }
    }

    func testExpiration() {
        let userID = UUID()
        let expired = ActiveBeat(
            userID: userID, beat: .coffee,
            selectedAt: Date().addingTimeInterval(-90_000),
            expiresAt: Date().addingTimeInterval(-1)
        )
        XCTAssertFalse(expired.isActive)
    }
}
