import SwiftUI

struct LegalDocumentView: View {
    @Environment(\.dismiss) private var dismiss
    let document: LegalDocument

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(document.title)
                    .font(BeatFont.light(34))
                Text("Effective: 23 July 2026")
                    .font(BeatFont.regular(13))
                    .foregroundStyle(.secondary)
                Text(document.body)
                    .font(BeatFont.regular(15))
                    .foregroundStyle(BeatTheme.muted.opacity(0.78))
                    .lineSpacing(6)
                    .textSelection(.enabled)
                Divider()
                Text("legal.operator")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .padding(24)
        }
        .background(BeatTheme.paper)
        .navigationTitle("BEAT")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("common.done") { dismiss() }
            }
        }
    }
}

struct LegalLinks: View {
    @Binding var document: LegalDocument?

    var body: some View {
        HStack(spacing: 14) {
            ForEach(LegalDocument.allCases) { item in
                Button(item.title) { document = item }
            }
        }
        .font(.caption2)
        .foregroundStyle(.white.opacity(0.45))
        .frame(maxWidth: .infinity)
    }
}
