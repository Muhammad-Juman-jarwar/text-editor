"use client";

import React, { useState } from "react";
import CodeEditor from "./code-editor";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface CodeElementProps {
  id: string;
  initialCode?: string;
  initialLanguage?: string;
  onUpdate?: (code: string, language: string) => void;
  onDelete?: () => void;
  isSelected?: boolean;
}

const CodeElement: React.FC<CodeElementProps> = ({
  id,
  initialCode = "",
  initialLanguage = "javascript",
  onUpdate,
  onDelete,
  isSelected = false,
}) => {
  const [isEditing, setIsEditing] = useState(!initialCode);
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);

  const handleSave = (newCode: string, newLanguage: string) => {
    setCode(newCode);
    setLanguage(newLanguage);
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(newCode, newLanguage);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  if (isEditing) {
    return (
      <div className="my-4 relative group">
        <CodeEditor
          initialCode={code}
          initialLanguage={language}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`my-4 relative group ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      data-element-type="code"
      data-element-id={id}
    >
      <CodeEditor
        initialCode={code}
        initialLanguage={language}
        readOnly={true}
      />

      {/* Overlay controls that appear on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleEdit}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CodeElement;
