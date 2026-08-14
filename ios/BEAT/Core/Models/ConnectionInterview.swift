import Foundation

enum ConnectionInterview {
    static let questions: [ConnectionQuestion] = [
        question("q1", .depth, "You meet someone interesting. What usually pulls you in?",
                 "A playful spark", "An easy conversation", "Going somewhere deeper"),
        question("q2", .depth, "A conversation feels especially good when…",
                 "It stays light and fun", "It moves naturally between topics", "We forget time exists"),
        question("q3", .directness, "When you like someone, you tend to…",
                 "Let them figure it out", "Give them a few signs", "Tell them clearly"),
        question("q4", .directness, "When something feels unclear, you prefer to…",
                 "See how it develops", "Wait for the right moment", "Ask directly"),
        question("q5", .focus, "Your ideal first meeting is…",
                 "Somewhere lively", "Relaxed with some atmosphere", "Quiet enough to focus on each other"),
        question("q6", .focus, "At a social gathering, you usually…",
                 "Move between many people", "Mix, then settle into a conversation", "Find one person worth talking to"),
        question("q7", .structure, "A spontaneous invitation arrives. Your first reaction is…",
                 "Let’s go", "Tell me a little more", "I would rather make a plan"),
        question("q8", .structure, "A good date feels best when…",
                 "Anything could happen", "There is a loose idea", "We know what we are doing"),
        question("q9", .pace, "When a connection begins, you usually…",
                 "Follow the chemistry quickly", "Let it unfold naturally", "Need time before opening up"),
        question("q10", .pace, "After a promising first date, you prefer…",
                 "Keep the momentum going", "Stay in touch and see", "Have some time to process")
    ]

    private static func question(
        _ id: String, _ dimension: ConnectionDimension, _ text: String,
        _ a: String, _ b: String, _ c: String
    ) -> ConnectionQuestion {
        ConnectionQuestion(id: id, dimension: dimension, text: text, answers: [
            .init(id: "a", text: a, score: 0),
            .init(id: "b", text: b, score: 1),
            .init(id: "c", text: c, score: 2)
        ])
    }
}
