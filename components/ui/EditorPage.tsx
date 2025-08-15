import TemplateFooter from "../template-builder/TemplateFooter";
import TemplateHeader from "../template-builder/TemplateHeader";
import { DesignElementComponent } from "../template-builder/design-element";
import {
  setFocusedHeader,
  setFocusedFooter,
} from "../template-builder/focus-tracker";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { cursorManager } from "../../lib/cursor-manager";

interface EditorPageProps {
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
  editorContentRef: React.RefObject<HTMLDivElement | null>;
  scaledWidth: number;
  scaledHeight: number;
  effectiveZoom: number;
  effectiveTheme: any;
  selectedPage: any;
  selectedDesignElement: any;
  onSelectDesignElement: (element: any) => void;
  template: any;
  headerHeight: number;
  footerHeight: number;
  onUpdateTemplate: (template: any) => void;
  handleDesignElementDropOnPage: (e: React.DragEvent) => void;
  handlePageDragOver: (e: React.DragEvent) => void;
  handleContentInput: (e: React.FormEvent<HTMLDivElement>) => void;
  handleContentBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  handleKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isContentOverflowing: () => boolean;
  addPage: (content?: string) => void;
  onUpdatePage: (pageId: string, updates: any) => void;
  designElements: any[];
  handleDesignElementSelect: (element: any) => void;
  handleDesignElementUpdate: (id: string, updates: any) => void;
  handleDesignElementDelete: (id: string) => void;
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

export default function EditorPage({
  pageContainerRef,
  editorContentRef,
  scaledWidth,
  scaledHeight,
  effectiveZoom,
  effectiveTheme,
  selectedPage,
  selectedDesignElement,
  onSelectDesignElement,
  template,
  headerHeight,
  footerHeight,
  onUpdateTemplate,
  handleDesignElementDropOnPage,
  handlePageDragOver,
  handleContentInput,
  handleContentBlur,
  handleKeyDown,
  isContentOverflowing,
  addPage,
  onUpdatePage,
  designElements,
  handleDesignElementSelect,
  handleDesignElementUpdate,
  handleDesignElementDelete,
  setActiveSettingsPanel,
  setCurrentSelectedContentElement,
}: EditorPageProps) {
  // Helper function to clean Firefox-generated unwanted <br> tags
  const cleanFirefoxContent = useCallback((element: HTMLElement) => {
    if (!navigator.userAgent.toLowerCase().includes("firefox")) return false;

    let content = element.innerHTML;
    let hasChanges = false;

    // Only remove problematic <br> tags that cause cursor jumping
    const cleanContent = content
      // Remove <br> in completely empty paragraphs (these cause cursor jumping)
      .replace(/<p([^>]*)>\s*<br\s*\/?>\s*<\/p>/gi, "<p$1></p>")
      // Remove <br> immediately at the start of paragraphs with text content (Firefox-specific issue)
      .replace(
        /<p([^>]*)>\s*<br\s*\/?>(\s*[a-zA-Z0-9][^<]*)<\/p>/gi,
        "<p$1>$2</p>"
      )
      // Remove double <br> tags that might appear
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "<br>");

    if (cleanContent !== content) {
      element.innerHTML = cleanContent;
      hasChanges = true;
    }

    return hasChanges;
  }, []);

  // Ensure contentEditable is always in sync with selectedPage.content
  useEffect(() => {
    if (!editorContentRef || !selectedPage) return;
    if (editorContentRef.current) {
      editorContentRef.current.innerHTML = selectedPage.content || "";
    }
  }, [editorContentRef, selectedPage?.id]);

  // Monitor for content overflow and prevent scrolling
  useEffect(() => {
    if (!editorContentRef?.current) return;

    const editorElement = editorContentRef.current;

    const checkOverflowAndPreventScroll = () => {
      // Reset scroll position if it has scrolled
      if (editorElement.scrollTop > 0) {
        editorElement.scrollTop = 0;
      }

      // Check for overflow and trigger subpage creation if needed
      const isOverflowing = isContentOverflowing();
      if (isOverflowing) {
        console.log("Overflow detected in EditorPage, triggering check");
        // Trigger the global overflow check function from template-builder-editor
        if ((window as any).forceEditorOverflowCheck) {
          (window as any).forceEditorOverflowCheck();
        }
      }
    };

    // Monitor for scroll events and reset scroll position
    const handleScroll = (e: Event) => {
      e.preventDefault();
      if (editorElement.scrollTop > 0) {
        editorElement.scrollTop = 0;
      }
    };

    // Monitor for content changes using MutationObserver
    const observer = new MutationObserver((mutations) => {
      let hasContentChange = false;
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          hasContentChange = true;
        }
      });

      if (hasContentChange) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(checkOverflowAndPreventScroll);
      }
    });

    // Firefox-specific cleanup for unwanted <br> tags
    const firefoxCleanup = () => {
      cleanFirefoxContent(editorElement);
    };

    observer.observe(editorElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    editorElement.addEventListener("scroll", handleScroll, { passive: false });

    // Add Firefox-specific input event handler to clean up unwanted <br> tags
    const firefoxInputHandler = (e: Event) => {
      if (navigator.userAgent.toLowerCase().includes("firefox")) {
        // Don't interfere if a delete operation is in progress
        if ((window as any).firefoxDeleteInProgress) {
          return;
        }

        const inputEvent = e as InputEvent;

        // Don't interfere with delete operations
        if (
          inputEvent.inputType &&
          (inputEvent.inputType.includes("delete") ||
            inputEvent.inputType === "deleteContentBackward" ||
            inputEvent.inputType === "deleteContentForward" ||
            inputEvent.inputType === "deleteByCut")
        ) {
          return; // Skip cleanup for delete operations
        }

        // Only trigger cleanup if we detect problematic patterns
        const content = editorElement.innerHTML;
        const hasProblematicBr =
          /<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi.test(content) ||
          /<p[^>]*>\s*<br\s*\/?>\s*[a-zA-Z0-9]/gi.test(content) ||
          /<br\s*\/?>\s*<br\s*\/?>/gi.test(content);

        if (hasProblematicBr) {
          requestAnimationFrame(firefoxCleanup);
        }
      }
    };

    if (navigator.userAgent.toLowerCase().includes("firefox")) {
      editorElement.addEventListener("input", firefoxInputHandler);
    }

    return () => {
      observer.disconnect();
      editorElement.removeEventListener("scroll", handleScroll);
      if (navigator.userAgent.toLowerCase().includes("firefox")) {
        editorElement.removeEventListener("input", firefoxInputHandler);
      }
    };
  }, [editorContentRef, isContentOverflowing]);

  return (
    <div
      ref={pageContainerRef}
      className="relative bg-white shadow-lg"
      style={{
        width: scaledWidth,
        height: scaledHeight,
        transform: `scale(${effectiveZoom / 100})`,
        transformOrigin: "top center",
        margin: "auto",
      }}
      onDrop={handleDesignElementDropOnPage}
      onDragOver={handlePageDragOver}
    >
      <div
        className="absolute inset-0"
        style={{
          // backgroundColor:
          //   selectedPage.backgroundColor ||
          //   effectiveTheme.colors.pageBackground,
          backgroundColor:
            (selectedPage.backgroundColor !== "#ffffff"
              ? selectedPage.backgroundColor
              : effectiveTheme.colors.pageBackground) || "#fff",
        }}
        onClick={() => {
          if (selectedDesignElement) {
            onSelectDesignElement(null);
          }
        }}
      />
      {selectedPage.showHeader && (
        <TemplateHeader
          key={`header-${template?.header?.fontSize || 12}`}
          template={template}
          effectiveZoom={effectiveZoom}
          effectiveTheme={effectiveTheme}
          headerHeight={headerHeight}
          selectedPage={selectedPage}
          onUpdateTemplate={onUpdateTemplate}
          selectedDesignElement={selectedDesignElement}
          onSelectDesignElement={onSelectDesignElement}
          handleDesignElementSelect={handleDesignElementSelect}
          handleDesignElementUpdate={handleDesignElementUpdate}
          handleDesignElementDelete={handleDesignElementDelete}
          setActiveSettingsPanel={setActiveSettingsPanel}
          setCurrentSelectedContentElement={setCurrentSelectedContentElement}
        />
      )}
      {selectedPage.showFooter && (
        <TemplateFooter
          template={template}
          effectiveZoom={effectiveZoom}
          effectiveTheme={effectiveTheme}
          footerHeight={footerHeight}
          selectedPage={selectedPage}
          onUpdateTemplate={onUpdateTemplate}
          selectedDesignElement={selectedDesignElement}
          onSelectDesignElement={onSelectDesignElement}
          handleDesignElementSelect={handleDesignElementSelect}
          handleDesignElementUpdate={handleDesignElementUpdate}
          handleDesignElementDelete={handleDesignElementDelete}
          setActiveSettingsPanel={setActiveSettingsPanel}
          setCurrentSelectedContentElement={setCurrentSelectedContentElement}
        />
      )}
      <div
        className="template-builder-editor-content-area absolute"
        style={{
          top: 0,
          left: 0,
          right: 0,
          // height: "92%",
          padding: `${effectiveTheme.margins.top}px ${effectiveTheme.margins.right}px ${effectiveTheme.margins.bottom}px ${effectiveTheme.margins.left}px`,
          zIndex: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          key={selectedPage.id}
          ref={editorContentRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full outline-none max-w-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && selectedDesignElement) {
              onSelectDesignElement(null);
            }
          }}
          onFocus={() => {
            // Clear header/footer focus when main editor gains focus
            setFocusedHeader(null);
            setFocusedFooter(null);
          }}
          style={
            {
              fontSize: `${
                effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize
              }px`,
              fontFamily:
                effectiveTheme.typography.fontFamily ||
                effectiveTheme.typography.bodyFont,
              lineHeight:
                effectiveTheme.typography.lineHeight ||
                effectiveTheme.typography.lineSpacing,
              color: `${effectiveTheme.colors.text}`,
              "--text-color": effectiveTheme.colors.text,
              "--heading-color": effectiveTheme.colors.primary,
              height: "100%",
              overflowY: "hidden",
              overflowX: "hidden",
              scrollBehavior: "auto",
              wordWrap: "break-word",
            } as React.CSSProperties
          }
          onBeforeInput={(e: React.FormEvent<HTMLDivElement>) => {
            // Firefox-specific handling to prevent unwanted line breaks during typing
            if (navigator.userAgent.toLowerCase().includes("firefox")) {
              const nativeEvent = e.nativeEvent as InputEvent;

              // Handle different input types
              if (
                nativeEvent.inputType === "insertText" ||
                nativeEvent.inputType === "insertCompositionText"
              ) {
                // Only handle regular text insertion, not deletions
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const container = range.startContainer;

                  // Check if we're inside a paragraph element
                  let parentElement =
                    container.nodeType === Node.TEXT_NODE
                      ? container.parentElement
                      : (container as Element);

                  while (parentElement && parentElement !== e.currentTarget) {
                    if (parentElement.tagName === "P") {
                      // Only remove <br> tags if they're causing issues with text input
                      // Check if the paragraph has both text content and <br> tags
                      const hasTextContent = parentElement.textContent?.trim();
                      const hasBrTags = parentElement.innerHTML.includes("<br");
                      if (hasTextContent && hasBrTags) {
                        // Remove <br> tags that are at the beginning or mixed with text
                        let innerHTML = parentElement.innerHTML;
                        innerHTML = innerHTML.replace(/^<br\s*\/?>/gi, ""); // Remove leading br
                        if (innerHTML !== parentElement.innerHTML) {
                          parentElement.innerHTML = innerHTML;
                        }
                      }
                      break;
                    }
                    parentElement = parentElement.parentElement;
                  }
                }
              }

              // Don't interfere with delete operations (deleteContentBackward, deleteContentForward, etc.)
              // Don't interfere with insertParagraph (Enter key) events
            }
          }}
          onInput={(e: React.FormEvent<HTMLDivElement>) => {
            // Firefox-specific fix: Remove unwanted <br> tags only when they cause issues
            if (navigator.userAgent.toLowerCase().includes("firefox")) {
              // Don't interfere if a delete operation is in progress
              if ((window as any).firefoxDeleteInProgress) {
                handleContentInput(e);
                return;
              }

              const element = e.currentTarget;

              // Get the native input event to check the input type
              const nativeEvent = e.nativeEvent as InputEvent;

              // Don't interfere with delete operations
              if (
                nativeEvent &&
                (nativeEvent.inputType?.includes("delete") ||
                  nativeEvent.inputType === "deleteContentBackward" ||
                  nativeEvent.inputType === "deleteContentForward" ||
                  nativeEvent.inputType === "deleteByCut")
              ) {
                // Let delete operations proceed without cleanup
                handleContentInput(e);
                return;
              }

              // Only clean if we detect problematic patterns (not legitimate line breaks)
              const content = element.innerHTML;
              const hasProblematicBr =
                // Empty paragraphs with br (cursor jumping issue)
                /<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi.test(content) ||
                // Paragraphs with br immediately before text content (Firefox-specific issue)
                /<p[^>]*>\s*<br\s*\/?>\s*[a-zA-Z0-9]/gi.test(content) ||
                // Double br tags
                /<br\s*\/?>\s*<br\s*\/?>/gi.test(content);

              if (hasProblematicBr) {
                // Save cursor position before cleaning
                const editorId = editorContentRef.current?.id || "main-editor";
                const cursorPos = cursorManager.saveCursorPosition(
                  editorId,
                  element
                );

                const hasChanges = cleanFirefoxContent(element);

                // Restore cursor position if content was changed
                if (hasChanges && cursorPos) {
                  // Use requestAnimationFrame to ensure DOM is updated
                  requestAnimationFrame(() => {
                    cursorManager.restoreCursorPosition(editorId, element);
                  });
                }
              }
            }

            handleContentInput(e);
          }}
          onBlur={handleContentBlur}
          onScroll={(e) => {
            // Prevent scrolling entirely - reset scroll position to top
            if (e.currentTarget.scrollTop > 0) {
              e.currentTarget.scrollTop = 0;
            }
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            // Call the custom key handler first (for subpage deletion, etc.)
            if (handleKeyDown) {
              handleKeyDown(e);
              // If the event was prevented by the custom handler, don't continue
              if (e.defaultPrevented) {
                return;
              }
            }

            // Firefox-specific handling for backspace/delete
            if (
              navigator.userAgent.toLowerCase().includes("firefox") &&
              (e.key === "Backspace" || e.key === "Delete")
            ) {
              // Let the default backspace/delete behavior proceed without interference
              // Store a flag to prevent cleanup during this operation
              (window as any).firefoxDeleteInProgress = true;

              // Clear the flag after the operation completes
              setTimeout(() => {
                (window as any).firefoxDeleteInProgress = false;
              }, 50); // Shorter timeout for more responsive behavior
            }

            if (e.key === "Enter") {
              e.preventDefault();

              editorContentRef.current?.focus();
              if (e.shiftKey) {
                // Shift+Enter: Insert a line break
                document.execCommand("insertHTML", false, "<br>");
              } else {
                // Regular Enter: Insert a new paragraph
                if (navigator.userAgent.toLowerCase().includes("firefox")) {
                  // Firefox-specific approach
                  document.execCommand(
                    "insertHTML",
                    false,
                    `<p style="color: ${
                      effectiveTheme.colors.text
                    }; font-family: ${
                      effectiveTheme.typography.fontFamily ||
                      effectiveTheme.typography.bodyFont
                    }; font-size: ${
                      effectiveTheme.typography.baseFontSize ||
                      effectiveTheme.typography.bodyFontSize
                    }px; line-height: ${
                      effectiveTheme.typography.lineHeight ||
                      effectiveTheme.typography.lineSpacing
                    };">&nbsp;</p>`
                  );

                  // Clean up after the paragraph insertion
                  requestAnimationFrame(() => {
                    if (editorContentRef.current) {
                      // Replace &nbsp; with empty content and position cursor
                      let content = editorContentRef.current.innerHTML;
                      content = content.replace(/&nbsp;/g, "");
                      editorContentRef.current.innerHTML = content;

                      // Position cursor in the new paragraph
                      const selection = window.getSelection();
                      if (selection) {
                        const paragraphs =
                          editorContentRef.current.querySelectorAll("p");
                        const lastP = paragraphs[paragraphs.length - 1];
                        if (lastP) {
                          const range = document.createRange();
                          range.setStart(lastP, 0);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
                    }
                  });
                } else {
                  // Chrome and other browsers - use the original approach
                  document.execCommand(
                    "insertHTML",
                    false,
                    `<p style="color: ${
                      effectiveTheme.colors.text
                    }; font-family: ${
                      effectiveTheme.typography.fontFamily ||
                      effectiveTheme.typography.bodyFont
                    }; font-size: ${
                      effectiveTheme.typography.baseFontSize ||
                      effectiveTheme.typography.bodyFontSize
                    }px; line-height: ${
                      effectiveTheme.typography.lineHeight ||
                      effectiveTheme.typography.lineSpacing
                    };"><br></p>`
                  );
                }
              }
              if (editorContentRef.current && selectedPage) {
                onUpdatePage(selectedPage.id, {
                  content: editorContentRef.current.innerHTML,
                });
              }

              // Check for overflow immediately after Enter key
              requestAnimationFrame(() => {
                if (isContentOverflowing()) {
                  console.log("Overflow detected after Enter key press");
                  if ((window as any).forceEditorOverflowCheck) {
                    (window as any).forceEditorOverflowCheck();
                  }
                }
              });
            }
          }}
          onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
            // Clear the Firefox delete flag when backspace/delete key is released
            if (
              navigator.userAgent.toLowerCase().includes("firefox") &&
              (e.key === "Backspace" || e.key === "Delete")
            ) {
              (window as any).firefoxDeleteInProgress = false;
            }
          }}
          onPaste={(e: React.ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand(
              "insertHTML",
              false,
              `<span style="color: ${
                effectiveTheme.colors.text
              }; font-family: ${
                effectiveTheme.typography.fontFamily ||
                effectiveTheme.typography.bodyFont
              }; font-size: ${
                effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize
              }px; line-height: ${
                effectiveTheme.typography.lineHeight ||
                effectiveTheme.typography.lineSpacing
              };">${text}</span>`
            );
            if (editorContentRef.current && selectedPage) {
              onUpdatePage(selectedPage.id, {
                content: editorContentRef.current.innerHTML,
              });
            }
          }}
        />
        <style jsx>{`
          .template-builder-editor-content-area [contenteditable] {
            color: ${effectiveTheme.colors.text} !important;
            caret-color: ${effectiveTheme.colors.text} !important;
            font-family: ${
              effectiveTheme.typography.fontFamily ||
              effectiveTheme.typography.bodyFont
            } !important;
            font-size: ${
              effectiveTheme.typography.baseFontSize ||
              effectiveTheme.typography.bodyFontSize
            }px !important;
            line-height: ${
              effectiveTheme.typography.lineHeight ||
              effectiveTheme.typography.lineSpacing
            } !important;
            overflow: hidden !important;
            scroll-behavior: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .template-builder-editor-content-area [contenteditable]::-webkit-scrollbar {
            display: none !important;
          }
          .template-builder-editor-content-area [contenteditable] * {
            color: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
          }
          .template-builder-editor-content-area [contenteditable] * {
            position: relative;
            z-index: 0;
          }
          .template-builder-editor-content-area [contenteditable],
          .template-builder-editor-content-area
            [contenteditable]
            *:not([data-element-type]) {
            color: ${effectiveTheme.colors.text} !important;
          }
          ${
            selectedDesignElement
              ? `
              .template-builder-editor-content-area [contenteditable] {
                pointer-events: none;
              }
              .template-builder-editor-content-area [contenteditable]:focus {
                pointer-events: auto;
              }
              `
              : ""
          }
          
          /* Firefox-specific styles to prevent unwanted line breaks */
          @-moz-document url-prefix() {
            /* Only hide br tags that are problematic, not legitimate line breaks */
            .template-builder-editor-content-area [contenteditable] p:empty br {
              display: none !important;
            }
            .template-builder-editor-content-area [contenteditable] {
              -moz-user-select: text;
            }
          }
          
          .template-builder-editor-content-area [data-element-type] {
            position: relative;
            z-index: 0;
          }
          .template-builder-editor-content-area [contenteditable] p,
          .template-builder-editor-content-area [contenteditable] div,
          .template-builder-editor-content-area [contenteditable] span {
          }
          .template-builder-editor-content-area [contenteditable] h1,
          .template-builder-editor-content-area [contenteditable] h2,
          .template-builder-editor-content-area [contenteditable] h3,
          .template-builder-editor-content-area [contenteditable] h4,
          .template-builder-editor-content-area [contenteditable] h5,
          .template-builder-editor-content-area [contenteditable] h6 {
            color: var(
              --heading-color,
              ${effectiveTheme.colors.primary}
            ) !important;
            font-family: ${
              effectiveTheme.typography.fontFamily ||
              effectiveTheme.typography.bodyFont
            } !important;
            line-height: ${
              effectiveTheme.typography.lineHeight ||
              effectiveTheme.typography.lineSpacing
            } !important;
          }
          /* Exclude chart elements from heading color override */
          .template-builder-editor-content-area [data-element-type="chart"] h1,
          .template-builder-editor-content-area [data-element-type="chart"] h2,
          .template-builder-editor-content-area [data-element-type="chart"] h3,
          .template-builder-editor-content-area [data-element-type="chart"] h4,
          .template-builder-editor-content-area [data-element-type="chart"] h5,
          .template-builder-editor-content-area [data-element-type="chart"] h6 {
            color: unset !important;
          }
            effectiveTheme.typography.lineSpacing} !important;
          }
          .template-builder-editor-content-area [contenteditable] h1 {
            font-size: ${
              (effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize) * 2
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable] h2 {
            font-size: ${
              (effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize) * 1.75
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable] h3 {
            font-size: ${
              (effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize) * 1.5
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable] h4 {
            font-size: ${
              (effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize) * 1.25
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable] h5 {
            font-size: ${
              (effectiveTheme.typography.baseFontSize ||
                effectiveTheme.typography.bodyFontSize) * 1.1
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable] h6 {
            font-size: ${
              effectiveTheme.typography.baseFontSize ||
              effectiveTheme.typography.bodyFontSize
            }px !important;
          }
          .template-builder-editor-content-area [contenteditable]:before {
            color: ${effectiveTheme.colors.text} !important;
          }
          .template-builder-editor-content-area [contenteditable] text {
            color: ${effectiveTheme.colors.text} !important;
          }
          .template-builder-editor-content-area
            [contenteditable]
            span[style*="color"] {
            color: ${effectiveTheme.colors.text} !important;
          }
        `}</style>
        {designElements.map((element) => (
          <DesignElementComponent
            key={element.id}
            element={element}
            isSelected={selectedDesignElement?.id === element.id}
            onSelect={() => handleDesignElementSelect(element)}
            onUpdate={(updates) =>
              handleDesignElementUpdate(element.id, updates)
            }
            onDelete={() => handleDesignElementDelete(element.id)}
            zoom={effectiveZoom}
          />
        ))}
      </div>
    </div>
  );
}
