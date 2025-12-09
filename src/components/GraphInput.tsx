import React, { useState } from "react";
import { parseGraphInput } from "../engine/parser";
import type { ParsedGraph } from "../engine/parser";

interface GraphInputProps {
    onGraphLoaded: (graph: ParsedGraph) => void;
}

const SAMPLE_INPUT = `5 8
1 2 1
1 3 4
1 5 1
2 4 2
2 5 1
3 4 3
3 5 3
4 5 2`;

export const GraphInput: React.FC<GraphInputProps> = ({ onGraphLoaded }) => {
    const [text, setText] = useState(SAMPLE_INPUT);
    const [error, setError] = useState<string | null>(null);

    const handleLoad = () => {
        const result = parseGraphInput(text);
        if (!result.ok || !result.graph) {
            setError(result.error ?? "Input không hợp lệ.");
            return;
        }

        // Giới hạn kích thước để visual không bị vỡ
        if (result.graph.n > 30 || result.graph.m > 50) {
            setError(
                `Đồ thị hơi lớn để hiển thị rõ (N <= 30, M <= 50). Hiện tại: N=${result.graph.n}, M=${result.graph.m}.`
            );
            // vẫn cho load, chỉ cảnh báo
        } else {
            setError(null);
        }

        onGraphLoaded(result.graph);
    };

    return (
        <div className="panel" style={{ marginBottom: 12 }}>
            <h2>Nhập đồ thị</h2>
            <p style={{ fontSize: 12, color: "#6b7280" }}>
                Định dạng: dòng 1 là <code>N M</code>, các dòng sau là <code>u v w</code>.
            </p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                style={{
                    width: "100%",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                    padding: "8px",
                    boxSizing: "border-box",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    resize: "vertical",
                }}
            />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                    onClick={handleLoad}
                    style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "1px solid #4f46e5",
                        background: "#4f46e5",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Tải đồ thị
                </button>
                {error && (
                    <span style={{ fontSize: 12, color: "#b91c1c" }}>
            {error}
          </span>
                )}
            </div>
        </div>
    );
};
