/**
 * Enhanced element insertion system that preserves cursor position
 * and provides better control over where elements are inserted.
 */

import { cursorManager } from "./cursor-manager";

export interface InsertionContext {
  targetElement: HTMLElement;
  editorId: string;
  preserveCursor: boolean;
  insertionType: "replace" | "insert-before" | "insert-after" | "at-cursor";
}

export class ElementInserter {
  /**
   * Insert HTML content at current cursor position without disrupting cursor
   */
  static insertAtCursor(html: string, context: InsertionContext): boolean {
    try {
      const { targetElement, editorId, preserveCursor } = context;

      // Save cursor position if requested
      let cursorPos = null;
      if (preserveCursor) {
        cursorPos = cursorManager.saveCursorPosition(editorId, targetElement);
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // No selection, append to end
        return this.appendToElement(html, context);
      }

      const range = selection.getRangeAt(0);

      // Ensure the range is within our target element
      if (!targetElement.contains(range.commonAncestorContainer)) {
        // Selection is outside target, place at end
        return this.appendToElement(html, context);
      }

      // Create a temporary container to parse the HTML
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html;

      // Insert each node from the parsed HTML
      const nodes = Array.from(tempContainer.childNodes);

      if (nodes.length === 0) {
        return false;
      }

      // Delete current selection content
      range.deleteContents();

      // Insert nodes one by one
      let lastInsertedNode: Node | null = null;
      for (const node of nodes) {
        range.insertNode(node.cloneNode(true));
        lastInsertedNode = node;
        range.setStartAfter(node);
      }

      // Position cursor after the inserted content
      if (lastInsertedNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastInsertedNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      return true;
    } catch (e) {
      console.error("Failed to insert at cursor:", e);
      return false;
    }
  }

  /**
   * Append HTML content to the end of an element
   */
  static appendToElement(html: string, context: InsertionContext): boolean {
    try {
      const { targetElement, editorId, preserveCursor } = context;

      // Save cursor position if requested
      let cursorPos = null;
      if (preserveCursor) {
        cursorPos = cursorManager.saveCursorPosition(editorId, targetElement);
      }

      // Create temporary container to parse HTML
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html;

      // Append all nodes
      const nodes = Array.from(tempContainer.childNodes);
      for (const node of nodes) {
        targetElement.appendChild(node.cloneNode(true));
      }

      // Restore cursor or place at end
      if (preserveCursor && cursorPos) {
        requestAnimationFrame(() => {
          cursorManager.restoreCursorPosition(editorId, targetElement);
        });
      } else {
        // Place cursor at end of element
        requestAnimationFrame(() => {
          cursorManager.placeCursorAtEnd(targetElement);
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to append to element:", e);
      return false;
    }
  }

  /**
   * Replace current selection with HTML content
   */
  static replaceSelection(html: string, context: InsertionContext): boolean {
    try {
      const { targetElement, editorId } = context;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // No selection, append instead
        return this.appendToElement(html, context);
      }

      const range = selection.getRangeAt(0);

      // Ensure the range is within our target element
      if (!targetElement.contains(range.commonAncestorContainer)) {
        return false;
      }

      // Create temporary container to parse HTML
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html;

      // Delete current selection
      range.deleteContents();

      // Insert new content
      const nodes = Array.from(tempContainer.childNodes);
      let lastInsertedNode: Node | null = null;

      for (const node of nodes) {
        const clonedNode = node.cloneNode(true);
        range.insertNode(clonedNode);
        lastInsertedNode = clonedNode;
        range.setStartAfter(clonedNode);
      }

      // Position cursor after inserted content
      if (lastInsertedNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastInsertedNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      return true;
    } catch (e) {
      console.error("Failed to replace selection:", e);
      return false;
    }
  }

  /**
   * Insert content before the current cursor position
   */
  static insertBefore(html: string, context: InsertionContext): boolean {
    try {
      const { targetElement, editorId, preserveCursor } = context;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // No cursor position, insert at start
        return this.prependToElement(html, context);
      }

      const range = selection.getRangeAt(0);

      // Ensure the range is within our target element
      if (!targetElement.contains(range.commonAncestorContainer)) {
        return false;
      }

      // Save cursor position
      const cursorPos = cursorManager.saveCursorPosition(
        editorId,
        targetElement
      );

      // Create temporary container
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html;

      // Insert before cursor
      const nodes = Array.from(tempContainer.childNodes);
      for (const node of nodes) {
        range.insertNode(node.cloneNode(true));
      }

      // Restore cursor position
      if (preserveCursor && cursorPos) {
        requestAnimationFrame(() => {
          cursorManager.restoreCursorPosition(editorId, targetElement);
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to insert before cursor:", e);
      return false;
    }
  }

  /**
   * Prepend content to the beginning of an element
   */
  static prependToElement(html: string, context: InsertionContext): boolean {
    try {
      const { targetElement, editorId, preserveCursor } = context;

      // Save cursor position if requested
      let cursorPos = null;
      if (preserveCursor) {
        cursorPos = cursorManager.saveCursorPosition(editorId, targetElement);
      }

      // Create temporary container
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html;

      // Insert at beginning
      const nodes = Array.from(tempContainer.childNodes);
      const firstChild = targetElement.firstChild;

      for (const node of nodes) {
        if (firstChild) {
          targetElement.insertBefore(node.cloneNode(true), firstChild);
        } else {
          targetElement.appendChild(node.cloneNode(true));
        }
      }

      // Restore cursor position
      if (preserveCursor && cursorPos) {
        requestAnimationFrame(() => {
          cursorManager.restoreCursorPosition(editorId, targetElement);
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to prepend to element:", e);
      return false;
    }
  }

  /**
   * Smart insertion that chooses the best method based on context
   */
  static smartInsert(html: string, context: InsertionContext): boolean {
    const { insertionType } = context;

    switch (insertionType) {
      case "replace":
        return this.replaceSelection(html, context);
      case "insert-before":
        return this.insertBefore(html, context);
      case "insert-after":
        return this.appendToElement(html, context);
      case "at-cursor":
      default:
        return this.insertAtCursor(html, context);
    }
  }

  /**
   * Enhanced insertHTML that doesn't disrupt cursor position
   */
  static safeInsertHTML(
    html: string,
    targetElement: HTMLElement,
    editorId: string
  ): boolean {
    const context: InsertionContext = {
      targetElement,
      editorId,
      preserveCursor: true,
      insertionType: "at-cursor",
    };

    return this.smartInsert(html, context);
  }
}

// Convenience functions
export const insertAtCursor = (
  html: string,
  targetElement: HTMLElement,
  editorId: string
) => {
  return ElementInserter.safeInsertHTML(html, targetElement, editorId);
};

export const replaceSelection = (
  html: string,
  targetElement: HTMLElement,
  editorId: string
) => {
  const context: InsertionContext = {
    targetElement,
    editorId,
    preserveCursor: false,
    insertionType: "replace",
  };
  return ElementInserter.smartInsert(html, context);
};

export const appendToElement = (
  html: string,
  targetElement: HTMLElement,
  editorId: string
) => {
  const context: InsertionContext = {
    targetElement,
    editorId,
    preserveCursor: true,
    insertionType: "insert-after",
  };
  return ElementInserter.smartInsert(html, context);
};
