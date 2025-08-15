import { useRef, useEffect, useState } from "react";
import { setFocusedHeader, setFocusedFooter } from "./focus-tracker";
import { cursorManager } from "../../lib/cursor-manager";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateHeaderProps {
  template: any;
  effectiveZoom: number;
  effectiveTheme: any;
  headerHeight: number;
  selectedPage: any;
  onUpdateTemplate: (updates: any) => void;
  selectedDesignElement?: any;
  onSelectDesignElement?: (element: any) => void;
  handleDesignElementSelect?: (element: any) => void;
  handleDesignElementUpdate?: (id: string, updates: any) => void;
  handleDesignElementDelete?: (id: string) => void;
  setActiveSettingsPanel?: (
    panel:
      | "toc"
      | "chart"
      | "table"
      | "image"
      | "layout"
      | "design"
      | "header"
      | "footer"
      | null
  ) => void;
  setCurrentSelectedContentElement?: (element: any) => void;
}

export default function TemplateHeader({
  template,
  effectiveZoom,
  effectiveTheme,
  headerHeight,
  selectedPage,
  onUpdateTemplate,
  selectedDesignElement,
  onSelectDesignElement,
  handleDesignElementSelect,
  handleDesignElementUpdate,
  handleDesignElementDelete,
  setActiveSettingsPanel,
  setCurrentSelectedContentElement,
}: TemplateHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Debug effect to track fontSize changes
  useEffect(() => {
    console.log(
      "TemplateHeader received fontSize:",
      template?.header?.fontSize
    );
  }, [template?.header?.fontSize]);

  // Update content when template changes or when switching pages
  // This ensures real-time updates across all pages and subpages
  useEffect(() => {
    if (headerRef.current && template.header) {
      const currentContent = headerRef.current.innerHTML;
      const templateContent = template.header.content || "Header";

      // Only update if content is actually different to avoid cursor reset
      // and if the current element is not focused (to prevent interrupting user typing)
      if (
        currentContent !== templateContent &&
        document.activeElement !== headerRef.current
      ) {
        headerRef.current.innerHTML = templateContent;
      }
    }
  }, [selectedPage?.id, template.header?.content]); // Run when page changes OR when header content changes

  // Set initial content only once when component mounts
  useEffect(() => {
    if (headerRef.current && template.header && !headerRef.current.innerHTML) {
      headerRef.current.innerHTML = template.header.content || "Header";
    }
  }, []); // Empty dependency array - only run once on mount

  const handleHeaderInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      // Remove any line breaks that might have been pasted
      const content = headerRef.current.innerHTML
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<div>/gi, " ")
        .replace(/<\/div>/gi, "")
        .replace(/\n/g, " ")
        .trim();

      // Calculate max length based on font size
      const fontSize =
        (template?.header?.fontSize || 12) * (effectiveZoom / 100);
      const baseFontSize = 12; // Base font size for reference
      const baseMaxLength = 100; // Base max length for 12px font
      const maxLength = Math.floor((baseFontSize / fontSize) * baseMaxLength);

      // Limit text length
      const textContent = headerRef.current.textContent || "";

      if (textContent.length > maxLength) {
        // Truncate the text
        const truncatedText = textContent.substring(0, maxLength);
        headerRef.current.textContent = truncatedText;

        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(headerRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        // Update with cleaned content (no line breaks) while preserving cursor
        if (headerRef.current.innerHTML !== content) {
          cursorManager.updateContentSafely(
            "header",
            headerRef.current,
            content,
            true
          );
        }
      }

      onUpdateTemplate({
        ...template,
        header: {
          ...template.header,
          content: headerRef.current.innerHTML,
        },
      });
    }
  };

  const handleHeaderBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      e.relatedTarget &&
      ((e.relatedTarget as HTMLElement).closest(".settings-panel-container") ||
        (e.relatedTarget as HTMLElement).closest(".template-builder-toolbar"))
    ) {
      return;
    }

    // Clear focus tracking when header loses focus (but not when clicking toolbar)
    setFocusedHeader(null);
    if (headerRef.current) {
      onUpdateTemplate({
        ...template,
        header: {
          ...template.header,
          content: headerRef.current.innerHTML,
        },
      });
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent Enter key to avoid line breaks
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }

    // Check text length before allowing new characters
    if (headerRef.current) {
      const currentText = headerRef.current.textContent || "";

      // Calculate max length based on font size
      const fontSize =
        (template?.header?.fontSize || 12) * (effectiveZoom / 100);
      const baseFontSize = 12; // Base font size for reference
      const baseMaxLength = 100; // Base max length for 12px font
      const maxLength = Math.floor((baseFontSize / fontSize) * baseMaxLength);

      // Allow backspace, delete, arrow keys, etc.
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Tab",
      ];

      // Allow Ctrl/Cmd combinations (copy, paste, etc.)
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      // If it's a printable character and we're at max length, prevent it
      if (currentText.length >= maxLength && !allowedKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }
    }
  };

  const handleHeaderFocus = () => {
    // Set focus tracking when header gains focus
    if (headerRef.current) {
      setFocusedHeader(headerRef.current);
      // Clear footer focus when header gains focus
      setFocusedFooter(null);
    }
  };

  // Handle clicks on image elements
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const imageElement = target.closest('[data-element-type="image"]');

      if (
        imageElement &&
        setActiveSettingsPanel &&
        setCurrentSelectedContentElement
      ) {
        e.stopPropagation();

        // Clear any existing selections
        document
          .querySelectorAll("[data-element-type].selected")
          .forEach((el) => {
            el.classList.remove("selected");
          });

        // Add selected class to clicked element
        imageElement.classList.add("selected");

        // Set the current selected content element for the settings panel
        setCurrentSelectedContentElement(imageElement);

        // Open the image settings panel
        setActiveSettingsPanel("image");
      }
    };

    const handleHeaderClick = (e: MouseEvent) => {
      // Only handle clicks that are not on image elements or other specific elements
      const target = e.target as HTMLElement;
      const imageElement = target.closest('[data-element-type="image"]');

      if (!imageElement && setActiveSettingsPanel) {
        // Check if it's a right-click or ctrl+click to open header settings
        if (e.ctrlKey || e.metaKey || e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
          setActiveSettingsPanel("header");
        }
      }
    };

    if (headerRef.current) {
      headerRef.current.addEventListener("click", handleImageClick);
      headerRef.current.addEventListener("click", handleHeaderClick);
      headerRef.current.addEventListener("contextmenu", handleHeaderClick);
      return () => {
        if (headerRef.current) {
          headerRef.current.removeEventListener("click", handleImageClick);
          headerRef.current.removeEventListener("click", handleHeaderClick);
          headerRef.current.removeEventListener(
            "contextmenu",
            handleHeaderClick
          );
        }
      };
    }
  }, [setActiveSettingsPanel, setCurrentSelectedContentElement]);

  return (
    <div
      className="absolute top-0 backdrop-blur-sm outline-none border-b border-dashed"
      style={{
        height: template?.header?.height || headerHeight,
        fontSize: `${
          (template?.header?.fontSize || 12) * (effectiveZoom / 100)
        }px`,
        fontFamily:
          template?.header?.fontFamily || effectiveTheme.typography.headingFont,
        color: template?.header?.textColor || effectiveTheme.colors.text,
        backgroundColor:
          template?.header?.backgroundColor || "rgba(255, 255, 255, 0.8)",
        borderBottom: `${template?.header?.borderWidth || 2}px dashed ${
          template?.header?.borderColor || "#c0c0c0"
        }`,
        paddingTop: `${template?.header?.padding?.top || 0}px`,
        paddingRight: `${template?.header?.padding?.right || 48}px`,
        paddingBottom: `${template?.header?.padding?.bottom || 0}px`,
        paddingLeft: `${template?.header?.padding?.left || 48}px`,
        cursor: "text",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={headerRef}
        contentEditable
        suppressContentEditableWarning
        title="Header content - hover to see settings"
        onInput={handleHeaderInput}
        onBlur={handleHeaderBlur}
        onFocus={handleHeaderFocus}
        onKeyDown={handleHeaderKeyDown}
        onPaste={(e) => {
          // Handle paste to prevent line breaks
          e.preventDefault();
          const paste = e.clipboardData
            .getData("text/plain")
            .replace(/\n/g, " ")
            .replace(/\r/g, " ")
            .trim();

          // Calculate max length based on font size
          const fontSize =
            (template?.header?.fontSize || 12) * (effectiveZoom / 100);
          const baseFontSize = 12; // Base font size for reference
          const baseMaxLength = 100; // Base max length for 12px font
          const maxLength = Math.floor(
            (baseFontSize / fontSize) * baseMaxLength
          );

          const currentText = headerRef.current?.textContent || "";
          const availableLength = maxLength - currentText.length;

          if (availableLength > 0) {
            const truncatedPaste = paste.substring(0, availableLength);
            document.execCommand("insertText", false, truncatedPaste);
          }
        }}
        className="w-full h-full flex items-center justify-center overflow-hidden whitespace-nowrap text-ellipsis"
        style={{
          minHeight: "100%",
          maxHeight: "100%",
          lineHeight: "1.2",
        }}
      >
        {/* Content will be set via innerHTML in useEffect */}
      </div>

      {isHovered && setActiveSettingsPanel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveSettingsPanel("header");
          }}
          className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/90 hover:bg-white border border-gray-300 shadow-sm"
          title="Header Settings"
        >
          <Settings className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
