import Foundation

enum ConnectionScorer {
    static let dimensionOrder = ConnectionDimension.allCases

    static func calculate(answers: [String: String]) throws -> ConnectionProfile {
        guard answers.count == ConnectionInterview.questions.count else {
            throw ScoringError.incomplete
        }
        var scores = Dictionary(uniqueKeysWithValues: dimensionOrder.map { ($0.rawValue, 0) })
        for question in ConnectionInterview.questions {
            guard let answerID = answers[question.id],
                  let answer = question.answers.first(where: { $0.id == answerID })
            else { throw ScoringError.invalidAnswer }
            scores[question.dimension.rawValue, default: 0] += answer.score
        }
        let labels = Dictionary(uniqueKeysWithValues: dimensionOrder.map {
            ($0.rawValue, label(for: $0, score: scores[$0.rawValue, default: 0]))
        })
        let identifier = dimensionOrder.compactMap { labels[$0.rawValue] }.joined(separator: " · ")
        return ConnectionProfile(version: 1, dimensions: scores, labels: labels, identifier: identifier)
    }

    static func label(for dimension: ConnectionDimension, score: Int) -> String {
        switch (dimension, score) {
        case (.depth, 0...1): "Playful"; case (.depth, 2): "Balanced"; case (.depth, _): "Deep"
        case (.directness, 0...1): "Subtle"; case (.directness, 2): "Responsive"; case (.directness, _): "Direct"
        case (.focus, 0...1): "Social"; case (.focus, 2): "Flexible"; case (.focus, _): "One-to-one"
        case (.structure, 0...1): "Spontaneous"; case (.structure, 2): "Adaptable"; case (.structure, _): "Planned"
        case (.pace, 0...1): "Fast-opening"; case (.pace, 2): "Natural pace"; case (.pace, _): "Slow-opening"
        }
    }

    static func summary(for label: String) -> String? {
        summaries[label]
    }

    private static let summaries = [
        "Playful": "You tend to connect through lightness, chemistry and shared humour.",
        "Balanced": "You enjoy conversations that can move naturally between light and meaningful.",
        "Deep": "You tend to enjoy conversations that move beyond the surface.",
        "Subtle": "You often prefer connection to reveal itself gradually.",
        "Responsive": "You communicate through a balance of signals and clear responses.",
        "Direct": "You appreciate clear communication and knowing where you stand.",
        "Social": "You often feel energised by lively environments and varied interaction.",
        "Flexible": "You can enjoy both social energy and focused one-to-one time.",
        "One-to-one": "You often feel most comfortable focusing on one person at a time.",
        "Spontaneous": "You enjoy leaving room for surprise and following the moment.",
        "Adaptable": "You like having a direction without planning every detail.",
        "Planned": "You tend to feel best when expectations and plans are clear.",
        "Fast-opening": "You are comfortable following momentum when the chemistry feels right.",
        "Natural pace": "You prefer to let a new connection unfold without forcing its pace.",
        "Slow-opening": "You usually need some time before fully opening up."
    ]
}

enum ScoringError: LocalizedError {
    case incomplete, invalidAnswer
    var errorDescription: String? {
        self == .incomplete ? "Please answer all ten questions." : "One or more answers are invalid."
    }
}
