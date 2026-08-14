import XCTest
@testable import BEAT

final class ConnectionScorerTests: XCTestCase {
    func testInterviewContract() {
        XCTAssertEqual(ConnectionInterview.questions.count, 10)
        XCTAssertEqual(Set(ConnectionInterview.questions.map(\.id)).count, 10)
        XCTAssertTrue(ConnectionInterview.questions.allSatisfy { $0.answers.count == 3 })
        XCTAssertEqual(ConnectionProfile.questionnaireVersion, 1)
    }

    func testAllA() throws {
        let result = try ConnectionScorer.calculate(answers: answers("a"))
        XCTAssertEqual(result.identifier, "Playful · Subtle · Social · Spontaneous · Fast-opening")
        XCTAssertTrue(result.dimensions.values.allSatisfy { $0 == 0 })
    }

    func testAllB() throws {
        let result = try ConnectionScorer.calculate(answers: answers("b"))
        XCTAssertEqual(result.identifier, "Balanced · Responsive · Flexible · Adaptable · Natural pace")
        XCTAssertTrue(result.dimensions.values.allSatisfy { $0 == 2 })
    }

    func testAllC() throws {
        let result = try ConnectionScorer.calculate(answers: answers("c"))
        XCTAssertEqual(result.identifier, "Deep · Direct · One-to-one · Planned · Slow-opening")
        XCTAssertTrue(result.dimensions.values.allSatisfy { $0 == 4 })
    }

    func testIncompleteRejected() {
        XCTAssertThrowsError(try ConnectionScorer.calculate(answers: ["q1": "a"]))
    }

    func testInvalidRejected() {
        var value = answers("b")
        value["q10"] = "invalid"
        XCTAssertThrowsError(try ConnectionScorer.calculate(answers: value))
    }

    private func answers(_ answer: String) -> [String: String] {
        Dictionary(uniqueKeysWithValues: ConnectionInterview.questions.map { ($0.id, answer) })
    }
}
