import React from "react";
import type { Edge, Step } from "../engine/types";

interface DFSPanelProps {
    edges: Edge[];
    currentStep: Step | null;
}

export const DFSPanel: React.FC<DFSPanelProps> = ({
                                                      edges,
                                                      currentStep,
                                                  }) => {
    const src = currentStep?.dfsSource;
    const dst = currentStep?.dfsTarget;
    const visited = currentStep?.dfsVisited ?? [];

    // Xây adjacency từ các cạnh thuộc MST ở bước này
    const mstEdgeIds = currentStep?.mstEdges ?? [];
    const edgeMap: Record<string, Edge> = {};
    edges.forEach((e) => (edgeMap[e.id] = e));

    const adj: Record<number, number[]> = {};
    mstEdgeIds.forEach((id) => {
        const e = edgeMap[id];
        if (!e) return;
        if (!adj[e.u]) adj[e.u] = [];
        if (!adj[e.v]) adj[e.v] = [];
        adj[e.u].push(e.v);
        adj[e.v].push(e.u);
    });

    const nodesWithNeighbors = Object.keys(adj)
        .map((k) => Number(k))
        .sort((a, b) => a - b);

    if (!src || !dst) {
        return (
            <div>
                <p>Trong bước này chưa chạy DFS để kiểm tra chu trình.</p>
            </div>
        );
    }

    return (
        <div>
            <p style={{ fontSize: 13 }}>
                Đang kiểm tra xem có đường đi giữa <strong>{src}</strong> và{" "}
                <strong>{dst}</strong> trong cây hiện tại hay không.
            </p>

            <p style={{ fontSize: 13, marginTop: 4 }}>
                Các đỉnh DFS đã thăm:{" "}
                {visited.length === 0
                    ? "chưa có (mới bắt đầu kiểm tra)."
                    : visited.join(" \u2192 ")}
            </p>

            <div
                style={{
                    marginTop: 8,
                    maxHeight: 180,
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
                            background: "#f9fafb",
                            zIndex: 1,
                        }}
                    >
                    <tr>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>Node</th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>Neighbors</th>
                    </tr>
                    </thead>
                    <tbody>
                    {nodesWithNeighbors.length === 0 ? (
                        <tr>
                            <td style={{ padding: "4px 6px" }} colSpan={2}>
                                Chưa có cạnh nào trong MST ở bước này.
                            </td>
                        </tr>
                    ) : (
                        nodesWithNeighbors.map((u) => (
                            <tr key={u}>
                                <td style={{ padding: "2px 6px" }}>{u}</td>
                                <td style={{ padding: "2px 6px" }}>
                                    {adj[u].join(", ")}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
