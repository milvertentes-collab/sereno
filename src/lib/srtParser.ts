export interface Subtitle {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

export function parseSRT(data: string): Subtitle[] {
    const subtitles: Subtitle[] = [];
    const blocks = data.trim().split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const id = parseInt(lines[0]);
            const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

            if (timeMatch) {
                const startTime = timeToSeconds(timeMatch[1]);
                const endTime = timeToSeconds(timeMatch[2]);
                const text = lines.slice(2).join('\n').trim();

                subtitles.push({ id, startTime, endTime, text });
            }
        }
    }

    return subtitles;
}

function timeToSeconds(time: string): number {
    const [hours, minutes, secondsAndMillis] = time.split(':');
    const [seconds, millis] = secondsAndMillis.split(',');
    return (
        parseInt(hours) * 3600 +
        parseInt(minutes) * 60 +
        parseInt(seconds) +
        parseInt(millis) / 1000
    );
}
