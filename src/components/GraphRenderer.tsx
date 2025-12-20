import React, {useEffect, useRef, useState} from "react";
import type { Edge, Step } from "../engine/types";
import Graph from "graphology";
import Sigma from "sigma";

interface GraphRendererProps {
    nodes: number[];
    edges: Edge[];
    currentStep: Step | null;
}

interface TooltipInfo {
    visible: boolean;
    x: number;
    y: number;
    content: string;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
                                                                nodes,
                                                                edges,
                                                                currentStep,
                                                            }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const rendererRef = useRef<Sigma | null>(null);
    const baseEdgeSizeRef = useRef<number>(1);
    const [tooltip, setTooltip] = useState<TooltipInfo>({ visible: false, x: 0, y: 0, content: "" });

    // Khởi tạo graph + sigma mọi khi nodes/edges thay đổi
    useEffect(() => {
        if (!containerRef.current) return;

        // cleanup renderer cũ (nếu có)
        if (rendererRef.current) {
            rendererRef.current.kill();
            rendererRef.current = null;
        }

        const graph = new Graph();

        const nodeCount = nodes.length || 1;
        const edgeCount = edges.length;

        const nodeSize = 30 / Math.sqrt(nodeCount);
        const baseEdgeSize = 20 / Math.sqrt(edgeCount);
        const labelSize = 50 / nodeCount;

        baseEdgeSizeRef.current = baseEdgeSize;

        // Layout vòng tròn
        const radius = Math.max(100, nodeCount * 8); // càng nhiều node → vòng tròn to hơn
        nodes.forEach((nodeId, index) => {
            const angle = (2 * Math.PI * index) / nodeCount;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            graph.addNode(String(nodeId), {
                x,
                y,
                size: nodeSize,
                label: String(nodeId),
                color: "#0f172a",
                labelSize,
            });
        });

        edges.forEach((e) => {
            if (!graph.hasNode(String(e.u)) || !graph.hasNode(String(e.v))) return;

            graph.addEdgeWithKey(e.id, String(e.u), String(e.v), {
                label: String(e.w),
                size: baseEdgeSize,  // sẽ được override sau khi có status
                color: "#1e3260",
                labelSize: labelSize * 1.2,
            });
        });

        const renderer = new Sigma(graph, containerRef.current, {
            renderEdgeLabels: true,
            enableEdgeEvents: true,
        });

        // Bind events cho hover edge
        renderer.on('enterEdge', (event) => {
            const edgeId = event.edge;
            const graph = graphRef.current;
            if (!graph) return;

            // Lấy u, v từ graphology methods
            const u = graph.source(edgeId);
            const v = graph.target(edgeId);
            const w = graph.getEdgeAttribute(edgeId, 'label');

            // Lấy status từ statusMap nếu có
            const statusMap = currentStep?.edgeStatus ?? {};
            const status = statusMap[edgeId] ?? "normal";
            let statusText = "";
            switch (status) {
                case "current": statusText = " (đang xét)"; break;
                case "chosen": statusText = " (thuộc MST)"; break;
                case "rejected": statusText = " (bị loại)"; break;
            }

            // Hiện tooltip tại vị trí mouse
            // Lấy tọa độ từ originalEvent (MouseEvent gốc)
            // Kiểm tra kiểu của originalEvent
            const originalEvent = event.event.original;
            let clientX = 0;
            let clientY = 0;

            if (originalEvent instanceof MouseEvent) {
                clientX = originalEvent.clientX;
                clientY = originalEvent.clientY;
            } else if (originalEvent instanceof TouchEvent && originalEvent.touches.length > 0) {
                clientX = originalEvent.touches[0].clientX;
                clientY = originalEvent.touches[0].clientY;
            }

            setTooltip({
                visible: true,
                x: clientX + 10,
                y: clientY + 10,
                content: `Cạnh ${u}-${v}: ${w}${statusText}`,
            });
        });

        renderer.on('leaveEdge', () => {
            // Ẩn tooltip khi leave
            setTooltip({ visible: false, x: 0, y: 0, content: "" });
        });

        graphRef.current = graph;
        rendererRef.current = renderer;

        return () => {
            renderer.kill();
            graphRef.current = null;
            rendererRef.current = null;
        };
    }, [nodes, edges, currentStep]);

    // Cập nhật màu/thickness cạnh mỗi khi currentStep đổi
    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;

        const statusMap = currentStep?.edgeStatus ?? {};
        const dfsEdgeOverlay = currentStep?.dfsEdgeOverlay ?? {};

        edges.forEach((e) => {
            const status = statusMap[e.id] ?? "normal";
            const baseEdgeSize = baseEdgeSizeRef.current;

            // 1. Base color/size từ Kruskal
            let color = "#1e3260";
            let size = baseEdgeSize;

            switch (status) {
                case "current":   color = "#facc15"; size = baseEdgeSize; break;
                case "chosen":    color = "#22c55e"; size = baseEdgeSize * 1.5; break;
                case "rejected":  color = "#dcd4d4"; size = baseEdgeSize * 0.8; break;
            }

            // 2. Nếu có DFS overlay → override (chồng lên)
            const dfsOv = dfsEdgeOverlay[e.id];
            if (dfsOv) {
                switch (dfsOv) {
                    case "candidate":
                        color = "#f97316"; size = baseEdgeSize; break;
                    case "active":
                        color = "#00ffc4"; size = baseEdgeSize; break;
                    case "dead":
                        color = "#86ca9f"; size = baseEdgeSize * 0.8; break;
                }
            }

            if (graph.hasEdge(e.id)) {
                graph.setEdgeAttribute(e.id, "color", color);
                graph.setEdgeAttribute(e.id, "size", size);
            }
        });

        const nodeStatus = currentStep?.nodeStatus ?? {};
        nodes.forEach((id) => {
            const key = String(id);
            const st = nodeStatus[key] ?? "normal";

            let color = "#0f172a";
            switch (st) {
                case "findStart": color = "#00ffc4"; break;
                case "findWalk":  color = "#facc15"; break;
                case "findRoot":  color = "#d800ff"; break;
            }
            if (graph.hasNode(key)) graph.setNodeAttribute(key, "color", color);
        });

    }, [currentStep, edges, nodes]);

    return (
        <div className="panel" style={{ position: 'relative' }}>
            <h2>Graph</h2>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "320px",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
            />
            {tooltip.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y,
                        background: '#fff',
                        border: '1px solid #ccc',
                        padding: '8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};
