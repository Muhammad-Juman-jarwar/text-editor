"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { useDrop } from "react-dnd"
import type { ElementType } from "../../types/template"
import { TextElement } from "./text-element"
import { ImageElement, ImageSettingsPanel } from "./image-element"
import { ShapeElement } from "./shape-element"
import { LineElement } from "./line-element"
import { ButtonElement } from "./button-element"
import { VideoElement } from "./video-element"
import { IconElement } from "./icon-element"
import { TableElement } from "./table-element"
import { ChartElement } from "./chart-element"
import { MapElement } from "./map-element"
import { QRCodeElement } from "./qrcode-element"
import { TocElement } from "./toc-element"
import { TocSettingsPanel } from "./toc-settings-panel"

interface TemplateBuilderCanvasProps {
  elements: any[]
  selectedElementId: string | null
  selectedPageId: string
  zoom: number
  addElement: (type: ElementType) => void
  updateElement: (id: string, updates: any) => void
  setSelectedElementId: (id: string | null) => void
  selectedElement: any
}

export const TemplateBuilderCanvas: React.FC<TemplateBuilderCanvasProps> = ({
  elements,
  selectedElementId,
  selectedPageId,
  zoom,
  addElement,
  updateElement,
  setSelectedElementId,
  selectedElement,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [showImageSettings, setShowImageSettings] = useState(false)

  const [, drop] = useDrop({
    accept: "element",
    drop: (item: { type: ElementType }) => {
      addElement(item.type)
      setIsDraggingOver(false)

      // Auto-show settings for image elements
      if (item.type === "image") {
        setTimeout(() => {
          setShowImageSettings(true)
        }, 100)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: () => {
      setIsDraggingOver(true)
    },
  })

  useEffect(() => {
    if (isDraggingOver === true) {
      setTimeout(() => {
        setIsDraggingOver(false)
      }, 2000)
    }
  }, [isDraggingOver])

  // Show image settings when image element is selected
  useEffect(() => {
    if (selectedElement?.type === "image") {
      setShowImageSettings(true)
    } else {
      setShowImageSettings(false)
    }
  }, [selectedElement])

  const handleImageDelete = () => {
    if (selectedElement?.type === "image") {
      // Remove element from the editor
      const elementDiv = document.querySelector(`[data-element-id="${selectedElement.id}"]`)
      if (elementDiv) {
        const container = elementDiv.closest(".element-container")
        if (container) {
          container.remove()
        } else {
          elementDiv.remove()
        }
      }
      setSelectedElementId(null)
      setShowImageSettings(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Main Canvas */}
      <div
        ref={drop}
        className="flex-1"
        style={{
          backgroundColor: "#f0f0f0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          ref={canvasRef}
          style={{
            width: "210mm",
            height: "297mm",
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            transformOrigin: "top left",
            transform: `scale(${zoom})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {elements.map((element) => (
            <React.Fragment key={element.id}>
              {element.type === "text" && (
                <TextElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "image" && (
                <ImageElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                  onUpdate={(updates) => updateElement(element.id, updates)}
                  onDelete={handleImageDelete}
                  showSettings={showImageSettings && selectedElementId === element.id}
                  onShowSettings={setShowImageSettings}
                />
              )}
              {element.type === "shape" && (
                <ShapeElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "line" && (
                <LineElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "button" && (
                <ButtonElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "video" && (
                <VideoElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "icon" && (
                <IconElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "table" && (
                <TableElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "chart" && (
                <ChartElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "map" && (
                <MapElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "qrcode" && (
                <QRCodeElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
              {element.type === "toc" && (
                <TocElement
                  key={element.id}
                  element={element}
                  zoom={zoom}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Side Panels */}
      {selectedElement?.type === "image" && showImageSettings && (
        <ImageSettingsPanel
          element={selectedElement}
          onUpdate={(updates) => updateElement(selectedElement.id, updates)}
          onDelete={handleImageDelete}
          onClose={() => setShowImageSettings(false)}
        />
      )}

      {selectedElement?.type === "toc" && (
        <TocSettingsPanel
          element={selectedElement}
          onUpdate={(updates) => updateElement(selectedElement.id, updates)}
        />
      )}
    </div>
  )
}
