/**
 * Centralized cursor position management for the text editor
 * This module provides robust cursor position tracking and restoration
 * to prevent cursor jumping and unexpected positioning issues.
 */

export interface CursorPosition {
  container: Node;
  offset: number;
  endContainer?: Node;
  endOffset?: number;
  isCollapsed: boolean;
}

export interface EditorRange {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  collapsed: boolean;
}

class CursorManager {
  private savedPositions: Map<string, CursorPosition> = new Map();
  private lastActiveEditorId: string | null = null;
  private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Save current cursor position for a specific editor
   */
  saveCursorPosition(
    editorId: string,
    element?: HTMLElement
  ): CursorPosition | null {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return null;
      }

      const range = selection.getRangeAt(0);
      const editorElement =
        element || this.findEditorElement(range.commonAncestorContainer);

      if (!editorElement) {
        return null;
      }

      const position: CursorPosition = {
        container: range.startContainer,
        offset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        isCollapsed: range.collapsed,
      };

      this.savedPositions.set(editorId, position);
      this.lastActiveEditorId = editorId;

      return position;
    } catch (e) {
      console.warn("Failed to save cursor position:", e);
      return null;
    }
  }

  /**
   * Restore cursor position for a specific editor
   */
  restoreCursorPosition(editorId: string, element?: HTMLElement): boolean {
    try {
      const position = this.savedPositions.get(editorId);
      if (!position) {
        return false;
      }

      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      // Validate that the saved containers still exist in the DOM
      if (
        !this.isNodeValid(position.container) ||
        (position.endContainer && !this.isNodeValid(position.endContainer))
      ) {
        // Fallback: try to restore position using text offset
        return this.restoreByTextOffset(editorId, element);
      }

      const range = document.createRange();

      // Ensure offset is within bounds
      const maxOffset = this.getMaxOffset(position.container);
      const safeOffset = Math.min(position.offset, maxOffset);

      range.setStart(position.container, safeOffset);

      if (!position.isCollapsed && position.endContainer) {
        const maxEndOffset = this.getMaxOffset(position.endContainer);
        const safeEndOffset = Math.min(position.endOffset || 0, maxEndOffset);
        range.setEnd(position.endContainer, safeEndOffset);
      } else {
        range.collapse(true);
      }

      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (e) {
      console.warn("Failed to restore cursor position:", e);
      return false;
    }
  }

  /**
   * Safely update content while preserving cursor position
   */
  updateContentSafely(
    editorId: string,
    element: HTMLElement,
    newContent: string,
    preserveCursor: boolean = true
  ): void {
    let position: CursorPosition | null = null;

    if (preserveCursor) {
      position = this.saveCursorPosition(editorId, element);
    }

    // Update content
    element.innerHTML = newContent;

    // Restore cursor position after a minimal delay to ensure DOM is updated
    if (preserveCursor && position) {
      requestAnimationFrame(() => {
        this.restoreCursorPosition(editorId, element);
      });
    }
  }

  /**
   * Get current selection as a serializable object
   */
  getCurrentSelection(): EditorRange | null {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return null;
      }

      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed,
      };
    } catch (e) {
      console.warn("Failed to get current selection:", e);
      return null;
    }
  }

  /**
   * Set selection from a serializable range object
   */
  setSelection(editorRange: EditorRange): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      if (
        !this.isNodeValid(editorRange.startContainer) ||
        !this.isNodeValid(editorRange.endContainer)
      ) {
        return false;
      }

      const range = document.createRange();

      const maxStartOffset = this.getMaxOffset(editorRange.startContainer);
      const maxEndOffset = this.getMaxOffset(editorRange.endContainer);

      range.setStart(
        editorRange.startContainer,
        Math.min(editorRange.startOffset, maxStartOffset)
      );
      range.setEnd(
        editorRange.endContainer,
        Math.min(editorRange.endOffset, maxEndOffset)
      );

      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (e) {
      console.warn("Failed to set selection:", e);
      return false;
    }
  }

  /**
   * Place cursor at the end of the specified element
   */
  placeCursorAtEnd(element: HTMLElement): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);

      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (e) {
      console.warn("Failed to place cursor at end:", e);
      return false;
    }
  }

  /**
   * Place cursor at the beginning of the specified element
   */
  placeCursorAtStart(element: HTMLElement): boolean {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return false;
      }

      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (e) {
      console.warn("Failed to place cursor at start:", e);
      return false;
    }
  }

  /**
   * Execute a function while preserving cursor position
   */
  executeWithCursorPreservation<T>(
    editorId: string,
    element: HTMLElement,
    fn: () => T
  ): T {
    const position = this.saveCursorPosition(editorId, element);

    try {
      const result = fn();

      // Restore after function execution
      if (position) {
        requestAnimationFrame(() => {
          this.restoreCursorPosition(editorId, element);
        });
      }

      return result;
    } catch (e) {
      // Still try to restore cursor even if function failed
      if (position) {
        requestAnimationFrame(() => {
          this.restoreCursorPosition(editorId, element);
        });
      }
      throw e;
    }
  }

  /**
   * Clear saved position for an editor
   */
  clearSavedPosition(editorId: string): void {
    this.savedPositions.delete(editorId);

    // Clear any pending timeouts
    const timeout = this.debounceTimeouts.get(editorId);
    if (timeout) {
      clearTimeout(timeout);
      this.debounceTimeouts.delete(editorId);
    }
  }

  /**
   * Clear all saved positions
   */
  clearAllPositions(): void {
    this.savedPositions.clear();
    this.debounceTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.debounceTimeouts.clear();
    this.lastActiveEditorId = null;
  }

  // Private helper methods

  private findEditorElement(node: Node): HTMLElement | null {
    let current: Node | null = node;

    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        if (
          element.contentEditable === "true" ||
          element.classList.contains("template-builder-editor-content-area")
        ) {
          return element;
        }
      }
      current = current.parentNode;
    }

    return null;
  }

  private isNodeValid(node: Node): boolean {
    try {
      return document.contains(node);
    } catch (e) {
      return false;
    }
  }

  private getMaxOffset(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node as Text).textContent?.length || 0;
    } else {
      return (node as Element).childNodes.length;
    }
  }

  private restoreByTextOffset(
    editorId: string,
    element?: HTMLElement
  ): boolean {
    // This is a fallback method when direct node restoration fails
    // We can implement text-based cursor restoration here if needed
    // For now, just place cursor at the end
    if (element) {
      return this.placeCursorAtEnd(element);
    }
    return false;
  }

  /**
   * Debounced cursor position saving to avoid excessive saves during rapid typing
   */
  saveCursorPositionDebounced(
    editorId: string,
    element?: HTMLElement,
    delay: number = 100
  ): void {
    // Clear existing timeout
    const existingTimeout = this.debounceTimeouts.get(editorId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.saveCursorPosition(editorId, element);
      this.debounceTimeouts.delete(editorId);
    }, delay);

    this.debounceTimeouts.set(editorId, timeout);
  }
}

// Export singleton instance
export const cursorManager = new CursorManager();

// Utility functions for common operations
export const withCursorPreservation = <T>(
  editorId: string,
  element: HTMLElement,
  fn: () => T
): T => {
  return cursorManager.executeWithCursorPreservation(editorId, element, fn);
};

export const updateContentSafely = (
  editorId: string,
  element: HTMLElement,
  newContent: string
): void => {
  cursorManager.updateContentSafely(editorId, element, newContent);
};

export const saveCursor = (
  editorId: string,
  element?: HTMLElement
): CursorPosition | null => {
  return cursorManager.saveCursorPosition(editorId, element);
};

export const restoreCursor = (
  editorId: string,
  element?: HTMLElement
): boolean => {
  return cursorManager.restoreCursorPosition(editorId, element);
};
