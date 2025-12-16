export type EdgeStatus = 'normal' | 'chosen' | 'rejected' | 'current';
export type NodeStatus = "normal" | "findStart" | "findWalk" | "findRoot";

export type DsuAction =
    | "edge_start"
    | "find_walk"
    | "find_compress"
    | "union_compare"
    | "union_attach"
    | "union_rank_inc"
    | "edge_chosen"
    | "edge_rejected";

export interface Edge {
    id: string;   // ví dụ "e0", "e1", ...
    u: number;   // đỉnh đầu
    v: number;   // đỉnh cuối
    w: number;   // trọng số
}

export interface Step {
    stepId: number;
    stepLabel?: string; // "3.1.2"
    currentEdge: Edge | null;
    edgeStatus: Record<string, EdgeStatus>; // key = edge.id
    sortedEdgeIds?: string[];
    mstEdges: string[];                     // danh sách edge.id đã vào MST
    highlightedLines: number[];             // các dòng Python cần tô đậm (1-based)
    explanation: string;                    // giải thích tiếng Việt
    mstWeight?: number;                     // tổng trọng số của MST tại bước này

    // mô tả trạng thái DSU
    dsuParent?: number[];   // length = n+1, index = node
    dsuRank?: number[];
    focusNodes?: number[];  // node đang được "chạm" ở step này (ví dụ trong find/union)

    dsuAction?: DsuAction;

    nodeStatus?: Record<string, NodeStatus>; // key: nodeId dạng "1","2"...
    truncated?: boolean;

    // mô tả cho find
    findNode?: number;        // đang find node nào
    findPath?: number[];      // đường u -> ... -> root (snapshot tại step)

    // mô tả cho union
    unionRoots?: [number, number]; // (pu, pv)
    unionSwapped?: boolean;        // có swap theo rank không
    unionAttached?: [number, number]; // gắn parent[childRoot]=parentRoot

    // mô tả trang thái DFS
    dfsSource?: number;
    dfsTarget?: number;
    dfsVisited?: number[];   // các đỉnh đã thăm khi kiểm tra đường đi giữa u và v

    note?: string;
    tags?: string[];

}