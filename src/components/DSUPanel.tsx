import React, { useEffect, useRef, useState } from "react";
import type { Step } from "../engine/types";

interface DSUPanelProps {
    currentStep: Step | null;
}

export const DSUPanel: React.FC<DSUPanelProps> = ({ currentStep }) => {
    const parent = currentStep?.dsuParent;
    const rank = currentStep?.dsuRank;
    const focusNodes = currentStep?.focusNodes ?? [];

    const [focusIndex, setFocusIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // mỗi step mới → reset về node focus đầu tiên
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFocusIndex(0);
    }, [currentStep?.stepId]);

    // auto-scroll đến node đang focusIndex
    useEffect(() => {
        if (!containerRef.current || !parent) return;
        if (focusNodes.length === 0) return;

        const node = focusNodes[Math.min(focusIndex, focusNodes.length - 1)];
        const list = containerRef.current;
        const row = list.querySelector<HTMLTableRowElement>(
            `tr[data-node-id="${node}"]`
        );
        if (!row) return;

        const listRect = list.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();

        // Vị trí hiện tại của row relative to viewport - vị trí list
        const rowTopRelativeToList = rowRect.top - listRect.top + list.scrollTop;

        const targetTop = rowTopRelativeToList - list.clientHeight / 2 + row.clientHeight / 2;

        list.scrollTo({
            top: targetTop,
            behavior: "smooth",
        });
    }, [parent, focusNodes, focusIndex]);

    if (!parent || !rank) {
        return (
            <div>
                <p>Chưa khởi tạo DSU.</p>
            </div>
        );
    }

    const n = parent.length - 1;
    const focusSet = new Set(focusNodes);

    const handleNextFocus = () => {
        if (focusNodes.length === 0) return;
        setFocusIndex((i) => (i + 1) % focusNodes.length);
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginBottom: 4,
                }}
            >
                {focusNodes.length > 0 && (
                    <button
                        onClick={handleNextFocus}
                        style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid #0ea5e9",
                            background: "#e0f2fe",
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        Tìm node đang xét
                    </button>
                )}
            </div>

            <div
                ref={containerRef}
                style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        fontSize: 13,
                        borderCollapse: "collapse",
                    }}
                >
                    <thead
                        style={{
                            position: "sticky",
                            top: 0,
                            background: "#f9fafb", // để che body bên dưới
                            zIndex: 1,
                        }}
                    >
                    <tr>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>Node</th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>Parent</th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>Rank</th>
                    </tr>
                    </thead>
                    <tbody>
                    {Array.from({ length: n }, (_, i) => i + 1).map((u) => {
                        const isFocus = focusSet.has(u);
                        return (
                            <tr
                                key={u}
                                data-node-id={u}
                                style={{
                                    backgroundColor: isFocus
                                        ? "rgba(0,255,216,0.1)"
                                        : "transparent",
                                }}
                            >
                                <td style={{ padding: "2px 6px" }}>{u}</td>
                                <td style={{ padding: "2px 6px" }}>{parent[u]}</td>
                                <td style={{ padding: "2px 6px" }}>{rank[u]}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                Các hàng được tô là các đỉnh đang được xử lý trong bước này.
            </p>
        </div>
    );
};
