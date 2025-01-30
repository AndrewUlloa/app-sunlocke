"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Download, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { toast } from "sonner"
import { splitAudioIntoChunks } from "@/lib/audio-utils"

const uploadAreaVariants = {
  idle: {
    scale: 1,
    backgroundColor: "hsl(var(--background))",
    borderColor: "hsl(var(--border))",
  },
  hover: {
    scale: 1.02,
    backgroundColor: "hsl(var(--accent))",
    borderColor: "hsl(var(--primary))",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  focus: {
    scale: 1,
    backgroundColor: "hsl(var(--accent))",
    borderColor: "hsl(var(--primary))",
    boxShadow: "0 0 0 2px hsl(var(--primary) / 0.2)",
  },
  drag: {
    scale: 1.03,
    backgroundColor: "hsl(var(--accent))",
    borderColor: "hsl(var(--primary))",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
}

export function TranscriptionForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [files, setFiles] = useState<File[]>([])
  const [transcription, setTranscription] = useState<string>("")
  const [actionableItems, setActionableItems] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [prompt, setPrompt] = useState<string>("")
  const [usedSummary, setUsedSummary] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    const invalidFiles = selectedFiles.filter(file => !file.type.startsWith("audio/"))
    if (invalidFiles.length > 0) {
      toast.error("Invalid file type(s)", {
        description: "Please select only valid audio files."
      })
      return
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles])
    toast.success("Files selected", {
      description: `${selectedFiles.length} file(s) have been selected for transcription.`
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    const invalidFiles = droppedFiles.filter(file => !file.type.startsWith("audio/"))
    if (invalidFiles.length > 0) {
      toast.error("Invalid file type(s)", {
        description: "Please drop only valid audio files."
      })
      return
    }

    setFiles(prevFiles => [...prevFiles, ...droppedFiles])
    toast.success("Files dropped", {
      description: `${droppedFiles.length} file(s) have been selected for transcription.`
    })
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleTranscribe = async () => {
    if (!files.length) return

    setIsLoading(true)
    setUsedSummary(false)
    let allTranscriptions = ""
    
    const loadingToastId = toast.loading("Processing audio files...")
    
    try {
      // Process each file
      for (const file of files) {
        // Split into chunks if needed
        toast.loading(`Splitting ${file.name} into chunks...`, {
          id: loadingToastId
        })
        const chunks = await splitAudioIntoChunks(file)
        console.log(`Processing ${file.name}: split into ${chunks.length} chunks`)
        
        // Process each chunk sequentially
        const chunkTranscriptions = []
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          toast.loading(`Transcribing ${file.name} - Chunk ${i + 1}/${chunks.length}...`, {
            id: loadingToastId
          })
          console.log(`Processing chunk ${i + 1}/${chunks.length} of ${file.name}`)
          
          // Try the default route first (transcribe)
          try {
            const formData = new FormData()
            formData.append("audio", chunk)
            if (prompt) {
              formData.append("prompt", prompt)
            }

            const transcriptionResponse = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            })

            if (!transcriptionResponse.ok) {
              const errorData = await transcriptionResponse.json()
              throw new Error(errorData.error || "Transcription failed")
            }

            const transcriptionData = await transcriptionResponse.json()
            chunkTranscriptions.push(transcriptionData.combinedText)
            
            // Update progress in the UI
            setTranscription(prev => {
              const newText = prev + (prev ? "\n" : "") + `[Processing ${file.name} - Chunk ${i + 1}/${chunks.length}]\n` + transcriptionData.combinedText
              return newText
            })

            toast.success(`Completed chunk ${i + 1}/${chunks.length} of ${file.name}`)
          } catch (error) {
            console.log(`Default route failed, trying Whisper fallback for chunk ${i + 1}...`, error)
            
            toast.loading(`Using fallback service for ${file.name} - Chunk ${i + 1}...`, {
              id: loadingToastId
            })

            // If default route fails, try the Whisper fallback route
            const formData = new FormData()
            formData.append("audio", chunk)
            if (prompt) {
              formData.append("prompt", prompt)
            }

            const fallbackResponse = await fetch("/api/whisper", {
              method: "POST",
              body: formData,
            })

            if (!fallbackResponse.ok) {
              const errorData = await fallbackResponse.json()
              throw new Error(errorData.error || "Transcription failed on Whisper fallback route")
            }

            const fallbackData = await fallbackResponse.json()
            chunkTranscriptions.push(fallbackData.combinedText)
            
            // Update progress in the UI
            setTranscription(prev => {
              const newText = prev + (prev ? "\n" : "") + `[Processing ${file.name} - Chunk ${i + 1}/${chunks.length} (Whisper Fallback)]\n` + fallbackData.combinedText
              return newText
            })

            toast.success(`Completed chunk ${i + 1}/${chunks.length} of ${file.name} (Fallback)`)
          }
        }
        
        // Combine chunks for this file
        const fileTranscription = chunkTranscriptions.join("\n\n")
        if (allTranscriptions) allTranscriptions += "\n\n"
        allTranscriptions += `[${file.name}]\n${fileTranscription}`

        toast.success(`Completed processing ${file.name}`)
      }

      // Set the final combined transcription
      setTranscription(allTranscriptions)

      // Process the complete transcription with the extract API
      toast.loading("Extracting actionable items...", {
        id: loadingToastId
      })

      const extractionResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription: allTranscriptions }),
      })

      if (!extractionResponse.ok) {
        const errorData = await extractionResponse.json()
        throw new Error(errorData.error || "Extraction failed")
      }

      const extractionData = await extractionResponse.json()
      setActionableItems(extractionData.actionableItems)
      setUsedSummary(extractionData.usedSummary)

      toast.success("Process complete", {
        description: "Your audio files have been successfully transcribed and analyzed.",
        id: loadingToastId
      })
    } catch (error) {
      console.error("Error during process:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error("Process failed", {
        description: errorMessage,
        id: loadingToastId
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!transcription) return

    const loadingToastId = toast.loading("Preparing download...")

    try {
      const blob = new Blob([transcription], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "transcription.txt"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Transcription downloaded", {
        description: "Your transcription has been downloaded as a text file.",
        id: loadingToastId
      })
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Download failed", {
        description: "There was an error downloading the transcription.",
        id: loadingToastId
      })
    }
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <Card className="bg-transparent shadow-red-card-default transition ease-in-out duration-[400ms] hover:shadow-red-card-hover">
        <CardContent className={cn(
          "flex flex-col items-center gap-5",
          "border border-white bg-white/50",
          "px-[40px] py-[20px]",
          "md:px-[120px] md:py-[40px] md:gap-5",
          "rounded-xl"
        )}>
          {/* Upload Section */}
          <div className="w-full">
            <Label className="block text-[14px] mb-2 font-eudoxusSansMedium md:text-base">
              Upload Audio Files
            </Label>
            <motion.div
              className="flex items-center justify-center w-full"
              variants={uploadAreaVariants}
              initial="idle"
              animate={isDragging ? "drag" : "idle"}
              whileHover="hover"
              whileFocus="focus"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center w-full h-48 md:h-64 border-2 border-dashed rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              >
                <motion.div
                  className="flex flex-col items-center justify-center pt-5 pb-6"
                  initial={{ scale: 1 }}
                  animate={{ scale: isDragging ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Upload className={`w-8 h-8 mb-3 md:w-10 md:h-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mb-2 text-xs md:text-sm text-muted-foreground">
                    <span className="font-eudoxusSansMedium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">MP3, WAV, OGG, FLAC, M4A, or WEBM</p>
                </motion.div>
                <input
                  id="audio-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="audio/mp3, audio/wav, audio/ogg, audio/flac, audio/mp4, audio/x-m4a, audio/webm, .mp3, .wav, .ogg, .flac, .m4a, .webm"
                  className="hidden"
                  multiple
                />
              </label>
            </motion.div>

            {/* Selected Files List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xs md:text-sm font-eudoxusSansMedium mb-2">Selected Files:</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <span className="text-xs md:text-sm truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2"
                        >
                          ×
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prompt Input */}
          <div className="w-full">
            <Label htmlFor="prompt" className="block text-[14px] mb-2 font-eudoxusSansMedium md:text-base">
              Prompt (Optional)
            </Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Provide context or specify how to spell unfamiliar words"
              className="w-full text-base"
            />
          </div>

          {/* Transcribe Button */}
          <div className="w-full flex justify-center">
            <Button 
              onClick={handleTranscribe} 
              disabled={!files.length || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Transcribe and Analyze Audio
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {transcription && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="block text-[14px] mb-2 font-eudoxusSansMedium md:text-base">
                      Transcription
                    </Label>
                    <Textarea
                      value={transcription}
                      readOnly
                      className="w-full h-48 md:h-64 mb-2 text-xs md:text-sm"
                    />
                    <div className="w-full flex justify-center">
                      <Button 
                        onClick={handleDownload} 
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Transcription
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-[14px] mb-2 font-eudoxusSansMedium md:text-base">
                      Actionable Items {usedSummary && <span className="text-xs text-muted-foreground ml-2">(Based on summarized transcription)</span>}
                    </Label>
                    <Card className="p-3 md:p-4">
                      <pre className="whitespace-pre-wrap text-[10px] md:text-sm">{actionableItems}</pre>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
} 
