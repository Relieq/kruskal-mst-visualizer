import type { EdgeStatus, Step } from "./types";
import type { ParsedGraph } from "./parser";

export interface DfsSimOptions {
    detailed: boolean;      // coarse vs detailed
    maxDfsSteps: number;    // cap số step DFS cho 1 lần hasPathTrace (tránh nổ step)
}

// function hasPath(
//     u: number,
//     v: number,
//     adj: Map<number, number[]>,
//     visited: Set<number>
// ): boolean {
//     if (u === v) return true;
//     visited.add(u);
//     const nei = adj.get(u) ?? [];
//     for (const x of nei) {
//         if (!visited.has(x) && hasPath(x, v, adj, visited)) {
//             return true;
//         }
//     }
//     return false;
// }

function hasPathTrace(params: {
    start: number;
    target: number;
    adj: Map<number, number[]>;
    detailed: boolean;
    maxSteps: number;
    pairToId: Map<string, string>;
    // callback để buildKruskalDfsSteps tự push step (để dùng pushStep + stepLabel bên ngoài)
    onStep: (p: {
        dfsCurrent: number;
        dfsNeighbors?: number[];
        dfsVisited: number[];
        dfsStack: number[];
        dfsEdgeOverlay: Record<string, "active" | "dead" | "candidate">;
        highlightedLines: number[];
        explanation: string;
    }) => void;
}): { exists: boolean; visitedArr: number[] } {
    const { start, target, adj, detailed, maxSteps, pairToId, onStep } = params;

    const visited = new Set<number>();
    const stack: number[] = [];
    const overlayBase: Record<string, "active" | "dead"> = {}; // chỉ active/dead bền

    let emitted = 0;
    let truncated = false;

    const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

    const emit = (payload: Parameters<typeof onStep>[0]) => {
        if (!detailed) return;
        if (emitted >= maxSteps) {
            truncated = true;
            return;
        }
        emitted += 1;
        onStep(payload);
    };

    const dfs = (u: number): boolean => {
        if (u === target) return true;

        visited.add(u);
        stack.push(u);

        // ENTER step (line 5)
        emit({
            dfsCurrent: u,
            dfsVisited: Array.from(visited),
            dfsStack: [...stack],
            dfsEdgeOverlay: { ...overlayBase },          // không có candidate ở enter
            highlightedLines: [5],
            explanation: `Enter node ${u}: đánh dấu visited.`,
        });

        const neighbors = adj.get(u) ?? [];

        while (true) {
            // candidates hiện tại = neighbors chưa visited
            const candidates = neighbors.filter((x) => !visited.has(x));
            if (candidates.length === 0) break;

            // EXPLORE step: tô màu tất cả candidate (line 6-7)
            const overlayExplore: Record<string, "active" | "dead" | "candidate"> = { ...overlayBase };
            for (const cand of candidates) {
                const id = pairToId.get(key(u, cand));
                if (id) overlayExplore[id] = "candidate";
            }

            emit({
                dfsCurrent: u,
                dfsNeighbors: candidates,
                dfsVisited: Array.from(visited),
                dfsStack: [...stack],
                dfsEdgeOverlay: overlayExplore,
                highlightedLines: [6, 7],
                explanation: `Explore neighbors của ${u}: { ${candidates.join(", ")} }.`,
            });

            // chọn 1 candidate để đi tiếp (theo thứ tự)
            const neighbor = candidates[0];
            const eid = pairToId.get(key(u, neighbor));

            if (eid) overlayBase[eid] = "active"; // edge đang đi

            if (dfs(neighbor)) return true;

            // BACKTRACK: nhánh thất bại → nhạt cạnh u-neighbor (line 9)
            if (eid) overlayBase[eid] = "dead";

            emit({
                dfsCurrent: u,
                dfsVisited: Array.from(visited),
                dfsStack: [...stack],
                dfsEdgeOverlay: { ...overlayBase },
                highlightedLines: [9],
                explanation: `Backtrack: nhánh ${u} → ${neighbor} không dẫn tới ${target}.`,
            });

            // quay lại while: candidates được tính lại, candidate đã thử sẽ bị loại vì visited đã có
        }

        stack.pop();
        return false;
    };

    // Chạy DFS với trace (có thể bị cắt)
    const existsWithTrace = dfs(start);

    // Nếu bị truncated → chạy lại DFS thật (không emit) để lấy trạng thái cuối
    if (truncated && detailed) {
        console.log("DFS trace truncated, rerunning full DFS for final state.");
        // Reset trạng thái
        visited.clear();
        stack.length = 0;
        Object.keys(overlayBase).forEach(k => delete overlayBase[k]);

        // Chạy DFS thật (không emit, không giới hạn)
        const dfsFull = (u: number): boolean => {
            if (u === target) return true;
            visited.add(u);
            stack.push(u);
            const neighbors = adj.get(u) ?? [];
            for (const nei of neighbors) {
                if (!visited.has(nei)) {
                    const eid = pairToId.get(key(u, nei));
                    if (eid) overlayBase[eid] = "active";
                    if (dfsFull(nei)) return true;
                    if (eid) overlayBase[eid] = "dead";
                }
            }
            stack.pop();
            return false;
        };

        dfsFull(start);

        // Gọi trực tiếp onStep, bypass emit
        onStep({
            dfsCurrent: stack.length > 0 ? stack[stack.length - 1] : start,
            dfsVisited: Array.from(visited),
            dfsStack: [...stack],
            dfsEdgeOverlay: { ...overlayBase },
            highlightedLines: existsWithTrace ? [2] : [10],
            explanation: `... tiếp tục tương tự ... cuối cùng DFS ${existsWithTrace ? "tìm thấy" : "không tìm thấy"} 
            đường đi (đã cắt bớt animation, đây là trạng thái cuối cùng).`,
        });
    }

    return { exists: existsWithTrace, visitedArr: Array.from(visited) };
}

export function buildKruskalDfsSteps(graph: ParsedGraph, opts: Partial<DfsSimOptions> = {}): Step[] {
    const options: DfsSimOptions = {
        detailed: opts.detailed ?? false,
        maxDfsSteps: Math.max(10, opts.maxDfsSteps ?? 200),
    };

    const { n, edges } = graph;

    const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const pairToId = new Map<string, string>();
    edges.forEach((e) => pairToId.set(pairKey(e.u, e.v), e.id));

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

    let major = 0;
    let minor = 0;
    const beginMajor = () => { major += 1; minor = 0; };
    const nextLabel = () => `${major}.${++minor}`;

    const pushStep = (s: Omit<Step, "stepId">) => {
        steps.push({ stepId: stepId++,  ...s });
    };

    // Bước khởi tạo
    beginMajor();

    pushStep({
        stepLabel: nextLabel(),
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
        beginMajor();

        pushStep({
            stepLabel: nextLabel(),
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

        const result = hasPathTrace({
            start: e.u,
            target: e.v,
            adj,
            detailed: options.detailed,
            maxSteps: options.maxDfsSteps,
            pairToId,
            onStep: (p) => {
                pushStep({
                    stepLabel: nextLabel(),
                    currentEdge: e,
                    edgeStatus: { ...edgeStatus },
                    mstEdges: [...mstEdges],
                    highlightedLines: p.highlightedLines,
                    explanation: p.explanation,
                    mstWeight,
                    sortedEdgeIds: sortedIds,
                    dfsSource: e.u,
                    dfsTarget: e.v,
                    dfsCurrent: p.dfsCurrent,
                    dfsNeighbors: p.dfsNeighbors ?? [],
                    dfsVisited: p.dfsVisited,
                    dfsStack: p.dfsStack,
                    dfsEdgeOverlay: p.dfsEdgeOverlay,
                });
            },
        });

        const pathExists = result.exists;
        const visitedArr = result.visitedArr;

        if (!pathExists) {
            // cạnh không tạo chu trình → thêm vào MST
            edgeStatus[e.id] = "chosen";
            mstEdges.push(e.id);
            mstWeight += e.w;

            // cập nhật adj
            adj.get(e.u)!.push(e.v);
            adj.get(e.v)!.push(e.u);

            pushStep({
                stepLabel: nextLabel(),
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

            pushStep({
                stepLabel: nextLabel(),
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
    beginMajor()

    pushStep({
        stepLabel: nextLabel(),
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
