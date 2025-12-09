export type EdgeStatus = 'normal' | 'chosen' | 'rejected' | 'current';

export interface Edge {
    id: string;   // ví dụ "e0", "e1", ...
    u: number;   // đỉnh đầu
    v: number;   // đỉnh cuối
    w: number;   // trọng số
}

export interface Step {
    stepId: number;
    currentEdge: Edge | null;
    edgeStatus: Record<string, EdgeStatus>; // key = edge.id
    sortedEdgeIds?: string[];
    mstEdges: string[];                     // danh sách edge.id đã vào MST
    highlightedLines: number[];             // các dòng Python cần tô đậm (1-based)
    explanation: string;                    // giải thích tiếng Việt
    mstWeight?: number;                     // tổng trọng số của MST tại bước này
    note?: string;
    tags?: string[];
}