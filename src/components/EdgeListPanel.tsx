import React, {useEffect, useRef} from "react";
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
    const listRef = useRef<HTMLUListElement | null>(null);

    // Khi currentId đổi → scroll vào giữa
    useEffect(() => {
        if (!listRef.current || !currentId) return;

        const list = listRef.current;
        const el = listRef.current.querySelector<HTMLLIElement>(
            `li[data-edge-id="${currentId}"]`
        );
        if (!el) return;

        // Vị trí của list và element trong viewport - màn hình người dùng
        const listRect = list.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Vị trí hiện tại của element relative to viewport - vị trí list
        const elTopRelativeToList = elRect.top - listRect.top + list.scrollTop; // scrollTop: cuộn lên

        const targetTop = elTopRelativeToList - list.clientHeight / 2 + el.clientHeight / 2;

        list.scrollTo({
            top: Math.max(0, targetTop),
            behavior: "smooth",
        });
    }, [currentId]);

    return (
        <div className="panel" style={{ marginTop: 8 }}>
            <h2>Thứ tự cạnh (sau khi sort)</h2>
            {displayEdges.length === 0 ? (
                <p>Chưa có cạnh.</p>
            ) : (
                <ul
                    ref={listRef}
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        fontSize: 13,
                        maxHeight: 160,          // giới hạn chiều cao
                        overflowY: "auto",       // có thanh cuộn dọc
                    }}
                >
                    {displayEdges.map((e) => {
                        const isCurrent = e.id === currentId;
                        return (
                            <li
                                key={e.id}
                                data-edge-id={e.id}   // để querySelect
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
