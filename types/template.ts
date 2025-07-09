/**
 * Template types for the text editor template builder
 */

export interface TocElementContent {
  title: string
  levels: string[]
  bulletStyle: "none" | "bullet" | "number"
  indentSize: number
  showBorder: boolean
  borderStyle: "solid" | "dashed" | "dotted"
  borderColor: string
  borderWidth: number
  entries: Array<{
    title: string
    page: number
    level: number
  }>
}

export interface TemplateElement {
  id: string
  type: string
  position: {
    x: number
    y: number
    width?: number
    height?: number
    rotation?: number
  }
  size?: { width: number; height: number }
  // Legacy flat properties for backend compatibility
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  content: any
  style: any
  zIndex: number
  layer?: number // Added for compatibility with backend
  pageId: string
  groupId?: string
  locked?: boolean
  visible?: boolean
}

export interface TemplatePage {
  id: string
  name: string
  order: number
  elements: string[]
  background?: string
  backgroundColor?: string
  backgroundImage?: string
  showHeader?: boolean
  showFooter?: boolean
  showPageNumber?: boolean
  size?: { width: number; height: number }
}

export interface TemplateTheme {
  id?: string // Added for referencing theme by ID
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  backgroundColor: string
  fontFamily: string
  headingFontFamily: string
  fontSize: number
  headingFontSize: number
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    pageBackground: string
  }
  typography: {
    bodyFont: string
    headingFont: string
    bodyFontSize: number
    headingFontSize: number
    lineSpacing: number
  }
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
    linked?: boolean
  }
}

export interface HeaderFooterConfig {
  id: "header" | "footer"
  enabled: boolean
  content: string
  height: number
  backgroundColor: string
  backgroundImage?: string
  textColor: string
  fontFamily: string
  fontSize: number
  textAlign: "left" | "center" | "right"
  padding: number
  border: {
    color: string
    width: number
    style: "solid" | "dotted" | "dashed" | "none"
  }
}

export interface Collaborator {
  id: string
  name: string
  color: string
  avatar?: string
  cursor?: { x: number; y: number }
  selection?: string[]
}

export interface Template {
  id: string
  _id?: string // Added for backend compatibility
  customId?: string // Added for backend compatibility
  name: string
  description?: string
  languages: string[]
  supportedLanguages: string[] // Languages supported by this template
  pages: TemplatePage[]
  elements: TemplateElement[]
  theme: TemplateTheme
  headerConfig: HeaderFooterConfig
  footerConfig: HeaderFooterConfig
  createdAt: string
  updatedAt: string
  createdBy: string
  status?: string // Added for template status (draft, published, etc.)
  isPublic?: boolean // Added for template visibility
  groups?: Record<string, string[]>
}
