/* RECORDING AUDIO */

const fileName = 'audio.wav';
// Import module.
const AudioRecorder = require('node-audiorecorder');
const fs = require('fs');

// Options is an optional parameter for the constructor call.
// If an option is not given the default value, as seen below, will be used.
const options = {
    program: `arecord`,     // Which program to use, either `arecord`, `rec`, or `sox`.
    device: null,       // Recording device to use.

    bits: 16,           // Sample size. (only for `rec` and `sox`)
    channels: 1,        // Channel count.
    encoding: `signed-integer`,  // Encoding type. (only for `rec` and `sox`)
    format: `S16_LE`,   // Encoding type. (only for `arecord`)
    rate: 16000,        // Sample rate.
    type: `wav`,        // Format type.

    // Following options only available when using `rec` or `sox`.
    silence: 2,         // Duration of silence in seconds before it stops recording.
    thresholdStart: 0.5,  // Silence threshold to start recording.
    thresholdStop: 0.5,   // Silence threshold to stop recording.
    keepSilence: true   // Keep the silence in the recording.
};
// Optional parameter intended for debugging.
// The object has to implement a log and warn function.
const logger = console;

// Create an instance.
let audioRecorder = new AudioRecorder(options, logger);


/* LISTEN FOR SPACE BAR */

var keypress = require('keypress');

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

var isRecording = false;
// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
    if (key && key.name == 'space') {
        if (!isRecording) {
            isRecording = true;
            const fileStream = fs.createWriteStream(fileName, { encoding: `binary` });
            audioRecorder.start().stream().pipe(fileStream);

            // Log information on the following events
            audioRecorder.stream().on(`close`, function (code) {
                console.warn(`Recording closed. Exit code: `, code);
            });
            audioRecorder.stream().on(`end`, function () {
                console.warn(`Recording ended.`);
            });
            audioRecorder.stream().on(`error`, function () {
                console.warn(`Recording error.`);
            });

        } else {
            isRecording = false;
            audioRecorder.stop()
            console.log("sending audio to cloud speech api...");
            parseAudio(fileName);
        }
    }
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();


/* PARSING AUDIO */

async function parseAudio(fileName) {
    // Imports the Google Cloud client library
    const speech = require('@google-cloud/speech');
    const fs = require('fs');

    // Creates a client
    const client = new speech.SpeechClient();

    // Reads a local audio file and converts it to base64
    const file = fs.readFileSync(fileName);
    const audioBytes = file.toString('base64');

    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
        content: audioBytes,
    };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };
    const request = {
        audio: audio,
        config: config,
    };

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Transcription: ${transcription}`);
}