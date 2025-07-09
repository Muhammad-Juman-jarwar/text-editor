"use client"

// Import the modular sidebar components
import { TemplateBuilderSidebar as ModularSidebar } from "./sidebar"

// Re-export the interface for use in other components
export interface DesignElement {
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

export interface TemplateBuilderSidebarProps {
  template: any
  selectedPageId: string
  activeTab?: string
  onTabChange: (tab: string) => void
  onSelectPage: (pageId: string) => void
  onUpdateTemplate: (updates: any) => void
  onUpdatePage: (pageId: string, updates: any) => void
  onAddPage: (templateType?: string) => void
  onDeletePage: (pageId: string) => void
  onAddDesignElement: (elementType: string, position?: { x: number; y: number }) => void
  designElements?: DesignElement[]
  selectedDesignElement?: DesignElement | null
  onSelectElement?: (elementId: string) => void
}

// Re-export the modular sidebar component with the same interface
export function TemplateBuilderSidebar(props: TemplateBuilderSidebarProps) {
  return <ModularSidebar {...props} />
}
