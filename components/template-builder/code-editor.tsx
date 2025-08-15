"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Edit, Save, X } from "lucide-react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  onSave?: (code: string, language: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "text", label: "Plain Text" },
];

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = "",
  initialLanguage = "javascript",
  onSave,
  onCancel,
  readOnly = false,
  className = "",
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [isEditing, setIsEditing] = useState(!readOnly && !initialCode);
  const [theme, setTheme] = useState("dark");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const { theme: systemTheme } = useTheme();

  // Preserve cursor position during updates
  const preserveCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart;
    }
  }, []);

  // Restore cursor position after update
  const restoreCursorPosition = useCallback(() => {
    if (textareaRef.current && cursorPositionRef.current !== undefined) {
      const position = Math.min(cursorPositionRef.current, code.length);
      textareaRef.current.setSelectionRange(position, position);
    }
  }, [code.length]);

  // Handle textarea change with cursor preservation
  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      preserveCursorPosition();
      setCode(e.target.value);
    },
    [preserveCursorPosition]
  );

  // Handle keyboard events with proper event propagation control
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent event bubbling to parent elements
      e.stopPropagation();

      preserveCursorPosition();

      // Handle special keys that might cause cursor jumping
      const target = e.target as HTMLTextAreaElement;
      const { selectionStart, selectionEnd } = target;

      // Handle common problematic characters
      if (e.key === "{" || e.key === "}" || e.key === " ") {
        // Let the default behavior happen, just preserve cursor
        preserveCursorPosition();
      }

      // Handle Tab key for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const beforeCursor = code.substring(0, selectionStart);
        const afterCursor = code.substring(selectionEnd);
        const newCode = beforeCursor + "  " + afterCursor; // 2 spaces
        setCode(newCode);

        // Set cursor position after the inserted spaces
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = selectionStart + 2;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    },
    [code, preserveCursorPosition]
  );

  // Handle input events
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      preserveCursorPosition();
    },
    [preserveCursorPosition]
  );

  // Handle focus events
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
    },
    []
  );

  // Handle click events to prevent parent interference
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      preserveCursorPosition();
    },
    [preserveCursorPosition]
  );

  // Handle mouse events to prevent cursor jumping
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
    },
    []
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      preserveCursorPosition();
    },
    [preserveCursorPosition]
  );

  // Handle blur events
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    restoreCursorPosition();
  }, [code, restoreCursorPosition]);

  useEffect(() => {
    setTheme(systemTheme === "dark" ? "dark" : "light");
  }, [systemTheme]);

  const handleSave = () => {
    if (onSave) {
      onSave(code, language);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setCode(initialCode);
      setLanguage(initialLanguage);
      setIsEditing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Use a longer timeout to ensure DOM is ready
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Set cursor to end of content
        const length = code.length;
        textareaRef.current.setSelectionRange(length, length);
        cursorPositionRef.current = length;
      }
    }, 100);
  };

  const syntaxHighlighterStyle = theme === "dark" ? vscDarkPlus : vs;

  if (isEditing) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Code Editor</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="relative"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleTextAreaChange}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="w-full h-64 p-4 font-mono text-sm resize-none border-0 outline-none bg-background"
              placeholder="Enter your code here..."
              style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Code</CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {SUPPORTED_LANGUAGES.find((lang) => lang.value === language)
                ?.label || language}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <SyntaxHighlighter
            language={language}
            style={syntaxHighlighterStyle}
            customStyle={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "1.5",
              borderRadius: "0 0 8px 8px",
              minHeight: "100px",
            }}
            showLineNumbers={true}
            wrapLines={true}
          >
            {code || "// Enter your code here..."}
          </SyntaxHighlighter>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
