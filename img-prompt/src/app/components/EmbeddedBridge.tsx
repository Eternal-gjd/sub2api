"use client";

import { useEffect } from "react";
import { Button, Flex } from "antd";
import { ExportOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";

type ApplyAction = "insert" | "append" | "replace";

const isEmbeddedLocation = () => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get("embedded") === "1" || hash.get("embedded") === "1";
};

export function EmbeddedMode() {
  useEffect(() => {
    if (!isEmbeddedLocation()) return;
    document.body.classList.add("imgprompt-embedded");
    return () => document.body.classList.remove("imgprompt-embedded");
  }, []);
  return null;
}

export function EmbeddedPromptActions({ prompt, locale }: { prompt: string; locale: string }) {
  const chinese = locale === "zh" || locale === "zh-hant";
  const send = (action: ApplyAction) => {
    const value = prompt.trim();
    if (!value || window.parent === window) return;
    window.parent.postMessage({ type: "imgprompt:apply", action, prompt: value }, window.location.origin);
  };

  return (
    <Flex className="pp-embedded-actions" gap={8} wrap>
      <Button icon={<ExportOutlined />} disabled={!prompt.trim()} onClick={() => send("insert")}>
        {chinese ? "插入到光标" : "Insert at cursor"}
      </Button>
      <Button icon={<PlusOutlined />} disabled={!prompt.trim()} onClick={() => send("append")}>
        {chinese ? "追加" : "Append"}
      </Button>
      <Button type="primary" icon={<SwapOutlined />} disabled={!prompt.trim()} onClick={() => send("replace")}>
        {chinese ? "替换提示词" : "Replace prompt"}
      </Button>
    </Flex>
  );
}