import React from "react";
import type { Edge, Step } from "../engine/types";

interface EdgeListPanelProps {
    edges: Edge[];
    currentStep: Step | null;
}

export const EdgeListPanel: React.FC<EdgeListPanelProps> = ({
                                                                edges,
                                                                currentStep,
                                                            }) => {
    const sortedIds = currentStep?.sortedEdgeIds;
    const currentId = currentStep?.currentEdge?.id ?? null;

    // nếu chưa có sortedIds thì hiển thị theo thứ tự input
    const edgeMap: Record<string, Edge> = {};
    edges.forEach((e) => (edgeMap[e.id] = e));
    const displayEdges = sortedIds
        ? sortedIds.map((id) => edgeMap[id]).filter(Boolean)
        : edges;

    return (
        <div className="panel" style={{ marginTop: 8 }}>
            <h2>Thứ tự cạnh (sau khi sort)</h2>
            {displayEdges.length === 0 ? (
                <p>Chưa có cạnh.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                    {displayEdges.map((e) => {
                        const isCurrent = e.id === currentId;
                        return (
                            <li
                                key={e.id}
                                style={{
                                    padding: "4px 6px",
                                    borderRadius: 6,
                                    marginBottom: 2,
                                    backgroundColor: isCurrent ? "#0f172a" : "transparent",
                                    color: isCurrent ? "#f9fafb" : "#111827",
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                <span>
                  {e.u} – {e.v}
                </span>
                                <span>w = {e.w}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
