import type { EdgeStatus, Step } from "./types";
import type { ParsedGraph } from "./parser";

function hasPath(
    u: number,
    v: number,
    adj: Map<number, number[]>,
    visited: Set<number>
): boolean {
    if (u === v) return true;
    visited.add(u);
    const nei = adj.get(u) ?? [];
    for (const x of nei) {
        if (!visited.has(x) && hasPath(x, v, adj, visited)) {
            return true;
        }
    }
    return false;
}

export function buildKruskalDfsSteps(graph: ParsedGraph): Step[] {
    const { n, edges } = graph;

    const sorted = [...edges].sort((a, b) => {
        if (a.w !== b.w) return a.w - b.w;
        return a.id.localeCompare(b.id);
    });
    const sortedIds = sorted.map((e) => e.id);

    const steps: Step[] = [];
    const edgeStatus: Record<string, EdgeStatus> = {};
    sorted.forEach((e) => (edgeStatus[e.id] = "normal"));

    const mstEdges: string[] = [];
    let mstWeight = 0;

    const adj = new Map<number, number[]>();
    for (let i = 1; i <= n; i++) adj.set(i, []);

    let stepId = 1;

    // Bước khởi tạo
    steps.push({
        stepId: stepId++,
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        mstEdges: [...mstEdges],
        highlightedLines: [11, 12, 13, 14, 15], // trong PYTHON_KRUSKAL_DFS
        explanation:
            "Bắt đầu thuật toán Kruskal (phiên bản dùng DFS). Sắp xếp các cạnh theo trọng số tăng dần và khởi tạo danh sách kề adj.",
        mstWeight,
        sortedEdgeIds: sortedIds,
    });

    for (const e of sorted) {
        // reset trạng thái 'current'
        Object.keys(edgeStatus).forEach((id) => {
            if (edgeStatus[id] === "current") edgeStatus[id] = "normal";
        });

        edgeStatus[e.id] = "current";

        // bước: xét cạnh
        steps.push({
            stepId: stepId++,
            currentEdge: e,
            edgeStatus: { ...edgeStatus },
            mstEdges: [...mstEdges],
            highlightedLines: [16],
            explanation: `Xét cạnh (${e.u}, ${e.v}) có trọng số ${e.w}.`,
            mstWeight,
            sortedEdgeIds: sortedIds,
            dfsSource: e.u,
            dfsTarget: e.v,
            dfsVisited: [],        // chưa chạy DFS
        });

        const visited = new Set<number>();
        const pathExists = hasPath(e.u, e.v, adj, visited);
        const visitedArr = Array.from(visited);

        if (!pathExists) {
            // cạnh không tạo chu trình → thêm vào MST
            edgeStatus[e.id] = "chosen";
            mstEdges.push(e.id);
            mstWeight += e.w;

            // cập nhật adj
            adj.get(e.u)!.push(e.v);
            adj.get(e.v)!.push(e.u);

            steps.push({
                stepId: stepId++,
                currentEdge: e,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [9, 18, 19, 20, 21, 22],
                explanation:
                    "DFS không tìm thấy đường đi giữa hai đỉnh trong cây hiện tại, nên cạnh này không tạo chu trình và được thêm vào MST.",
                mstWeight,
                sortedEdgeIds: sortedIds,
                dfsSource: e.u,
                dfsTarget: e.v,
                dfsVisited: visitedArr,
            });
        } else {
            // cạnh tạo chu trình → loại
            edgeStatus[e.id] = "rejected";

            steps.push({
                stepId: stepId++,
                currentEdge: e,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [3, 18],
                explanation:
                    "DFS tìm được đường đi giữa hai đỉnh trong cây hiện tại, nếu thêm cạnh này sẽ tạo chu trình nên phải loại bỏ.",
                mstWeight,
                sortedEdgeIds: sortedIds,
                dfsSource: e.u,
                dfsTarget: e.v,
                dfsVisited: visitedArr,
            });
        }
    }

    // bước kết thúc
    steps.push({
        stepId: stepId++,
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        mstEdges: [...mstEdges],
        highlightedLines: [23],
        explanation: `Thuật toán Kruskal-DFS kết thúc. Tổng trọng số cây khung nhỏ nhất là ${mstWeight}.`,
        mstWeight,
        sortedEdgeIds: sortedIds,
    });

    return steps;
}
