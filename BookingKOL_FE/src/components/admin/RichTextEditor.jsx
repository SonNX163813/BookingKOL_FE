import { useCallback, useEffect, useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/content/default/content.min.css";
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/autosave";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/codesample";
import "tinymce/plugins/directionality";
import "tinymce/plugins/emoticons";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/image";
import "tinymce/plugins/importcss";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/preview";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/visualchars";
import "tinymce/plugins/wordcount";

const PLUGINS = [
  "advlist",
  "anchor",
  "autolink",
  "autoresize",
  "autosave",
  "charmap",
  "code",
  "codesample",
  "directionality",
  "emoticons",
  "fullscreen",
  "help",
  "image",
  "importcss",
  "insertdatetime",
  "link",
  "lists",
  "media",
  "preview",
  "quickbars",
  "searchreplace",
  "table",
  "visualblocks",
  "visualchars",
  "wordcount",
];

const TOOLBAR =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough removeformat | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | emoticons charmap codesample | fullscreen preview code";

const normalizeValue = (value) =>
  typeof value === "string" ? value : value?.toString() || "";

const RichTextEditor = ({
  value = "",
  onChange,
  disabled = false,
  placeholder = "Nhập nội dung...",
}) => {
  const safeValue = normalizeValue(value);
  const editorRef = useRef(null);
  const lastValueRef = useRef(safeValue);

  const initConfig = useMemo(
    () => ({
      height: 420,
      menubar: true,
      plugins: PLUGINS.join(" "),
      toolbar: TOOLBAR,
      toolbar_mode: "sliding",
      placeholder,
      branding: false,
      promotion: false,
      quickbars_selection_toolbar:
        "bold italic underline | quicklink | alignleft aligncenter alignright | h2 h3 blockquote",
      image_advtab: true,
      image_caption: true,
      table_default_attributes: { border: "1" },
      content_style:
        "body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }",
    }),
    [placeholder]
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (safeValue === lastValueRef.current) return;

    editor.setContent(safeValue);
    lastValueRef.current = safeValue;
  }, [safeValue]);

  const handleInit = useCallback((_, editor) => {
    editorRef.current = editor;
    editor.setContent(safeValue);
    lastValueRef.current = safeValue;
  }, [safeValue]);

  const handleChange = useCallback(
    (content) => {
      lastValueRef.current = content;
      onChange?.(content);
    },
    [onChange]
  );

  useEffect(
    () => () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    },
    []
  );

  return (
    <div className="rich-text-editor border border-gray-200 rounded-lg overflow-hidden">
      <Editor
        value={safeValue}
        disabled={disabled}
        init={initConfig}
        onInit={handleInit}
        onEditorChange={handleChange}
      />
    </div>
  );
};

export default RichTextEditor;
