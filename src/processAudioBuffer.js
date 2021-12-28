/**
 * Config for calculating frequency data
 * @type {{fftResolution: number, smoothingTimeConstant: number, processorBufferSize: number}}
 */
const config = {
    /**
     * The resolution of the FFT calculations
     * Higher value means higher resolution decibel domain..
     */
    fftResolution: 4096,
    /**
     * Smoothing value for FFT calculations
     */
    smoothingTimeConstant: 0.1,
    /**
     * The size of processing buffer,
     * determines how often FFT is run
     * Bigger Buffer reduces the amounts of FFTs calculated
     */
    processorBufferSize: 2048,
};

function remapDataToTwoDimensionalMatrix(data, strideSize, tickCount) {
    /**
     * @type {Array<number>}
     */
    const arr = Array.from(data);

    // Map the one dimensional data to two dimensional data where data goes from right to left
    // [1, 2, 3, 4, 5, 6]
    // -> strideSize = 2
    // -> rowCount = 3
    // maps to
    // [1, 4]
    // [2, 5]
    // [3, 6]
    const output = Array.from(Array(strideSize)).map(() =>
        Array.from(Array(tickCount))
    );

    for (let row = 0; row < strideSize; row += 1) {
        for (let col = 0; col < tickCount; col += 1) {
            output[row][col] = arr[col * strideSize + row];
        }
    }

    return output;
}

/**
 * This function is used to calculate frequency data over the whole audio file.
 * An OfflineAudioContext is created to analyse the whole audio. See https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext
 * Calculation is done asynchronous.
 * Function createScriptProcessor() is deprecated and should be replaced by worker script.
 *
 * @param audioBuffer Audio buffer over which the frequency data should be calculated
 * @return {Promise<{duration, channelDbRanges: *[], tickCount: number, channels: *[], maxFreq: number, stride: number}>} Promise with frequency data
 */
async function processWaveForm(audioBuffer) {
    // Create a new OfflineAudioContext with information from the pre-created audioBuffer
    // The OfflineAudioContext can be used to process a audio file as fast as possible.
    // Normal AudioContext would process the file at the speed of playback.
    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    // Create a new source, in this case we have a AudioBuffer to create it for, so we create a buffer source

    const source = offlineCtx.createBufferSource();

    // Set the buffer to the audio buffer we are using
    source.buffer = audioBuffer;
    // Set source channel count to the audio buffer channel count, if this wasn't set, the source would default to 2 channels.
    source.channelCount = audioBuffer.numberOfChannels;

    // We want to create spectrogram for each channel in the buffer, so we need to separate the channels to separate outputs.
    const splitter = offlineCtx.createChannelSplitter(source.channelCount);

    // Create a analyzer node for the full context
    const generalAnalyzer = offlineCtx.createAnalyser();

    generalAnalyzer.fftSize = config.fftResolution;
    generalAnalyzer.smoothingTimeConstant = config.smoothingTimeConstant;

    // Prepare buffers and analyzers for each channel
    const channelFFtDataBuffers = [];

    const channelDbRanges = [];

    const analyzers = [];

    for (let i = 0; i < source.channelCount; i += 1) {
        channelFFtDataBuffers[i] = new Uint8Array(
            (audioBuffer.length / config.processorBufferSize) *
            (config.fftResolution / 2)
        );
        // Setup analyzer for this channel
        analyzers[i] = offlineCtx.createAnalyser();
        analyzers[i].smoothingTimeConstant = config.smoothingTimeConstant;
        analyzers[i].fftSize = config.fftResolution;
        // Connect the created analyzer to a single channel from the splitter
        splitter.connect(analyzers[i], i);
        channelDbRanges.push({
            minDecibels: analyzers[i].minDecibels,
            maxDecibels: analyzers[i].maxDecibels,
        });
    }
    // Script processor is used to process all of the audio data in fftSize sized blocks
    // Script processor is a deprecated API but the replacement APIs have really poor browser support
    offlineCtx.createScriptProcessor =
        offlineCtx.createScriptProcessor || offlineCtx.createJavaScriptNode;
    const processor = offlineCtx.createScriptProcessor(
        config.processorBufferSize,
        1,
        1
    );

    let offset = 0;

    processor.onaudioprocess = (ev) => {
        // Run FFT for each channel
        for (let i = 0; i < source.channelCount; i += 1) {
            const freqData = new Uint8Array(
                channelFFtDataBuffers[i].buffer,
                offset,
                analyzers[i].frequencyBinCount
            );

            analyzers[i].getByteFrequencyData(freqData);
        }
        offset += generalAnalyzer.frequencyBinCount;
    };
    // Connect source buffer to correct nodes,
    // source feeds to:
    // splitter, to separate the channels
    // processor, to do the actual processing
    // generalAanalyzer, to get collective information
    source.connect(splitter);
    source.connect(processor);
    processor.connect(offlineCtx.destination);
    source.connect(generalAnalyzer);
    // Start the source, other wise start rendering would not process the source
    source.start(0);

    console.log('Started analysing');

    // Process the audio buffer
    await offlineCtx.startRendering();

    const stride = config.fftResolution / 2;
    const tickCount = Math.ceil(audioBuffer.length / config.processorBufferSize);
    const maxFreq = offlineCtx.sampleRate / 2; // max freq is always half the sample rate
    const duration = audioBuffer.duration;
    const channels = channelFFtDataBuffers;
    let channelData = new Array();

    console.log(audioBuffer.length);

    for (let i = 0; i < channels.length; i++) {
        const remappedData = remapDataToTwoDimensionalMatrix(
            channels[i],
            stride,
            tickCount
        );
            //.slice(0, stride / 2);

        channelData[i] = remappedData.slice();
    }

    console.log(channelData);

    return {
        channels: channels,
        channelDbRanges,
        stride: stride,
        tickCount: tickCount,
        maxFreq: maxFreq,
        duration: duration,
    };
}

export { processWaveForm };