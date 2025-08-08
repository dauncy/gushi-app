import { googleGenAI } from "@/ai/google";
import { Buffer } from "buffer";
import fs from "fs/promises";
import path from "path";

const maleVoice = "Sadachbia"; // "Puck";
const femaleVoice = "Kore";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const genederToVoice = (gender: "male" | "female") => {
	return gender === "male" ? maleVoice : femaleVoice;
};

const getBasePrompt = ({ voices }: { voices: { voice: string; description: string }[] }) => {
	return `read aloud like parents reciting an exciting bedtime story for their kids. 
  The parents do fun an different voices for each character. 
  Tonight's story has four characters
  **Narrator** story narrator. keeps the pace and flow of the story.
  ${voices.map((v) => `**${v.voice}** ${v.description}`).join("\n")}
  `;
};
const pcmToWav = (pcmBuf: Buffer, sampleRate = 24000) => {
	const numChannels = 1;
	const bitsPerSample = 16;
	const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
	const blockAlign = (numChannels * bitsPerSample) / 8;
	const wavHeader = Buffer.alloc(44);
	wavHeader.write("RIFF", 0); // ChunkID
	wavHeader.writeUInt32LE(36 + pcmBuf.length, 4); // ChunkSize
	wavHeader.write("WAVE", 8); // Format
	wavHeader.write("fmt ", 12); // Sub-chunk1ID
	wavHeader.writeUInt32LE(16, 16); // Sub-chunk1Size (PCM)
	wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
	wavHeader.writeUInt16LE(numChannels, 22); // NumChannels
	wavHeader.writeUInt32LE(sampleRate, 24); // SampleRate
	wavHeader.writeUInt32LE(byteRate, 28); // ByteRate
	wavHeader.writeUInt16LE(blockAlign, 32); // BlockAlign
	wavHeader.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
	wavHeader.write("data", 36); // Sub-chunk2ID
	wavHeader.writeUInt32LE(pcmBuf.length, 40); // Sub-chunk2Size
	return Buffer.concat([wavHeader, pcmBuf]);
};

async function generateAudioChunk() {}

async function generateAudio() {
	console.log("starting story generation");
	const transcriptPath = path.join(process.cwd(), "out", "test-transcript.json");
	const voiceDescriptionsPath = path.join(process.cwd(), "out", "test-descriptions.json");
	const transcript: { body: string; voiceInstructions: string; speaker: string; gender: "male" | "female" }[] =
		JSON.parse(await fs.readFile(transcriptPath, "utf-8"));
	const voiceDescriptions: { voice: string; description: string }[] = JSON.parse(
		await fs.readFile(voiceDescriptionsPath, "utf-8"),
	);
	const storyBuffers: Buffer[] = [];

	let index = 0;
	for await (const segment of transcript) {
		console.log("sleeping for 15 seconds bc rate limits");
		await sleep(15000);
		const voiceDescription =
			segment.speaker.toLowerCase() === "narrator"
				? "clear, steady cadence; mid-low pitch; speedy but measured pace"
				: voiceDescriptions.find((v) => v.voice.toLowerCase() === segment.speaker.toLowerCase())?.description;
		const text = `Say in the following manner - ${voiceDescription} -, ${segment.speaker.toLowerCase() === "narrator" ? "" : segment.voiceInstructions} ${segment.speaker.toLowerCase() === "narrator" ? "" : "speaking at about 170 words per minute."} "${segment.body}"`;
		const googleVoice = genederToVoice(segment.gender);
		console.log(`synthesizing segment #${index}: `, {
			googleVoice,
			speaker: segment.speaker,
			body: segment.body,
			text,
		});
		const response = await googleGenAI.models.generateContent({
			model: "gemini-2.5-pro-preview-tts",
			contents: [{ parts: [{ text }] }],
			config: {
				responseModalities: ["AUDIO"],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: googleVoice },
					},
				},
			},
		});
		const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
		if (!data) {
			console.error("no data");
			continue;
		}
		const pcmBuffer = Buffer.from(data, "base64");
		storyBuffers.push(pcmBuffer);
		index++;
	}
	const finalBuffer = Buffer.concat(storyBuffers);
	const wavBuffer = pcmToWav(finalBuffer);
	await fs.writeFile(path.join(process.cwd(), "out", "test-audio.wav"), wavBuffer);
}

generateAudio().then(() => {
	console.log("done");
});
