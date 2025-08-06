import fs from "fs/promises";
import path from "path";
// karaokeSplitter.ts
export interface Word {
	text: string;
	start_time: number;
	end_time: number;
}

export interface Segment {
	text: string;
	start_time: number;
	end_time: number;
	words: Word[];
}

/**
 * Split each segment into chunks of ≤ `maxSentences` sentences.
 * Start/end times and word lists stay perfectly aligned for karaoke mode.
 */
export function splitTranscript(segments: Segment[], maxSentences = 2): Segment[] {
	const sentenceEnd = /[.!?]$/;
	const result: Segment[] = [];

	for (const seg of segments) {
		let current: Word[] = [];
		let sentenceCount = 0;

		for (const w of seg.words) {
			current.push(w);
			if (sentenceEnd.test(w.text)) {
				sentenceCount += 1;
			}

			if (sentenceCount === maxSentences) {
				result.push(buildSegment(current));
				current = [];
				sentenceCount = 0;
			}
		}

		if (current.length) {
			result.push(buildSegment(current));
		}
	}

	return result;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildSegment(words: Word[]): Segment {
	const text = words
		.map((w) => w.text)
		.join("")
		.trim();
	return {
		text,
		start_time: words[0]?.start_time ?? 0,
		end_time: words[words.length - 1]?.end_time ?? 0,
		words,
	};
}

async function main() {
	const file = path.join(process.cwd(), "in", "original.json");
	const transcriptStr = await fs.readFile(file, "utf-8");
	const transcript = JSON.parse(transcriptStr) as Segment[];
	const chunks = splitTranscript(transcript);
	await fs.writeFile(path.join(process.cwd(), "out", "chunks.json"), JSON.stringify(chunks, null, 2));
}

main().then(() => {
	console.log("done");
});
