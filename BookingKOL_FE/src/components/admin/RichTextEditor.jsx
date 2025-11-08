import { useMemo, useRef } from "react";
import { CKEditor } from "ckeditor4-react";
import { BASE_URL } from "../../utils/config";

const DEFAULT_EDITOR_URL =
  "https://cdn.ckeditor.com/4.22.1/full-all/ckeditor.js";

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

const setupEditorUploadHandlers = (editor) => {
  if (!editor || !BLOG_UPLOAD_URL) return;

  const handleUploadRequest = (evt) => {
    const fileLoader = evt?.data?.fileLoader;
    const file = fileLoader?.file;
    if (!fileLoader || !file) return;

    const xhr = fileLoader.xhr;
    const formData = new FormData();
    formData.append("file", file, file.name || fileLoader.fileName || "image");

    xhr.open("POST", BLOG_UPLOAD_URL, true);
    xhr.setRequestHeader("Accept", "application/json");

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.send(formData);
    evt.stop();
  };

  const handleUploadResponse = (evt) => {
    const fileLoader = evt?.data?.fileLoader;
    const responseText = fileLoader?.xhr?.responseText;
    const parsed = responseText
      ? safeJsonParse(responseText) ?? responseText
      : null;

    const imageUrl = resolveUploadedFileUrl(parsed);
    if (!imageUrl) {
      evt.cancel();
      evt.data.message =
        (parsed && typeof parsed === "object" && parsed.message) ||
        "Khong lay duoc URL anh tu phan hoi may chu.";
      return;
    }

    evt.data.url = imageUrl;
    evt.stop();
  };

  editor.on("fileUploadRequest", handleUploadRequest);
  editor.on("fileUploadResponse", handleUploadResponse);

  editor.on("destroy", () => {
    editor.removeListener("fileUploadRequest", handleUploadRequest);
    editor.removeListener("fileUploadResponse", handleUploadResponse);
  });
};

const TOOLBAR_CONFIG = [
  {
    name: "document",
    items: ["Source", "-", "Preview", "Print", "-", "Templates"],
  },
  { name: "clipboard", items: ["Cut", "Copy", "Paste", "-", "Undo", "Redo"] },
  {
    name: "basicstyles",
    items: ["Bold", "Italic", "Underline", "Strike", "-", "RemoveFormat"],
  },
  {
    name: "paragraph",
    items: [
      "NumberedList",
      "BulletedList",
      "-",
      "Outdent",
      "Indent",
      "-",
      "Blockquote",
      "-",
      "JustifyLeft",
      "JustifyCenter",
      "JustifyRight",
      "JustifyBlock",
    ],
  },
  { name: "links", items: ["Link", "Unlink", "Anchor"] },
  {
    name: "insert",
    items: ["Image", "Table", "HorizontalRule", "SpecialChar", "Iframe"],
  },
  { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
  { name: "colors", items: ["TextColor", "BGColor"] },
  { name: "tools", items: ["Maximize", "ShowBlocks"] },
];

const RichTextEditor = ({
  value = "",
  onChange,
  disabled = false,
  placeholder = "Nh?p n?i dung...",
}) => {
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      toolbar: TOOLBAR_CONFIG,
      extraPlugins:
        "uploadimage,uploadfile,colorbutton,colordialog,font,justify,autogrow",
      removePlugins: "elementspath,easyimage",
      autoGrow_minHeight: 260,
      autoGrow_maxHeight: 600,
      allowedContent: true,
      resize_enabled: true,
      readOnly: disabled,
      placeholder,
      filebrowserUploadUrl: BLOG_UPLOAD_URL,
      filebrowserImageUploadUrl: BLOG_UPLOAD_URL,
      filebrowserUploadMethod: "form",
    }),
    [disabled, placeholder]
  );

  return (
    <div className="rich-text-editor border border-gray-200 rounded-lg overflow-hidden">
      <style>{`
        .cke_notification,
        .cke_notification_message,
        .cke_notifications_area {
          display: none !important;
        }
      `}</style>

      <CKEditor
        editorUrl={DEFAULT_EDITOR_URL}
        initData={value}
        config={editorConfig}
        readOnly={disabled}
        onInstanceReady={({ editor }) => {
          editorRef.current = editor;
          setupEditorUploadHandlers(editor);
          if (!value) editor.setData("");
        }}
        onChange={({ editor }) => onChange?.(editor.getData())}
      />
    </div>
  );
};

export default RichTextEditor;

