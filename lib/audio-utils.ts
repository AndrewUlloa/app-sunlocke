import { toast } from "@/lib/toast"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes
const CHUNK_DURATION = 10 * 60 // 10 minutes in seconds

export async function splitAudioIntoChunks(file: File): Promise<File[]> {
  try {
    const fileSizeMB = file.size / (1024 * 1024)
    console.log(`Original file ${file.name} size: ${fileSizeMB.toFixed(1)}MB`)

    // If file is under 25MB limit, return as is
    if (file.size <= MAX_FILE_SIZE) {
      console.log(`File ${file.name} is under ${MAX_FILE_SIZE / (1024 * 1024)}MB limit, no splitting needed`)
      return [file]
    }

    console.log(`File ${file.name} is over ${MAX_FILE_SIZE / (1024 * 1024)}MB, needs splitting`)

    // For files over 25MB, decode and split
    const audioContext = new AudioContext()
    const arrayBuffer = await file.arrayBuffer()
    const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    console.log(`Audio duration: ${originalAudioBuffer.duration.toFixed(1)} seconds`)
    console.log(`Sample rate: ${originalAudioBuffer.sampleRate}Hz, Channels: ${originalAudioBuffer.numberOfChannels}`)

    // 1) Single pass offline render (to 16kHz, mono) for the entire file
    const sampleRate = 16000
    const totalSamples = Math.ceil(originalAudioBuffer.duration * sampleRate)

    console.log(`Converting to 16kHz mono format...`)
    const offlineContext = new OfflineAudioContext({
      numberOfChannels: 1, // Force mono
      length: totalSamples,
      sampleRate
    })

    const source = offlineContext.createBufferSource()
    source.buffer = originalAudioBuffer
    source.connect(offlineContext.destination)
    source.start(0, 0, originalAudioBuffer.duration)

    console.log(`Resampling entire audio to 16kHz...`)
    const renderedBuffer = await offlineContext.startRendering()
    console.log(`Done resampling. New sample rate: ${renderedBuffer.sampleRate}Hz, Channels: ${renderedBuffer.numberOfChannels}`)

    // 2) Now split the single big 16kHz buffer into chunks
    const numberOfChunks = Math.ceil(originalAudioBuffer.duration / CHUNK_DURATION)
    console.log(`Splitting into ${numberOfChunks} chunks of ~${CHUNK_DURATION / 60} minutes each`)

    const chunks: File[] = []
    const samples = renderedBuffer.getChannelData(0)

    for (let i = 0; i < numberOfChunks; i++) {
      console.log(`Processing chunk ${i + 1}/${numberOfChunks}...`)
      
      const startTimeSec = i * CHUNK_DURATION
      const endTimeSec = Math.min((i + 1) * CHUNK_DURATION, originalAudioBuffer.duration)
      const chunkDuration = endTimeSec - startTimeSec

      // compute start/end in samples
      const startSampleIdx = Math.floor(startTimeSec * sampleRate)
      const endSampleIdx = Math.floor(endTimeSec * sampleRate)
      const subBufferLength = endSampleIdx - startSampleIdx

      console.log(`Chunk ${i + 1} duration: ${chunkDuration.toFixed(1)} seconds`)

      // Create a new AudioBuffer for the chunk
      const chunkBuffer = audioContext.createBuffer(
        1,            // mono
        subBufferLength,
        sampleRate
      )

      // Copy the slice of samples into the chunk buffer
      chunkBuffer.copyToChannel(samples.subarray(startSampleIdx, endSampleIdx), 0)

      // Convert chunk to WAV
      const wavBlob = await audioBufferToWav(chunkBuffer)
      const chunkFile = new File(
        [wavBlob],
        `${file.name.replace(/\.[^/.]+$/, '')}_part${i + 1}.wav`,
        { type: 'audio/wav' }
      )

      const chunkSizeMB = chunkFile.size / (1024 * 1024)
      console.log(`Chunk ${i + 1} size: ${chunkSizeMB.toFixed(2)}MB`)

      if (chunkSizeMB > 25) {
        throw new Error(`Chunk ${i + 1} is too large (${chunkSizeMB.toFixed(1)}MB). Try using a shorter duration.`)
      }

      chunks.push(chunkFile)
      console.log(`Chunk ${i + 1}/${numberOfChunks} complete`)
    }

    console.log(`Successfully split ${file.name} into ${chunks.length} chunks`)
    return chunks
  } catch (error) {
    console.error("Error splitting audio:", error)
    toast.error({
      message: "Audio Processing Error",
      description: error instanceof Error ? error.message : "Failed to split audio file. Please try again."
    })
    throw error
  }
}

function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  // same implementation as before
  const length = buffer.length * 2 // 16-bit samples
  const data = new DataView(new ArrayBuffer(44 + length))

  // Write WAV header
  writeString(data, 0, 'RIFF')
  data.setUint32(4, 36 + length, true)
  writeString(data, 8, 'WAVE')
  writeString(data, 12, 'fmt ')
  data.setUint32(16, 16, true)
  data.setUint16(20, 1, true) // PCM
  data.setUint16(22, 1, true) // Mono
  data.setUint32(24, buffer.sampleRate, true)
  data.setUint32(28, buffer.sampleRate * 2, true)
  data.setUint16(32, 2, true)
  data.setUint16(34, 16, true)
  writeString(data, 36, 'data')
  data.setUint32(40, length, true)

  // Write PCM samples
  const samples = buffer.getChannelData(0)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    data.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return Promise.resolve(new Blob([data.buffer], { type: 'audio/wav' }))
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}