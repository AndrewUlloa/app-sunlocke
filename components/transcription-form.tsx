import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Download, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes

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
  const { toast } = useToast()

  const getTotalSize = (fileList: File[]) => {
    return fileList.reduce((total, file) => total + file.size, 0)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const totalSize = getTotalSize([...files, ...selectedFiles])
    
    if (totalSize > MAX_FILE_SIZE) {
      toast({
        title: "Files too large",
        description: "Total size of all files must be less than 25MB.",
        duration: 5000,
      })
      return
    }

    const invalidFiles = selectedFiles.filter(file => !file.type.startsWith("audio/"))
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type(s)",
        description: "Please select only valid audio files.",
        duration: 5000,
      })
      return
    }

    setFiles(prevFiles => [...prevFiles, ...selectedFiles])
    toast({
      title: "Files selected",
      description: `${selectedFiles.length} file(s) have been selected for transcription.`,
      duration: 5000,
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
    const totalSize = getTotalSize([...files, ...droppedFiles])
    
    if (totalSize > MAX_FILE_SIZE) {
      toast({
        title: "Files too large",
        description: "Total size of all files must be less than 25MB.",
        duration: 5000,
      })
      return
    }

    const invalidFiles = droppedFiles.filter(file => !file.type.startsWith("audio/"))
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type(s)",
        description: "Please drop only valid audio files.",
        duration: 5000,
      })
      return
    }

    setFiles(prevFiles => [...prevFiles, ...droppedFiles])
    toast({
      title: "Files dropped",
      description: `${droppedFiles.length} file(s) have been selected for transcription.`,
      duration: 5000,
    })
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleTranscribe = async () => {
    if (!files.length) return

    setIsLoading(true)
    const formData = new FormData()
    files.forEach(file => formData.append("audio", file))
    if (prompt) {
      formData.append("prompt", prompt)
    }

    try {
      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const transcriptionData = await transcriptionResponse.json()
      setTranscription(transcriptionData.combinedText)

      const extractionResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription: transcriptionData.combinedText }),
      })

      if (!extractionResponse.ok) {
        const errorData = await extractionResponse.json()
        throw new Error(errorData.error || "Extraction failed")
      }

      const extractionData = await extractionResponse.json()
      setActionableItems(extractionData.actionableItems)

      toast({
        title: "Process complete",
        description: "Your audio files have been successfully transcribed and analyzed.",
        duration: 5000,
      })
    } catch (error) {
      console.error("Error during process:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
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
      const blob = new Blob([transcription], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "transcription.txt"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
              Upload Audio Files (Total max 25MB)
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
                  accept="audio/mp4, audio/x-m4a, .m4a"
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
              className="w-full text-xs md:text-sm"
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
                      Actionable Items
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
