"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/ui/color-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Upload, RefreshCw, X, Lock, Unlock, Copy } from "lucide-react"

interface DesignElement {
  id: string
  type: "rectangle" | "circle" | "triangle" | "line" | "image"
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  zIndex: number
  visible: boolean
  locked: boolean
  style: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    opacity?: number
    borderRadius?: number
    src?: string
  }
}

interface DesignElementProps {
  element: DesignElement
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DesignElement>) => void
  onDelete: () => void
  zoom: number
}

export function DesignElementComponent({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  zoom,
}: DesignElementProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 })
  const [resizeDirection, setResizeDirection] = useState("") 
  const [rotateStart, setRotateStart] = useState(0)
  const [initialRotation, setInitialRotation] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (element.locked) return
    e.preventDefault()
    e.stopPropagation()
    onSelect()

    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return

    const target = e.target as HTMLElement
    // Check if the click is on the rotate handle or one of its children
    const isRotateHandle = target.classList.contains("rotate-handle") || 
                         target.closest(".rotate-handle") !== null
    const isResizeHandle = target.classList.contains("resize-handle")
    
    if (isResizeHandle) {
      setIsResizing(true)
      setResizeDirection(target.dataset.direction || "")
      setResizeStart({ width: element.size.width, height: element.size.height })
    } else if (isRotateHandle) {
      e.preventDefault()
      e.stopPropagation()
      setIsRotating(true)
      
      // Get element center for rotation calculations
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
      
      // Store initial angle for reference
      const initialAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x)
      setRotateStart(initialAngle)
      
      // Store current rotation as starting point
      setInitialRotation(element.rotation || 0)
    } else {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - element.position.x * (zoom / 100),
        y: e.clientY - element.position.y * (zoom / 100),
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = (e.clientX - dragStart.x) / (zoom / 100)
        const newY = (e.clientY - dragStart.y) / (zoom / 100)
        onUpdate({
          position: { x: newX, y: newY },
        })
      } else if (isResizing) {
        const rect = elementRef.current?.getBoundingClientRect()
        if (rect) {
          let newWidth = element.size.width
          let newHeight = element.size.height
          let newX = element.position.x
          let newY = element.position.y
          
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          
          // Calculate the current position in the original coordinate system
          const mouseX = (e.clientX - rect.left) / (zoom / 100)
          const mouseY = (e.clientY - rect.top) / (zoom / 100)
          
          switch (resizeDirection) {
            case 'n':
              newHeight = Math.max(20, element.size.height - mouseY)
              newY = element.position.y + mouseY
              break
            case 's':
              newHeight = Math.max(20, mouseY)
              break
            case 'e':
              newWidth = Math.max(20, mouseX)
              break
            case 'w':
              newWidth = Math.max(20, element.size.width - mouseX)
              newX = element.position.x + mouseX
              break
            case 'ne':
              newWidth = Math.max(20, mouseX)
              newHeight = Math.max(20, element.size.height - mouseY)
              newY = element.position.y + mouseY
              break
            case 'nw':
              newWidth = Math.max(20, element.size.width - mouseX)
              newHeight = Math.max(20, element.size.height - mouseY)
              newX = element.position.x + mouseX
              newY = element.position.y + mouseY
              break
            case 'se':
              newWidth = Math.max(20, mouseX)
              newHeight = Math.max(20, mouseY)
              break
            case 'sw':
              newWidth = Math.max(20, element.size.width - mouseX)
              newHeight = Math.max(20, mouseY)
              newX = element.position.x + mouseX
              break
            default:
              break
          }
          
          onUpdate({
            position: { x: newX, y: newY },
            size: { width: newWidth, height: newHeight }
          })
        }
      } else if (isRotating) {
        const rect = elementRef.current?.getBoundingClientRect()
        if (rect) {
          // Calculate center of element
          const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          }
          
          // Calculate current angle from center to cursor
          const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x)
          
          // Calculate the difference from the start angle
          let angleDiff = (currentAngle - rotateStart) * 180 / Math.PI
          
          // Calculate new rotation based on initial rotation plus the change
          let newRotation = initialRotation + angleDiff
          
          // Snap to 15 degree increments if holding shift
          if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15
          }
          
          // Update the rotation
          onUpdate({
            rotation: newRotation
          })
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setIsRotating(false)
    }

    if (isDragging || isResizing || isRotating) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, isRotating, dragStart, rotateStart, resizeDirection, initialRotation, zoom, onUpdate, element])

  const renderShape = () => {
    const commonStyle = {
      width: "100%",
      height: "100%",
      fill: element.style.fill || "#3b82f6",
      stroke: element.style.stroke || "none",
      strokeWidth: element.style.strokeWidth || 0,
      opacity: element.style.opacity || 1,
    }

    switch (element.type) {
      case "rectangle":
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <rect 
              x="0" 
              y="0" 
              rx={element.style.borderRadius || 0}
              {...commonStyle} 
              // Extract width and height from commonStyle to avoid duplication
              width="100"
              height="100"
            />
          </svg>
        )
      case "circle":
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="50" ry="50" {...commonStyle} />
          </svg>
        )
      case "triangle":
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polygon points="50,0 100,100 0,100" {...commonStyle} />
          </svg>
        )
      case "line":
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke={element.style.stroke || "#3b82f6"}
              strokeWidth={element.style.strokeWidth || 2}
              opacity={element.style.opacity || 1}
            />
          </svg>
        )
      case "image":
        return (
          <img
            src={element.style.src || "/placeholder.svg?height=100&width=100"}
            alt="Design element"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: element.style.opacity || 1,
              borderRadius: element.style.borderRadius || 0,
            }}
          />
        )
      default:
        return null
    }
  }

  if (!element.visible) return null

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move select-none ${isSelected ? "ring-2 ring-blue-500" : ""} ${
        element.locked ? "cursor-not-allowed" : ""
      }`}
      style={{
        left: element.position.x * (zoom / 100),
        top: element.position.y * (zoom / 100),
        width: element.size.width * (zoom / 100),
        height: element.size.height * (zoom / 100),
        transform: `rotate(${element.rotation}deg)`,
        // When selected, ensure it has higher z-index for interaction while preserving visual layer position
        zIndex: isSelected ? Math.max(1000, element.zIndex) : element.zIndex,
        // When selected, always allow pointer events regardless of z-index
        pointerEvents: element.locked ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {renderShape()}

      {/* Selection Handles */}
      {isSelected && !element.locked && (
        <>
          {/* Resize Handles - 8 directions */}
          <div data-direction="n" className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-n-resize z-10" />
          <div data-direction="s" className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-s-resize z-10" />
          <div data-direction="e" className="resize-handle absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-e-resize z-10" />
          <div data-direction="w" className="resize-handle absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-w-resize z-10" />
          
          <div data-direction="ne" className="resize-handle absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize z-10" />
          <div data-direction="nw" className="resize-handle absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize z-10" />
          <div data-direction="se" className="resize-handle absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize z-10" />
          <div data-direction="sw" className="resize-handle absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize z-10" />
          
          {/* Rotation Handle */}
          <div 
            className="rotate-handle absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center cursor-crosshair z-10"
          >
            <RefreshCw className="h-4 w-4 text-white" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-[1px] h-6 w-[2px] -translate-y-6 bg-blue-500"/>

          {/* Lock/Unlock Indicator */}
          <div className="absolute -top-6 -left-1">
            <Badge variant="secondary" className="text-xs">
              {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </Badge>
          </div>
        </>
      )}
    </div>
  )
}

interface DesignElementSettingsProps {
  element: DesignElement | null
  onUpdate: (updates: Partial<DesignElement>) => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
}

export function DesignElementSettings({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}: DesignElementSettingsProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  useEffect(() => {
    // Load uploaded images
    const loadImages = async () => {
      try {
        const response = await fetch("/api/images/get-template-images")
        if (response.ok) {
          const data = await response.json()
          setUploadedImages(data.images || [])
        }
      } catch (error) {
        console.error("Failed to load images:", error)
      }
    }
    loadImages()
  }, [])

  if (!element) return null

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onUpdate({
          style: { ...element.style, src: data.url },
        })
        // Refresh images list
        const imagesResponse = await fetch("/api/images/get-template-images")
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          setUploadedImages(imagesData.images || [])
        }
      }
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  return (
    <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Design Element</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element
        </p>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            {element.type === "image" && <TabsTrigger value="source">Source</TabsTrigger>}
          </TabsList>

          <TabsContent value="position" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">X Position</Label>
                <Input
                  type="number"
                  value={Math.round(element.position.x)}
                  onChange={(e) =>
                    onUpdate({
                      position: { ...element.position, x: Number.parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Y Position</Label>
                <Input
                  type="number"
                  value={Math.round(element.position.y)}
                  onChange={(e) =>
                    onUpdate({
                      position: { ...element.position, y: Number.parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Width</Label>
                <Input
                  type="number"
                  value={Math.round(element.size.width)}
                  onChange={(e) =>
                    onUpdate({
                      size: { ...element.size, width: Number.parseInt(e.target.value) || 20 },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Height</Label>
                <Input
                  type="number"
                  value={Math.round(element.size.height)}
                  onChange={(e) =>
                    onUpdate({
                      size: { ...element.size, height: Number.parseInt(e.target.value) || 20 },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Rotation</Label>
              <Slider
                value={[element.rotation]}
                onValueChange={([value]) => onUpdate({ rotation: value })}
                min={-180}
                max={180}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">{element.rotation}°</div>
            </div>

            <div>
              <Label className="text-xs font-medium">Layer Position</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  size="sm"
                  variant={element.zIndex < 0 ? "default" : "outline"}
                  className="w-full text-xs py-1 h-auto"
                  onClick={() => onUpdate({ zIndex: -10 })}
                >
                  Background
                </Button>
                <Button
                  size="sm"
                  variant={element.zIndex === 0 ? "default" : "outline"}
                  className="w-full text-xs py-1 h-auto"
                  onClick={() => onUpdate({ zIndex: 0 })}
                >
                  Same Level
                </Button>
                <Button
                  size="sm"
                  variant={element.zIndex > 0 ? "default" : "outline"}
                  className="w-full text-xs py-1 h-auto"
                  onClick={() => onUpdate({ zIndex: 10 })}
                >
                  Foreground
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Current: {element.zIndex < 0 ? "Behind Content" : element.zIndex === 0 ? "Same Level" : "In Front of Content"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Visible</Label>
              <Switch checked={element.visible} onCheckedChange={(checked) => onUpdate({ visible: checked })} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Locked</Label>
              <Switch checked={element.locked} onCheckedChange={(checked) => onUpdate({ locked: checked })} />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            {element.type !== "line" && (
              <div>
                <Label className="text-xs">Fill Color</Label>
                <ColorPicker
                  value={element.style.fill || "#3b82f6"}
                  onChange={(color) =>
                    onUpdate({
                      style: { ...element.style, fill: color },
                    })
                  }
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Stroke Color</Label>
              <ColorPicker
                value={element.style.stroke || "#000000"}
                onChange={(color) =>
                  onUpdate({
                    style: { ...element.style, stroke: color },
                  })
                }
              />
            </div>

            <div>
              <Label className="text-xs">Stroke Width</Label>
              <Slider
                value={[element.style.strokeWidth || 0]}
                onValueChange={([value]) =>
                  onUpdate({
                    style: { ...element.style, strokeWidth: value },
                  })
                }
                min={0}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">{element.style.strokeWidth || 0}px</div>
            </div>

            <div>
              <Label className="text-xs">Opacity</Label>
              <Slider
                value={[element.style.opacity || 1]}
                onValueChange={([value]) =>
                  onUpdate({
                    style: { ...element.style, opacity: value },
                  })
                }
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((element.style.opacity || 1) * 100)}%
              </div>
            </div>

            {(element.type === "rectangle" || element.type === "image") && (
              <div>
                <Label className="text-xs">Border Radius</Label>
                <Slider
                  value={[element.style.borderRadius || 0]}
                  onValueChange={([value]) =>
                    onUpdate({
                      style: { ...element.style, borderRadius: value },
                    })
                  }
                  min={0}
                  max={50}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">{element.style.borderRadius || 0}px</div>
              </div>
            )}
          </TabsContent>

          {element.type === "image" && (
            <TabsContent value="source" className="space-y-4">
              <div>
                <Label className="text-xs mb-2 block">Upload Image</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file && file.type.startsWith("image/")) {
                      handleImageUpload(file)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = "image/*"
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleImageUpload(file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drop image here or click to upload</p>
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Template Images</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Refresh images
                        fetch("/api/images/get-template-images")
                          .then((res) => res.json())
                          .then((data) => setUploadedImages(data.images || []))
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {uploadedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                          element.style.src === imageUrl
                            ? "border-orange-500 ring-2 ring-orange-200"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() =>
                          onUpdate({
                            style: { ...element.style, src: imageUrl },
                          })
                        }
                      >
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Template ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {element.style.src === imageUrl && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDuplicate} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
