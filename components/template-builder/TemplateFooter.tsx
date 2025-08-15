import { useRef, useEffect, useState } from "react";
import { setFocusedHeader, setFocusedFooter } from "./focus-tracker";
import { cursorManager } from "../../lib/cursor-manager";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateFooterProps {
  template: any;
  effectiveZoom: number;
  effectiveTheme: any;
  footerHeight: number;
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

export default function TemplateFooter({
  template,
  effectiveZoom,
  effectiveTheme,
  footerHeight,
  selectedPage,
  onUpdateTemplate,
  selectedDesignElement,
  onSelectDesignElement,
  handleDesignElementSelect,
  handleDesignElementUpdate,
  handleDesignElementDelete,
  setActiveSettingsPanel,
  setCurrentSelectedContentElement,
}: TemplateFooterProps) {
  const footerRefText = useRef<HTMLDivElement>(null);
  const footerPageRefText = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Update content when template changes or when switching pages
  // This ensures real-time updates across all pages and subpages
  useEffect(() => {
    if (footerRefText.current && template.footer) {
      const currentContent = footerRefText.current.innerHTML;
      const templateContent = template.footer.content || "Footer";

      // Only update if content is actually different to avoid cursor reset
      // and if the current element is not focused (to prevent interrupting user typing)
      if (
        currentContent !== templateContent &&
        document.activeElement !== footerRefText.current
      ) {
        footerRefText.current.innerHTML = templateContent;
      }
    }
  }, [selectedPage?.id, template.footer?.content]); // Run when page changes OR when footer content changes

  // Set initial content only once when component mounts
  useEffect(() => {
    if (
      footerRefText.current &&
      template.footer &&
      !footerRefText.current.innerHTML
    ) {
      footerRefText.current.innerHTML = template.footer.content || "Footer";
    }
  }, []); // Empty dependency array - only run once on mount

  const handleFooterInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (footerRefText.current) {
      // Remove any line breaks that might have been pasted
      const content = footerRefText.current.innerHTML
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<div>/gi, " ")
        .replace(/<\/div>/gi, "")
        .replace(/\n/g, " ")
        .trim();

      // Calculate max length based on font size
      const fontSize =
        (template?.footer?.fontSize || 10) * (effectiveZoom / 100);
      const baseFontSize = 10; // Base font size for footer reference
      const baseMaxLength = 120; // Base max length for 10px font (footer can be longer)
      const maxLength = Math.floor((baseFontSize / fontSize) * baseMaxLength);

      // Limit text length
      const textContent = footerRefText.current.textContent || "";

      if (textContent.length > maxLength) {
        // Truncate the text
        const truncatedText = textContent.substring(0, maxLength);

        // Use cursor manager for safe content update
        cursorManager.updateContentSafely(
          "footer-truncate",
          footerRefText.current,
          truncatedText,
          false
        );

        // Position cursor at end after truncation
        setTimeout(() => {
          cursorManager.placeCursorAtEnd(footerRefText.current!);
        }, 10);
      } else {
        // Update with cleaned content (no line breaks)
        if (footerRefText.current.innerHTML !== content) {
          cursorManager.updateContentSafely(
            "footer",
            footerRefText.current,
            content,
            true
          );
        }
      }

      onUpdateTemplate({
        ...template,
        footer: {
          ...template.footer,
          content: footerRefText.current.innerHTML,
        },
      });
    }
  };

  const handleFooterBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      e.relatedTarget &&
      ((e.relatedTarget as HTMLElement).closest(".settings-panel-container") ||
        (e.relatedTarget as HTMLElement).closest(".template-builder-toolbar"))
    ) {
      return;
    }

    // Clear focus tracking when footer loses focus (but not when clicking toolbar)
    setFocusedFooter(null);
    if (footerRefText.current) {
      onUpdateTemplate({
        ...template,
        footer: {
          ...template.footer,
          content: footerRefText.current.innerHTML,
        },
      });
    }
  };

  const handleFooterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent Enter key to avoid line breaks
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }

    // Check text length before allowing new characters
    if (footerRefText.current) {
      const currentText = footerRefText.current.textContent || "";

      // Calculate max length based on font size
      const fontSize =
        (template?.footer?.fontSize || 10) * (effectiveZoom / 100);
      const baseFontSize = 10; // Base font size for footer reference
      const baseMaxLength = 120; // Base max length for 10px font (footer can be longer)
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

  const handleFooterFocus = () => {
    // Set focus tracking when footer gains focus
    if (footerRefText.current) {
      setFocusedFooter(footerRefText.current);
      // Clear header focus when footer gains focus
      setFocusedHeader(null);
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

    const handleFooterClick = (e: MouseEvent) => {
      // Only handle clicks that are not on image elements or other specific elements
      const target = e.target as HTMLElement;
      const imageElement = target.closest('[data-element-type="image"]');

      if (!imageElement && setActiveSettingsPanel) {
        // Check if it's a right-click or ctrl+click to open footer settings
        if (e.ctrlKey || e.metaKey || e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
          setActiveSettingsPanel("footer");
        }
      }
    };

    if (footerRefText.current) {
      footerRefText.current.addEventListener("click", handleImageClick);
      footerRefText.current.addEventListener("click", handleFooterClick);
      footerRefText.current.addEventListener("contextmenu", handleFooterClick);
      return () => {
        if (footerRefText.current) {
          footerRefText.current.removeEventListener("click", handleImageClick);
          footerRefText.current.removeEventListener("click", handleFooterClick);
          footerRefText.current.removeEventListener(
            "contextmenu",
            handleFooterClick
          );
        }
      };
    }
  }, [setActiveSettingsPanel, setCurrentSelectedContentElement]);

  return (
    <div
      className="footer-container absolute bottom-0 border-t border-dashed backdrop-blur-sm w-full"
      style={{
        height: template?.footer?.height || footerHeight,
        fontSize: `${
          (template?.footer?.fontSize || 10) * (effectiveZoom / 100)
        }px`,
        fontFamily:
          template?.footer?.fontFamily || effectiveTheme.typography.bodyFont,
        color: template?.footer?.textColor || effectiveTheme.colors.text,
        backgroundColor:
          template?.footer?.backgroundColor || "rgba(255, 255, 255, 0.8)",
        borderTop: `${template?.footer?.borderWidth || 1}px dashed ${
          template?.footer?.borderColor || "#c0c0c0"
        }`,
        paddingTop: `${template?.footer?.padding?.top || 0}px`,
        paddingRight: `${template?.footer?.padding?.right || 24}px`,
        paddingBottom: `${template?.footer?.padding?.bottom || 0}px`,
        paddingLeft: `${template?.footer?.padding?.left || 24}px`,
        cursor: "text",
      }}
      title="Footer content - hover to see settings"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-between w-full h-full">
        <div
          ref={footerRefText}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleFooterInput}
          onBlur={handleFooterBlur}
          onFocus={handleFooterFocus}
          onKeyDown={handleFooterKeyDown}
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
              (template?.footer?.fontSize || 10) * (effectiveZoom / 100);
            const baseFontSize = 10; // Base font size for footer reference
            const baseMaxLength = 120; // Base max length for 10px font (footer can be longer)
            const maxLength = Math.floor(
              (baseFontSize / fontSize) * baseMaxLength
            );

            const currentText = footerRefText.current?.textContent || "";
            const availableLength = maxLength - currentText.length;

            if (availableLength > 0 && footerRefText.current) {
              const truncatedPaste = paste.substring(0, availableLength);

              // Use cursor manager for safe paste insertion
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(truncatedPaste));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }}
          className="outline-none flex min-h-full items-center w-[92%] justify-start overflow-hidden whitespace-nowrap text-ellipsis"
          style={{
            minHeight: "100%",
            maxHeight: "100%",
            lineHeight: "1.2",
          }}
        />
        {selectedPage.showPageNumber && (
          <span
            ref={footerPageRefText}
            contentEditable
            suppressContentEditableWarning={true}
            className="w-fit flex-nowrap"
          >
            Page {selectedPage.order || 1}
          </span>
        )}

        {isHovered && setActiveSettingsPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveSettingsPanel("footer");
            }}
            className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/90 hover:bg-white border border-gray-300 shadow-sm"
            title="Footer Settings"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
