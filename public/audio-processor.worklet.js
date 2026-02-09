// public/audio-processor.worklet.js

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // Check if we have input audio
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0]; // Mono channel

    // Accumulate samples into our buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Calculate volume level (RMS)
        let sum = 0;
        for (let j = 0; j < this.bufferSize; j++) {
          sum += this.buffer[j] * this.buffer[j];
        }
        const rms = Math.sqrt(sum / this.bufferSize);
        const volumeLevel = rms * 100;

        // Send audio data and volume to main thread
        this.port.postMessage({
          type: 'audio',
          audioData: this.buffer.slice(), // Copy the buffer
          volumeLevel: volumeLevel
        });

        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);