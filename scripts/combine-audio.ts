import fs from "fs/promises";
import path from "path";

async function main() {
	console.log("starting");
	const fileA = path.join(process.cwd(), "in", "001.mp3");
	const fileB = path.join(process.cwd(), "in", "002.mp3");
	const audioBufferA = await fs.readFile(fileA);
	const audioBufferB = await fs.readFile(fileB);
	const combinedBuffer = Buffer.concat([audioBufferA, audioBufferB]);
	await fs.writeFile(path.join(process.cwd(), "out", "rainbow-feathers-combined.mp3"), combinedBuffer);
}

main().then(() => {
	console.log("done");
});
