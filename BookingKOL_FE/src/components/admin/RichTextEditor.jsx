import { useCallback, useEffect, useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { BASE_URL } from "../../utils/config";

const BLOG_UPLOAD_PATH = "/v1/admin/blogs/file/upload";

const stripTrailingSlash = (value) =>
  typeof value === "string" ? value.replace(/\/+$/, "") : "";

const BLOG_UPLOAD_URL = (() => {
  const base = stripTrailingSlash(BASE_URL || "");
  if (!base) return BLOG_UPLOAD_PATH;
  const needsPathTrim = base.endsWith("/v1");
  const normalizedPath = needsPathTrim
    ? BLOG_UPLOAD_PATH.replace(/^\/?v1/, "")
    : BLOG_UPLOAD_PATH;
  return `${base}${
    normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`
  }`;
})();

const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage?.getItem("auth_token") ??
    window.sessionStorage?.getItem("auth_token") ??
    ""
  );
};

const safeJsonParse = (value) => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const resolveUploadedFileUrl = (payload) => {
  if (!payload) return undefined;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
      return trimmed;
    }
    const parsed = safeJsonParse(trimmed);
    return resolveUploadedFileUrl(parsed);
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const candidate = resolveUploadedFileUrl(item);
      if (candidate) return candidate;
    }
    return undefined;
  }

  if (typeof payload === "object") {
    const directKeys = ["fileUrl", "url", "location", "link", "imageUrl"];
    for (const key of directKeys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    if (payload.data) {
      const nested = resolveUploadedFileUrl(payload.data);
      if (nested) return nested;
    }

    if (payload.result) {
      const nested = resolveUploadedFileUrl(payload.result);
      if (nested) return nested;
    }
  }

  return undefined;
};

const uploadImage = async (blobInfo) => {
  if (!BLOG_UPLOAD_URL) {
    throw new Error("Không tìm thấy URL tải lên.");
  }

  const file = blobInfo?.blob();
  if (!file) {
    throw new Error("Không thể đọc dữ liệu tệp.");
  }

  const formData = new FormData();
  formData.append("file", file, blobInfo.filename() || "image");

  const headers = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(BLOG_UPLOAD_URL, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await response.text();
  const payload = safeJsonParse(text) ?? text;

  if (!response.ok) {
    const errorMessage =
      (typeof payload === "object" && payload?.message) ||
      `Tải ảnh thất bại (${response.status}).`;
    throw new Error(errorMessage);
  }

  const imageUrl = resolveUploadedFileUrl(payload);
  if (!imageUrl) {
    const fallbackMessage =
      (typeof payload === "object" && payload?.message) ||
      "Không lấy được URL ảnh từ phản hồi máy chủ.";
    throw new Error(fallbackMessage);
  }

  return imageUrl;
};

const createImageUploadHandler = () => {
  if (!BLOG_UPLOAD_URL) return undefined;

  return async (blobInfo) => {
    try {
      const url = await uploadImage(blobInfo);
      return url;
    } catch (error) {
      const message =
        error?.message || "Không thể tải ảnh lên. Vui lòng thử lại.";
      throw new Error(message);
    }
  };
};

const createFilePickerHandler = () => {
  if (typeof window === "undefined" || !BLOG_UPLOAD_URL) return undefined;

  return async (callback, value, meta) => {
    if (!meta || meta.filetype !== "image") {
      callback(value);
      return;
    }

    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const pseudoBlobInfo = {
        blob: () => file,
        filename: () => file.name || "image",
      };

      try {
        const url = await uploadImage(pseudoBlobInfo);
        callback(url, { title: file.name });
      } catch (error) {
        const message =
          error?.message || "Không thể tải ảnh lên. Vui lòng thử lại.";
        window.alert?.(message);
        console.error("Image upload failed:", error);
      } finally {
        input.value = "";
      }
    };

    input.click();
  };
};

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

const TINYMCE_LANGUAGE = {
  code: "vi",
  url: (() => {
    const assetPath = "/tinymce/langs/vi.js";
    const base = stripTrailingSlash(import.meta.env?.BASE_URL ?? "");
    if (!base) return assetPath;
    return assetPath.startsWith("/")
      ? `${base}${assetPath}`
      : `${base}/${assetPath}`;
  })(),
};

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
  const imageUploadHandler = useMemo(createImageUploadHandler, []);
  const filePickerHandler = useMemo(createFilePickerHandler, []);

  const initConfig = useMemo(() => {
    const baseConfig = {
      min_height: 500,
      menubar: true,
      plugins: PLUGINS.join(" "),
      toolbar: TOOLBAR,
      toolbar_mode: "sliding",
      placeholder,
      language: TINYMCE_LANGUAGE.code,
      language_url: TINYMCE_LANGUAGE.url,
      branding: false,
      promotion: false,
      automatic_uploads: Boolean(imageUploadHandler),
      file_picker_types: "file image media",
      quickbars_selection_toolbar:
        "bold italic underline | quicklink | alignleft aligncenter alignright | h2 h3 blockquote",
      image_advtab: true,
      image_caption: true,
      table_default_attributes: { border: "1" },
      content_style:
        "body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }",
    };

    if (imageUploadHandler) {
      baseConfig.images_upload_handler = imageUploadHandler;
    }
    if (filePickerHandler) {
      baseConfig.file_picker_callback = filePickerHandler;
    }

    return baseConfig;
  }, [filePickerHandler, imageUploadHandler, placeholder]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (safeValue === lastValueRef.current) return;

    editor.setContent(safeValue);
    lastValueRef.current = safeValue;
  }, [safeValue]);

  const handleInit = useCallback(
    (_, editor) => {
      editorRef.current = editor;
      editor.setContent(safeValue);
      lastValueRef.current = safeValue;
    },
    [safeValue]
  );

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
