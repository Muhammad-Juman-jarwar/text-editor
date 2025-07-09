"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Square, Circle, Triangle, Minus, ImageIcon } from "lucide-react"

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

interface DesignTabProps {
  onAddDesignElement: (elementType: string, position?: { x: number; y: number }) => void
  designElements?: DesignElement[]
  selectedDesignElement?: DesignElement | null
  onSelectElement?: (elementId: string) => void
}

export function DesignTab({
  onAddDesignElement,
  designElements = [],
  selectedDesignElement = null,
  onSelectElement = () => {},
}: DesignTabProps) {
  const [draggedElement, setDraggedElement] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData("application/design-element", elementType)
    setDraggedElement(elementType)
  }

  const handleDragEnd = () => {
    setDraggedElement(null)
  }

  // Design element templates for the drag-and-drop UI
  const designElementTemplates = [
    { type: "rectangle", icon: Square, label: "Rectangle", color: "bg-blue-500" },
    { type: "circle", icon: Circle, label: "Circle", color: "bg-green-500" },
    { type: "triangle", icon: Triangle, label: "Triangle", color: "bg-yellow-500" },
    { type: "line", icon: Minus, label: "Line", color: "bg-gray-500" },
    { type: "image", icon: ImageIcon, label: "Image", color: "bg-orange-500" },
  ]

  return (
    <div className="space-y-4 mt-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Design Elements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {designElementTemplates.map((element) => {
              const Icon = element.icon
              return (
                <div
                  key={element.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, element.type)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-move transition-all hover:border-primary/50 hover:bg-primary/5",
                    draggedElement === element.type && "opacity-50",
                  )}
                >
                  <div className={cn("p-2 rounded-lg text-white", element.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{element.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Page Elements List Card */}
      {designElements.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground">Page Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {designElements.map((element) => {
                const getElementIcon = (type: string) => {
                  switch (type) {
                    case "rectangle": return <Square className="h-4 w-4" />
                    case "circle": return <Circle className="h-4 w-4" />
                    case "triangle": return <Triangle className="h-4 w-4" />
                    case "line": return <Minus className="h-4 w-4" />
                    case "image": return <ImageIcon className="h-4 w-4" />
                    default: return <Square className="h-4 w-4" />
                  }
                }
                
                const getElementColor = (type: string) => {
                  switch (type) {
                    case "rectangle": return "bg-blue-500" 
                    case "circle": return "bg-green-500"
                    case "triangle": return "bg-yellow-500"
                    case "line": return "bg-gray-500"
                    case "image": return "bg-orange-500"
                    default: return "bg-slate-500"
                  }
                }
                
                return (
                  <div
                    key={element.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all",
                      selectedDesignElement?.id === element.id 
                        ? "border-primary bg-primary/10 shadow-sm" 
                        : "border-border hover:bg-primary/5"
                    )}
                    onClick={() => onSelectElement(element.id)}
                  >
                    <div className={cn("p-1 rounded-md text-white", getElementColor(element.type))}>
                      {getElementIcon(element.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">
                          {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                        </span>
                        <Badge variant={element.zIndex < 0 ? "outline" : "default"} className="text-[9px] h-4">
                          {element.zIndex < 0 ? "BG" : element.zIndex > 0 ? "FG" : "Normal"}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {element.locked && <span className="inline-block mr-1">🔒</span>}
                        {!element.visible && <span className="inline-block mr-1">👁️</span>}
                        Position: {Math.round(element.position.x)},{Math.round(element.position.y)}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {designElements.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No design elements on this page
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
