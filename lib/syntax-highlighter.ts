export interface SyntaxTheme {
  keyword: string;
  string: string;
  comment: string;
  number: string;
  boolean: string;
  function: string;
  variable: string;
  operator: string;
  punctuation: string;
  class: string;
  constant: string;
  tag: string;
  attribute: string;
  property: string;
}

export const lightTheme: SyntaxTheme = {
  keyword: "#d73a49",
  string: "#032f62",
  comment: "#6a737d",
  number: "#005cc5",
  boolean: "#005cc5",
  function: "#6f42c1",
  variable: "#24292e",
  operator: "#d73a49",
  punctuation: "#24292e",
  class: "#6f42c1",
  constant: "#005cc5",
  tag: "#22863a",
  attribute: "#6f42c1",
  property: "#005cc5",
};

export const darkTheme: SyntaxTheme = {
  keyword: "#ff7b72",
  string: "#a5d6ff",
  comment: "#8b949e",
  number: "#79c0ff",
  boolean: "#79c0ff",
  function: "#d2a8ff",
  variable: "#f0f6fc",
  operator: "#ff7b72",
  punctuation: "#f0f6fc",
  class: "#d2a8ff",
  constant: "#79c0ff",
  tag: "#7ee787",
  attribute: "#d2a8ff",
  property: "#79c0ff",
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const createSpan = (content: string, color: string): string => {
  return `<span style="color: ${color}; font-weight: 500;">${content}</span>`;
};

export const highlightJavaScript = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keywords
  const keywords = [
    "abstract",
    "arguments",
    "await",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "double",
    "else",
    "enum",
    "eval",
    "export",
    "extends",
    "false",
    "final",
    "finally",
    "float",
    "for",
    "function",
    "goto",
    "if",
    "implements",
    "import",
    "in",
    "instanceof",
    "int",
    "interface",
    "let",
    "long",
    "native",
    "new",
    "null",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "volatile",
    "while",
    "with",
    "yield",
    "async",
    "from",
    "as",
  ];

  // Built-in functions and methods
  const builtInFunctions = [
    "console",
    "log",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "assert",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "Date",
    "Math",
    "JSON",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURIComponent",
    "decodeURIComponent",
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "Promise",
    "fetch",
    "localStorage",
    "sessionStorage",
    "document",
    "window",
    "alert",
    "confirm",
    "prompt",
    "addEventListener",
    "removeEventListener",
    "querySelector",
    "querySelectorAll",
    "getElementById",
    "getElementsByClassName",
    "createElement",
    "appendChild",
    "removeChild",
    "setAttribute",
    "getAttribute",
  ];

  // Constants and built-in values
  const constants = ["undefined", "NaN", "Infinity", "globalThis"];

  // Comments (single and multi-line)
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    createSpan(match, theme.comment)
  );
  highlighted = highlighted.replace(/\/\/.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );

  // Strings (single, double, and template literals)
  highlighted = highlighted.replace(/`(?:[^`\\]|\\.)*`/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*([eE][+-]?\d+)?\b/g, (match) =>
    createSpan(match, theme.number)
  );

  // Keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.keyword)
    );
  });

  // Built-in functions
  builtInFunctions.forEach((func) => {
    const regex = new RegExp(`\\b${func}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.function)
    );
  });

  // Constants
  constants.forEach((constant) => {
    const regex = new RegExp(`\\b${constant}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.constant)
    );
  });

  // Function definitions
  highlighted = highlighted.replace(
    /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    (match, funcName) =>
      `${createSpan("function", theme.keyword)} ${createSpan(
        funcName,
        theme.function
      )}`
  );

  // Class definitions
  highlighted = highlighted.replace(
    /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    (match, className) =>
      `${createSpan("class", theme.keyword)} ${createSpan(
        className,
        theme.class
      )}`
  );

  return highlighted;
};

export const highlightPython = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keywords
  const keywords = [
    "False",
    "None",
    "True",
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
  ];

  // Built-in functions
  const builtInFunctions = [
    "abs",
    "all",
    "any",
    "ascii",
    "bin",
    "bool",
    "bytearray",
    "bytes",
    "callable",
    "chr",
    "classmethod",
    "compile",
    "complex",
    "delattr",
    "dict",
    "dir",
    "divmod",
    "enumerate",
    "eval",
    "exec",
    "filter",
    "float",
    "format",
    "frozenset",
    "getattr",
    "globals",
    "hasattr",
    "hash",
    "help",
    "hex",
    "id",
    "input",
    "int",
    "isinstance",
    "issubclass",
    "iter",
    "len",
    "list",
    "locals",
    "map",
    "max",
    "memoryview",
    "min",
    "next",
    "object",
    "oct",
    "open",
    "ord",
    "pow",
    "print",
    "property",
    "range",
    "repr",
    "reversed",
    "round",
    "set",
    "setattr",
    "slice",
    "sorted",
    "staticmethod",
    "str",
    "sum",
    "super",
    "tuple",
    "type",
    "vars",
    "zip",
  ];

  // Comments
  highlighted = highlighted.replace(/#.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );

  // Strings (triple quotes first, then single/double)
  highlighted = highlighted.replace(/"""[\s\S]*?"""/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'''[\s\S]*?'''/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*([eE][+-]?\d+)?\b/g, (match) =>
    createSpan(match, theme.number)
  );

  // Keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.keyword)
    );
  });

  // Built-in functions
  builtInFunctions.forEach((func) => {
    const regex = new RegExp(`\\b${func}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.function)
    );
  });

  // Function definitions
  highlighted = highlighted.replace(
    /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (match, funcName) =>
      `${createSpan("def", theme.keyword)} ${createSpan(
        funcName,
        theme.function
      )}`
  );

  // Class definitions
  highlighted = highlighted.replace(
    /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (match, className) =>
      `${createSpan("class", theme.keyword)} ${createSpan(
        className,
        theme.class
      )}`
  );

  // Decorators
  highlighted = highlighted.replace(/@[a-zA-Z_][a-zA-Z0-9_]*/g, (match) =>
    createSpan(match, theme.function)
  );

  return highlighted;
};

export const highlightCSS = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Comments
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    createSpan(match, theme.comment)
  );

  // Selectors
  highlighted = highlighted.replace(
    /([.#]?[\w-]+)(\s*\{)/g,
    (match, selector, brace) => `${createSpan(selector, theme.tag)}${brace}`
  );

  // Properties
  highlighted = highlighted.replace(
    /([\w-]+)\s*:/g,
    (match, property) => `${createSpan(property, theme.property)}:`
  );

  // Values
  highlighted = highlighted.replace(
    /:\s*([^;]+);/g,
    (match, value) => `: ${createSpan(value.trim(), theme.string)};`
  );

  // Units and numbers
  highlighted = highlighted.replace(
    /\b\d+\.?\d*(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|deg|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?\b/g,
    (match) => createSpan(match, theme.number)
  );

  // Colors (hex)
  highlighted = highlighted.replace(/#[0-9a-fA-F]{3,8}\b/g, (match) =>
    createSpan(match, theme.constant)
  );

  // Important
  highlighted = highlighted.replace(/!important/g, (match) =>
    createSpan(match, theme.keyword)
  );

  return highlighted;
};

export const highlightHTML = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Comments
  highlighted = highlighted.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) =>
    createSpan(match, theme.comment)
  );

  // Doctype
  highlighted = highlighted.replace(/&lt;!DOCTYPE[^&]*&gt;/gi, (match) =>
    createSpan(match, theme.keyword)
  );

  // Tags with attributes
  highlighted = highlighted.replace(
    /(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?)(&gt;)/g,
    (match, openBracket, tagName, attributes, closeBracket) => {
      let result =
        createSpan(openBracket, theme.punctuation) +
        createSpan(tagName, theme.tag);

      // Highlight attributes
      if (attributes) {
        result += attributes.replace(
          /(\s+)([a-zA-Z0-9-]+)(=)(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g,
          (attrMatch, space, attrName, equals, attrValue) => {
            return (
              space +
              createSpan(attrName, theme.attribute) +
              equals +
              createSpan(attrValue, theme.string)
            );
          }
        );
      }

      result += createSpan(closeBracket, theme.punctuation);
      return result;
    }
  );

  return highlighted;
};

export const highlightJSON = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keys
  highlighted = highlighted.replace(
    /(&quot;[^&]*&quot;)\s*:/g,
    (match, key) => `${createSpan(key, theme.property)}:`
  );

  // String values
  highlighted = highlighted.replace(
    /:\s*(&quot;[^&]*&quot;)/g,
    (match, value) => `: ${createSpan(value, theme.string)}`
  );

  // Numbers
  highlighted = highlighted.replace(
    /:\s*(-?\d+\.?\d*([eE][+-]?\d+)?)/g,
    (match, number) => `: ${createSpan(number, theme.number)}`
  );

  // Booleans and null
  highlighted = highlighted.replace(
    /:\s*(true|false|null)/g,
    (match, value) => `: ${createSpan(value, theme.boolean)}`
  );

  return highlighted;
};

export const highlightJava = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keywords
  const keywords = [
    "abstract",
    "assert",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "goto",
    "if",
    "implements",
    "import",
    "instanceof",
    "int",
    "interface",
    "long",
    "native",
    "new",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "strictfp",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "try",
    "void",
    "volatile",
    "while",
  ];

  // Built-in classes and methods
  const builtInClasses = [
    "System",
    "String",
    "Integer",
    "Double",
    "Boolean",
    "Character",
    "Object",
    "ArrayList",
    "HashMap",
    "HashSet",
    "Scanner",
    "Math",
    "Arrays",
    "Collections",
    "Exception",
    "RuntimeException",
    "Thread",
    "Runnable",
  ];

  // Comments
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    createSpan(match, theme.comment)
  );
  highlighted = highlighted.replace(/\/\/.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );

  // Strings
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Numbers
  highlighted = highlighted.replace(
    /\b\d+\.?\d*([eE][+-]?\d+)?[fFdDlL]?\b/g,
    (match) => createSpan(match, theme.number)
  );

  // Keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.keyword)
    );
  });

  // Built-in classes
  builtInClasses.forEach((className) => {
    const regex = new RegExp(`\\b${className}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.class)
    );
  });

  // Annotations
  highlighted = highlighted.replace(/@[a-zA-Z_][a-zA-Z0-9_]*/g, (match) =>
    createSpan(match, theme.function)
  );

  return highlighted;
};

export const highlightSQL = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keywords
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "TABLE",
    "INDEX",
    "VIEW",
    "DATABASE",
    "SCHEMA",
    "TRIGGER",
    "PROCEDURE",
    "FUNCTION",
    "BEGIN",
    "END",
    "IF",
    "ELSE",
    "WHILE",
    "FOR",
    "LOOP",
    "RETURN",
    "DECLARE",
    "SET",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "REVOKE",
    "COMMIT",
    "ROLLBACK",
    "TRANSACTION",
    "SAVEPOINT",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "JOIN",
    "INNER",
    "LEFT",
    "RIGHT",
    "FULL",
    "OUTER",
    "ON",
    "USING",
    "GROUP",
    "BY",
    "HAVING",
    "ORDER",
    "ASC",
    "DESC",
    "LIMIT",
    "OFFSET",
    "DISTINCT",
    "ALL",
    "EXISTS",
    "IN",
    "BETWEEN",
    "LIKE",
    "IS",
    "NULL",
    "NOT",
    "AND",
    "OR",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "AS",
    "WITH",
    "RECURSIVE",
  ];

  // Data types
  const dataTypes = [
    "INT",
    "INTEGER",
    "BIGINT",
    "SMALLINT",
    "TINYINT",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "DOUBLE",
    "BIT",
    "BOOLEAN",
    "CHAR",
    "VARCHAR",
    "TEXT",
    "NCHAR",
    "NVARCHAR",
    "NTEXT",
    "BINARY",
    "VARBINARY",
    "IMAGE",
    "DATE",
    "TIME",
    "DATETIME",
    "DATETIME2",
    "SMALLDATETIME",
    "TIMESTAMP",
    "YEAR",
  ];

  // Comments
  highlighted = highlighted.replace(/--.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    createSpan(match, theme.comment)
  );

  // Strings
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, (match) =>
    createSpan(match, theme.number)
  );

  // Keywords (case insensitive)
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match.toUpperCase(), theme.keyword)
    );
  });

  // Data types
  dataTypes.forEach((type) => {
    const regex = new RegExp(`\\b${type}\\b`, "gi");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match.toUpperCase(), theme.class)
    );
  });

  return highlighted;
};

export const highlightBash = (
  code: string,
  theme: SyntaxTheme = lightTheme
): string => {
  let highlighted = escapeHtml(code);

  // Keywords and built-in commands
  const keywords = [
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "case",
    "esac",
    "for",
    "while",
    "until",
    "do",
    "done",
    "function",
    "return",
    "local",
    "export",
    "declare",
    "readonly",
    "unset",
    "shift",
    "break",
    "continue",
    "exit",
    "source",
    "alias",
    "unalias",
  ];

  const commands = [
    "ls",
    "cd",
    "pwd",
    "mkdir",
    "rmdir",
    "rm",
    "cp",
    "mv",
    "touch",
    "find",
    "grep",
    "sed",
    "awk",
    "sort",
    "uniq",
    "cut",
    "head",
    "tail",
    "cat",
    "less",
    "more",
    "chmod",
    "chown",
    "ps",
    "kill",
    "jobs",
    "bg",
    "fg",
    "nohup",
    "which",
    "whereis",
    "man",
    "info",
    "help",
    "history",
    "sudo",
    "su",
    "whoami",
    "id",
    "groups",
    "passwd",
    "ssh",
    "scp",
    "rsync",
    "wget",
    "curl",
    "tar",
    "gzip",
    "gunzip",
    "zip",
    "unzip",
    "df",
    "du",
    "free",
    "top",
    "htop",
    "uname",
    "date",
  ];

  // Comments
  highlighted = highlighted.replace(/#.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );

  // Strings
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Variables
  highlighted = highlighted.replace(
    /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}/g,
    (match) => createSpan(match, theme.variable)
  );

  // Numbers
  highlighted = highlighted.replace(/\b\d+\b/g, (match) =>
    createSpan(match, theme.number)
  );

  // Keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.keyword)
    );
  });

  // Commands
  commands.forEach((command) => {
    const regex = new RegExp(`\\b${command}\\b`, "g");
    highlighted = highlighted.replace(regex, (match) =>
      createSpan(match, theme.function)
    );
  });

  // Command flags
  highlighted = highlighted.replace(
    /\s(-{1,2}[a-zA-Z0-9-]+)/g,
    (match, flag) => ` ${createSpan(flag, theme.constant)}`
  );

  return highlighted;
};

export const applySyntaxHighlighting = (
  code: string,
  language: string,
  isDark: boolean = false
): string => {
  const theme = isDark ? darkTheme : lightTheme;

  switch (language.toLowerCase()) {
    case "javascript":
    case "js":
      return highlightJavaScript(code, theme);
    case "typescript":
    case "ts":
      return highlightJavaScript(code, theme); // TypeScript uses similar syntax
    case "python":
    case "py":
      return highlightPython(code, theme);
    case "css":
      return highlightCSS(code, theme);
    case "html":
      return highlightHTML(code, theme);
    case "json":
      return highlightJSON(code, theme);
    case "java":
      return highlightJava(code, theme);
    case "sql":
      return highlightSQL(code, theme);
    case "bash":
    case "shell":
    case "sh":
      return highlightBash(code, theme);
    case "cpp":
    case "c++":
      return highlightJava(code, theme); // Similar syntax to Java
    case "c":
      return highlightJava(code, theme); // Similar syntax to Java
    case "csharp":
    case "c#":
      return highlightJava(code, theme); // Similar syntax to Java
    case "php":
      return highlightJavaScript(code, theme); // Similar syntax patterns
    case "ruby":
      return highlightPython(code, theme); // Similar syntax patterns
    case "go":
      return highlightJava(code, theme); // Similar syntax to Java
    case "rust":
      return highlightJava(code, theme); // Similar syntax patterns
    case "yaml":
    case "yml":
      return highlightYAML(code, theme);
    case "xml":
      return highlightHTML(code, theme); // Similar to HTML
    case "markdown":
    case "md":
      return highlightMarkdown(code, theme);
    default:
      return escapeHtml(code);
  }
};

const highlightYAML = (code: string, theme: SyntaxTheme): string => {
  let highlighted = escapeHtml(code);

  // Comments
  highlighted = highlighted.replace(/#.*$/gm, (match) =>
    createSpan(match, theme.comment)
  );

  // Keys
  highlighted = highlighted.replace(
    /^(\s*)([a-zA-Z0-9_-]+)(\s*:)/gm,
    (match, indent, key, colon) =>
      `${indent}${createSpan(key, theme.property)}${colon}`
  );

  // Strings
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    createSpan(match, theme.string)
  );
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, (match) =>
    createSpan(match, theme.string)
  );

  // Booleans and null
  highlighted = highlighted.replace(/\b(true|false|null|~)\b/g, (match) =>
    createSpan(match, theme.boolean)
  );

  // Numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, (match) =>
    createSpan(match, theme.number)
  );

  return highlighted;
};

const highlightMarkdown = (code: string, theme: SyntaxTheme): string => {
  let highlighted = escapeHtml(code);

  // Headers
  highlighted = highlighted.replace(
    /^(#{1,6})\s+(.*)$/gm,
    (match, hashes, title) =>
      `${createSpan(hashes, theme.keyword)} ${createSpan(title, theme.class)}`
  );

  // Bold
  highlighted = highlighted.replace(/\*\*(.*?)\*\*/g, (match, content) =>
    createSpan(match, theme.keyword)
  );

  // Italic
  highlighted = highlighted.replace(/\*(.*?)\*/g, (match, content) =>
    createSpan(match, theme.keyword)
  );

  // Code blocks
  highlighted = highlighted.replace(/`([^`]+)`/g, (match, code) =>
    createSpan(match, theme.string)
  );

  // Links
  highlighted = highlighted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => createSpan(match, theme.function)
  );

  return highlighted;
};
