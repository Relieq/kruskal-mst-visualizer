import type { EdgeStatus, Step } from "./types";
import type { ParsedGraph } from "./parser";

class DSU {
    parent: number[];
    rank: number[];

    constructor(n: number) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.rank = Array(n + 1).fill(0);
    }

    find(u: number): number {
        if (this.parent[u] !== u) {
            this.parent[u] = this.find(this.parent[u]);
        }
        return this.parent[u];
    }

    union(u: number, v: number): boolean {
        let pu = this.find(u);
        let pv = this.find(v);
        if (pu === pv) return false;

        if (this.rank[pu] < this.rank[pv]) {
            [pu, pv] = [pv, pu];
        }
        this.parent[pv] = pu;
        if (this.rank[pu] === this.rank[pv]) {
            this.rank[pu] += 1;
        }
        return true;
    }
}

export function buildKruskalDsuSteps(graph: ParsedGraph): Step[] {
    const { n, edges } = graph;

    // sort edges theo w tăng dần, nếu bằng nhau thì theo id để ổn định
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
    const dsu = new DSU(n);
    let stepId = 1;

    // Step 1: khởi động thuật toán
    steps.push({
        stepId: stepId++,
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        sortedEdgeIds: sortedIds,
        mstEdges: [...mstEdges],
        highlightedLines: [22, 23, 24, 25, 26], // def kruskal + chuẩn bị biến
        explanation:
            "Bắt đầu thuật toán Kruskal: sắp xếp các cạnh theo trọng số tăng dần và khởi tạo DSU, mst_weight, mst_edges.",
        mstWeight,
    });

    for (const e of sorted) {
        // reset cạnh đang xét trước đó (nếu có)
        Object.keys(edgeStatus).forEach((id) => {
            if (edgeStatus[id] === "current") edgeStatus[id] = "normal";
        });

        // step: xét cạnh e
        edgeStatus[e.id] = "current";

        steps.push({
            stepId: stepId++,
            currentEdge: e,
            edgeStatus: { ...edgeStatus },
            sortedEdgeIds: sortedIds,
            mstEdges: [...mstEdges],
            highlightedLines: [27], // for u, v, w in edges
            explanation: `Xét cạnh (${e.u}, ${e.v}) có trọng số ${e.w}.`,
            mstWeight,
        });

        const pu = dsu.find(e.u);
        const pv = dsu.find(e.v);

        if (pu !== pv) {
            dsu.union(e.u, e.v);
            edgeStatus[e.id] = "chosen";
            mstEdges.push(e.id);
            mstWeight += e.w;

            steps.push({
                stepId: stepId++,
                currentEdge: e,
                edgeStatus: { ...edgeStatus },
                sortedEdgeIds: sortedIds,
                mstEdges: [...mstEdges],
                highlightedLines: [28, 29, 30], // if dsu.union ... + cập nhật mst_weight, mst_edges
                explanation: `Hai đỉnh thuộc hai thành phần khác nhau, thêm cạnh này vào MST. Tổng trọng số MST hiện tại: ${mstWeight}.`,
                mstWeight,
            });
        } else {
            edgeStatus[e.id] = "rejected";
            steps.push({
                stepId: stepId++,
                currentEdge: e,
                edgeStatus: { ...edgeStatus },
                sortedEdgeIds: sortedIds,
                mstEdges: [...mstEdges],
                highlightedLines: [28], // if dsu.union(u, v):  (nhưng union trả về False)
                explanation:
                    "Hai đỉnh đã nằm trong cùng một thành phần (nếu thêm sẽ tạo chu trình), nên loại cạnh này khỏi MST.",
                mstWeight,
            });
        }
    }

    // bước kết thúc
    steps.push({
        stepId: stepId++,
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        sortedEdgeIds: sortedIds,
        mstEdges: [...mstEdges],
        highlightedLines: [31], // return mst_weight, mst_edges
        explanation: `Thuật toán kết thúc. Tổng trọng số của cây khung nhỏ nhất là ${mstWeight}.`,
        mstWeight,
    });

    return steps;
}
