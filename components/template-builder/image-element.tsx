"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, ImageIcon, Trash2, Download, Move } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageElementProps {
  element: any
  zoom: number
  isSelected: boolean
  onSelect: () => void
  onUpdate?: (updates: any) => void
  onDelete?: () => void
  showSettings?: boolean
  onShowSettings?: (show: boolean) => void
}

interface ImageSettings {
  src: string
  alt: string
  width: number
  height: number
  maintainAspectRatio: boolean
  alignment: "left" | "center" | "right"
  rotation: number
}

const defaultImageSettings: ImageSettings = {
  src: "",
  alt: "Image",
  width: 300,
  height: 200,
  maintainAspectRatio: true,
  alignment: "left",
  rotation: 0,
}

export function ImageElement({
  element,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  showSettings = false,
  onShowSettings,
}: ImageElementProps) {
  const [settings, setSettings] = useState<ImageSettings>({
    ...defaultImageSettings,
    ...element.settings,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [templateImages, setTemplateImages] = useState<any[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null)

  // Load template images when component mounts or when settings are shown
  useEffect(() => {
    if (showSettings && templateImages.length === 0) {
      loadTemplateImages()
    }
  }, [showSettings])

  // Update original aspect ratio when image loads
  useEffect(() => {
    if (settings.src && !originalAspectRatio) {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setOriginalAspectRatio(ratio)

        // If this is a new image and maintain aspect ratio is on, update height
        if (settings.maintainAspectRatio) {
          const newHeight = Math.round(settings.width / ratio)
          updateSettings({ height: newHeight })
        }
      }
      img.src = settings.src
    }
  }, [settings.src])

  const loadTemplateImages = async () => {
    setLoadingImages(true)
    try {
      const response = await fetch("/api/images/get-template-images?templateId=demo-template", {
        headers: {
          Authorization: "Bearer demo-token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTemplateImages(data.images || [])
      }
    } catch (error) {
      console.error("Failed to load template images:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const updateSettings = (updates: Partial<ImageSettings>) => {
    const newSettings = { ...settings, ...updates }

    // Handle aspect ratio maintenance
    if (updates.width && settings.maintainAspectRatio && originalAspectRatio) {
      newSettings.height = Math.round(updates.width / originalAspectRatio)
    } else if (updates.height && settings.maintainAspectRatio && originalAspectRatio) {
      newSettings.width = Math.round(updates.height * originalAspectRatio)
    }

    setSettings(newSettings)
    onUpdate?.({ settings: newSettings })
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("templateId", "demo-template")

      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer demo-token",
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        updateSettings({ src: data.url || data.path })
        // Refresh template images list
        loadTemplateImages()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const selectImage = (imageSrc: string) => {
    updateSettings({ src: imageSrc })
  }

  const getImageStyle = () => {
    const shadowStyle = settings.shadow
      ? `${settings.shadowOffsetX}px ${settings.shadowOffsetY}px ${settings.shadowBlur}px ${settings.shadowColor}`
      : "none"

    return {
      width: `${settings.width}px`,
      height: `${settings.height}px`,
      border:
        settings.borderWidth > 0 ? `${settings.borderWidth}px ${settings.borderStyle} ${settings.borderColor}` : "none",
      borderRadius: `${settings.borderRadius}px`,
      opacity: settings.opacity / 100,
      transform: `rotate(${settings.rotation}deg)`,
      boxShadow: shadowStyle,
      objectFit: "cover" as const,
      cursor: "pointer",
    }
  }

  const getContainerStyle = () => {
    const alignmentStyles = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
    }

    return {
      display: "flex",
      justifyContent: alignmentStyles[settings.alignment],
      width: "100%",
      margin: "16px 0",
      position: "relative" as const,
    }
  }

  return (
    <div style={getContainerStyle()}>
      <div
        className={cn("relative group", isSelected && "ring-2 ring-orange-500 ring-offset-2")}
        onClick={() => {
          onSelect()
          onShowSettings?.(true)
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-element-type="image"
        data-element-id={element.id}
      >
        {/* Drag Handle */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 border-2 border-white rounded-full cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Move className="w-2 h-2 text-white" />
        </div>

        {settings.src ? (
          <img src={settings.src || "/placeholder.svg"} alt={settings.alt} style={getImageStyle()} draggable={false} />
        ) : (
          <div
            style={{
              ...getImageStyle(),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f3f4f6",
              border: "2px dashed #d1d5db",
              color: "#6b7280",
            }}
          >
            <ImageIcon className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">Click to add image</p>
            <p className="text-xs">or drag and drop</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Settings Panel Component (separate for reuse)
export function ImageSettingsPanel({
  element,
  onUpdate,
  onDelete,
  onClose,
}: {
  element: any
  onUpdate: (updates: any) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [settings, setSettings] = useState<ImageSettings>({
    ...defaultImageSettings,
    ...element.settings,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [templateImages, setTemplateImages] = useState<any[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null)

  // Load template images when component mounts
  useEffect(() => {
    loadTemplateImages()
  }, [])

  // Update original aspect ratio when image loads
  useEffect(() => {
    if (settings.src && !originalAspectRatio) {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setOriginalAspectRatio(ratio)
      }
      img.src = settings.src
    }
  }, [settings.src])

  const loadTemplateImages = async () => {
    setLoadingImages(true)
    try {
      const response = await fetch("/api/images/get-template-images?templateId=demo-template", {
        headers: {
          Authorization: "Bearer demo-token",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTemplateImages(data.images || [])
      }
    } catch (error) {
      console.error("Failed to load template images:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const updateSettings = (updates: Partial<ImageSettings>) => {
    const newSettings = { ...settings, ...updates }

    // Handle aspect ratio maintenance
    if (updates.width && settings.maintainAspectRatio && originalAspectRatio) {
      newSettings.height = Math.round(updates.width / originalAspectRatio)
    } else if (updates.height && settings.maintainAspectRatio && originalAspectRatio) {
      newSettings.width = Math.round(updates.height * originalAspectRatio)
    }

    setSettings(newSettings)
    onUpdate({ settings: newSettings })
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("templateId", "demo-template")

      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer demo-token",
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        updateSettings({ src: data.url || data.path })
        // Refresh template images list
        loadTemplateImages()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const selectImage = (imageSrc: string) => {
    updateSettings({ src: imageSrc })
  }

  return (
    <div className="w-80 bg-background border-l border-border h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Image Settings</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="source" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="size">Size</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="source" className="space-y-4 mt-0">
              {/* Upload Section */}
              <div>
                <Label className="text-sm font-medium">Upload New Image</Label>
                <div
                  className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Click to upload</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </div>

              {/* Template Images Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Template Images</Label>
                  <Button variant="ghost" size="sm" onClick={loadTemplateImages} disabled={loadingImages}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <ScrollArea className="h-60 border rounded-lg p-2">
                  {loadingImages ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  ) : templateImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {templateImages.map((image, index) => (
                        <div
                          key={index}
                          className={cn(
                            "relative group cursor-pointer border-2 rounded-lg overflow-hidden",
                            settings.src === image.url ? "border-orange-500" : "border-gray-200 hover:border-gray-300",
                          )}
                          onClick={() => selectImage(image.url)}
                        >
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={image.name || `Image ${index + 1}`}
                            className="w-full h-16 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            {settings.src === image.url && (
                              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {image.name || `Image ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <p className="text-sm">No images uploaded yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="size" className="space-y-4 mt-0">
              <div>
                <Label className="text-sm font-medium">Width</Label>
                <div className="mt-2">
                  <Slider
                    value={[settings.width]}
                    onValueChange={([value]) => updateSettings({ width: value })}
                    max={800}
                    min={50}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{settings.width}px</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Height</Label>
                <div className="mt-2">
                  <Slider
                    value={[settings.height]}
                    onValueChange={([value]) => updateSettings({ height: value })}
                    max={600}
                    min={50}
                    step={10}
                    className="w-full"
                    disabled={settings.maintainAspectRatio}
                  />
                  <div className="text-sm text-gray-500 mt-1">{settings.height}px</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Maintain Aspect Ratio</Label>
                <Switch
                  checked={settings.maintainAspectRatio}
                  onCheckedChange={(checked) => updateSettings({ maintainAspectRatio: checked })}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Rotation</Label>
                <div className="mt-2">
                  <Slider
                    value={[settings.rotation]}
                    onValueChange={([value]) => updateSettings({ rotation: value })}
                    max={360}
                    min={-360}
                    step={15}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">{settings.rotation}°</div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
