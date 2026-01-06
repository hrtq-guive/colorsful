import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/captures');

const processGif = async (file) => {
    const filePath = path.join(OUTPUT_DIR, file);
    const tempPath = path.join(OUTPUT_DIR, `temp_${file}`);

    try {
        // 1. Check Duration
        const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
        const duration = parseFloat(stdout.trim());

        if (duration > 3.0) {
            // console.log(`Skipping ${file} (Duration: ${duration}s, already processed?)`);
            return;
        }

        console.log(`Processing ${file} (Duration: ${duration}s)...`);

        // 2. Convert to Ping-Pong
        // [0:v]split[f][r];[r]reverse[rev];[f][rev]concat=n=2:v=1[out]
        // We need to re-generate palette for best quality on the new sequence

        const filter = "split[v1][v2];[v2]reverse[rev];[v1][rev]concat=n=2:v=1,fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";

        await execPromise(`ffmpeg -i "${filePath}" -vf "${filter}" -loop 0 -y "${tempPath}"`);

        // 3. Overwrite original
        if (fs.existsSync(tempPath)) {
            fs.renameSync(tempPath, filePath);
            console.log(`-> Converted ${file} successfully.`);
        }

    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
};

(async () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
        console.error("Directory not found:", OUTPUT_DIR);
        return;
    }

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('_45s.gif'));
    console.log(`Found ${files.length} GIFs. Checking for processing candidates...`);

    // Process in chunks to avoid spawning too many ffmpeg processes
    const CHUNK_SIZE = 5;
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(f => processGif(f)));
    }

    console.log("Ping-Pong conversion complete!");
})();
