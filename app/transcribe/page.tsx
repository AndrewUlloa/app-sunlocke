"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Download, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { cn } from "@/lib/utils"
import { Header } from "@/components/ui/header"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
}

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

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

export default function AudioTranscriptionApp() {
  const [file, setFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [actionableItems, setActionableItems] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<string>("")
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please select an audio file smaller than 25MB.",
          duration: 5000,
        })
      } else if (!selectedFile.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid audio file.",
          duration: 5000,
        })
      } else {
        setFile(selectedFile)
        toast({
          title: "File selected",
          description: `${selectedFile.name} has been selected for transcription.`,
          duration: 5000,
        })
      }
    }
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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please select an audio file smaller than 25MB.",
          duration: 5000,
        })
      } else if (!droppedFile.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please drop a valid audio file.",
          duration: 5000,
        })
      } else {
        setFile(droppedFile)
        toast({
          title: "File dropped",
          description: `${droppedFile.name} has been selected for transcription.`,
          duration: 5000,
        })
      }
    }
  }

  const handleTranscribe = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append("audio", file)
    if (prompt) {
      formData.append("prompt", prompt)
    }

    try {
      // Step 1: Transcribe the audio
      console.log("Sending transcription request:", file.name, prompt)
      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const transcriptionData = await transcriptionResponse.json()
      console.log("Received transcription:", transcriptionData)
      setTranscription(transcriptionData.text)

      // Step 2: Extract actionable items
      console.log("Sending extraction request:", transcriptionData.text)
      const extractionResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription: transcriptionData.text }),
      })

      if (!extractionResponse.ok) {
        const errorData = await extractionResponse.json()
        throw new Error(errorData.error || "Extraction failed")
      }

      const extractionData = await extractionResponse.json()
      console.log("Received extraction:", extractionData)
      setActionableItems(extractionData.actionableItems)

      toast({
        title: "Process complete",
        description: "Your audio has been successfully transcribed and analyzed.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error during process:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError(errorMessage)
      toast({
        title: "Process failed",
        description: errorMessage,
        duration: 5000,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!transcription) return

    try {
      // Create a Blob from the transcription text
      const blob = new Blob([transcription], { type: "text/plain;charset=utf-8" })

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob)

      // Create a link element and trigger the download
      const link = document.createElement("a")
      link.href = url
      link.download = "transcription.txt"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up by revoking the Blob URL
      URL.revokeObjectURL(url)

      toast({
        title: "Transcription downloaded",
        description: "Your transcription has been downloaded as a text file.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the transcription.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  return (
    <AnimatedBackground>
      <div className="min-h-[100dvh] container mx-auto flex flex-col justify-center">
        <Header />
        <div className="flex-1 w-full flex items-center justify-center">
          <motion.div 
            className="w-full max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-[48px] leading-[125%] text-center font-eudoxusSansBold">Audio Transcription</CardTitle>
              </CardHeader>
            </Card>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <Card className="mb-6">
              <CardContent className={cn(
                "border border-white bg-white/50",
                "px-[40px] py-[20px]",
                "md:px-[120px] md:py-[40px] md:gap-5",
                "rounded-xl"
              )}>
                <motion.div className="mb-4" variants={itemVariants}>
                  <div className="mb-4">
                    <Label className="block text-sm mb-2 font-eudoxusSansMedium">
                      Upload Audio File (Max 25MB)
                    </Label>
                  </div>
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
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                    >
                      <motion.div
                        className="flex flex-col items-center justify-center pt-5 pb-6"
                        initial={{ scale: 1 }}
                        animate={{ scale: isDragging ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-eudoxusSansMedium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, OGG, FLAC, M4A, or WEBM (Max 25MB)</p>
                      </motion.div>
                      <input
                        id="audio-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept="audio/mp4, audio/x-m4a, .m4a"
                        className="hidden"
                      />
                    </label>
                  </motion.div>
                  <AnimatePresence>
                    {file && (
                      <motion.p
                        className="mt-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {file.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div className="mb-4" variants={itemVariants}>
                  <Label htmlFor="prompt" className="block text-sm mb-2 font-eudoxusSansMedium">
                    Prompt (Optional)
                  </Label>
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Provide context or specify how to spell unfamiliar words"
                    className="w-full"
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  initial="idle"
                  animate={isLoading || !file ? "disabled" : "idle"}
                  whileHover={!isLoading && file ? "hover" : "disabled"}
                  whileTap={!isLoading && file ? "tap" : "disabled"}
                  whileFocus="focus"
                  className="flex justify-center"
                >
                  <Button onClick={handleTranscribe} disabled={!file || isLoading}>
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
                </motion.div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {transcription && (
                <motion.div
                  key="transcription-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="font-eudoxusSansBold">Transcription and Actionable Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={transcription}
                        readOnly
                        className="w-full h-64 mb-4 transition-shadow focus:outline-none"
                      />
                      <Button onClick={handleDownload}>
                        <Download/>
                        Download Transcription
                      </Button>

                      <div className="mt-6">
                        <h3 className="text-lg mb-2 font-eudoxusSansBold">Actionable Items</h3>
                        <Card className="p-4">
                          <pre className="whitespace-pre-wrap text-sm">{actionableItems}</pre>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  )
}

