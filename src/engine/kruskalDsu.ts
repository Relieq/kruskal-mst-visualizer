import type {Edge, EdgeStatus, NodeStatus, Step} from "./types";
import type { ParsedGraph } from "./parser";

export interface DsuSimOptions {
    detailed: boolean;       // coarse vs detailed
    compression: boolean;    // ON/OFF
    maxFindHops: number;     // cap cho mỗi find()
}

class DSU {
    parent: number[];
    rank: number[];

    constructor(n: number) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.rank = Array(n + 1).fill(0);
    }

    union(pu: number, pv: number): {
        merged: boolean;
        parentRoot: number;
        attachedRoot: number;
        rankIncreased: boolean;
        swapped: boolean
    } {
        if (pu === pv) return { merged: false, parentRoot: pu, attachedRoot: pv, rankIncreased: false, swapped: false };

        let swapped = false;
        if (this.rank[pu] < this.rank[pv]) {
            [pu, pv] = [pv, pu];
            swapped = true;
        }

        this.parent[pv] = pu;

        let rankIncreased = false;
        if (this.rank[pu] === this.rank[pv]) {
            this.rank[pu] += 1;
            rankIncreased = true;
        }

        return { merged: true, parentRoot: pu, attachedRoot: pv, rankIncreased, swapped };
    }

    findNoTrace(u: number): number {
        if (this.parent[u] !== u) {
            return this.findNoTrace(this.parent[u]);
        }
        return this.parent[u];
    }
}

function baseNodeStatus(n: number): Record<string, NodeStatus> {
    const m: Record<string, NodeStatus> = {};
    for (let i = 1; i <= n; i++) m[String(i)] = "normal";
    return m;
}

export function buildKruskalDsuSteps(graph: ParsedGraph, opts: Partial<DsuSimOptions> = {}): Step[] {
    const options: DsuSimOptions = {
        detailed: opts.detailed ?? false,
        compression: opts.compression ?? true,
        maxFindHops: Math.max(1, opts.maxFindHops ?? 6),
    };

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

    let major = 0;          // 1,2,3... (bước tổng thể)
    let minorHop1 = 0;      // đếm sub-step của find(u)
    let minorHop2 = 0;      // đếm sub-step của find(v)
    let minorHop3 = 0;      // (tuỳ chọn) cho union/decision

    const beginMajor = () => {
        major += 1;
        minorHop1 = 0;
        minorHop2 = 0;
        minorHop3 = 0;
    };

    const labelMajor = () => `${major}`;
    const labelMinor = (minor: 1 | 2 | 3) => `${major}.${minor}`;
    const labelSub = (minor: 1 | 2 | 3) => {
        if (minor === 1) return `${major}.1.${++minorHop1}`;
        if (minor === 2) return `${major}.2.${++minorHop2}`;
        return `${major}.3.${++minorHop3}`;
    };

    // giữ pushStep nhưng cho phép truyền stepLabel
    const pushStep = (s: Omit<Step, "stepId">) => {
        steps.push({ stepId: stepId++, ...s });
    };

    const clearCurrentEdge = () => {
        for (const id of Object.keys(edgeStatus)) {
            if (edgeStatus[id] === "current") edgeStatus[id] = "normal";
        }
    };

    // ----- FIND TRACE: mỗi hop (bước nhảy) = 1 step -----
    const findTrace = (start: number, currentEdge: Edge | null,
                       minor: 1 | 2): number => {
        const path: number[] = [start];
        let cur = start;
        let hops = 0;
        let truncated = false;

        if (options.detailed) {
            pushStep({
                stepLabel: labelMinor(minor),          // "3.1" hoặc "3.2"
                currentEdge,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [6],           // “mở hàm”
                explanation: `Bắt đầu find(${start}).`,
                mstWeight,
                sortedEdgeIds: sortedIds,
                dsuParent: [...dsu.parent],
                dsuRank: [...dsu.rank],
                focusNodes: [start],
                nodeStatus: (() => {
                    const ns = baseNodeStatus(n);
                    ns[String(start)] = "findStart";
                    return ns;
                })(),
                findNode: start,
                findPath: [start],
            });
        }

        // walk (emit each hop)
        while (dsu.parent[cur] !== cur) {
            if (options.detailed) {
                const ns = baseNodeStatus(n);
                ns[String(start)] = "findStart";
                ns[String(cur)] = "findWalk";

                pushStep({
                    stepLabel: labelSub(minor),
                    currentEdge,
                    edgeStatus: { ...edgeStatus },
                    mstEdges: [...mstEdges],
                    highlightedLines: [6, 7, 8],
                    explanation: `find(${start}): đang ở node ${cur}, parent[${cur}] = ${dsu.parent[cur]}.`,
                    mstWeight,
                    sortedEdgeIds: sortedIds,
                    dsuParent: [...dsu.parent],
                    dsuRank: [...dsu.rank],
                    focusNodes: [start, cur],
                    nodeStatus: ns,
                    findNode: start,
                    findPath: [...path],
                });
            }

            cur = dsu.parent[cur];
            path.push(cur);
            hops++;

            if (hops >= options.maxFindHops) {
                truncated = true;
                break;
            }
        }

        const root = dsu.findNoTrace(start);

        // root step
        if (options.detailed) {
            const ns = baseNodeStatus(n);
            ns[String(start)] = "findStart";
            ns[String(root)] = "findRoot";

            pushStep({
                stepLabel: labelSub(minor),
                currentEdge,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [9],
                explanation: truncated
                    ? `... tiếp tục tương tự ... cuối cùng tìm được root = ${root}.`
                    : `find(${start}) đã tới root = ${root}.`,
                mstWeight,
                sortedEdgeIds: sortedIds,
                dsuParent: [...dsu.parent],
                dsuRank: [...dsu.rank],
                focusNodes: [start, root],
                nodeStatus: ns,
                truncated,
                findNode: start,
                findPath: [...path],
            });
        }

        // compression (gộp 1 step)
        if (options.detailed && options.compression) {
            const willCompress = path.some((x) => dsu.parent[x] !== root);

            if (willCompress) {
                for (const x of path) {
                    if (x !== root) dsu.parent[x] = root;
                }

                const ns = baseNodeStatus(n);
                ns[String(start)] = "findStart";
                ns[String(root)] = "findRoot";

                pushStep({
                    stepLabel: labelSub(minor),
                    currentEdge,
                    edgeStatus: { ...edgeStatus },
                    mstEdges: [...mstEdges],
                    highlightedLines: [8],
                    explanation: `Path compression: cập nhật parent của các node trên đường đi về root = ${root}.`,
                    mstWeight,
                    sortedEdgeIds: sortedIds,
                    dsuParent: [...dsu.parent],
                    dsuRank: [...dsu.rank],
                    focusNodes: [start, root],
                    nodeStatus: ns,
                    findNode: start,
                    findPath: [...path],
                });
            }
        }

        // “kết thúc find”: root đổi màu giống start
        if (options.detailed) {
            const ns = baseNodeStatus(n);
            ns[String(start)] = "findStart";
            ns[String(root)] = "findStart";

            pushStep({
                stepLabel: labelSub(minor),
                currentEdge,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [9],
                explanation: `Kết quả: find(${start}) = ${root}.`,
                mstWeight,
                sortedEdgeIds: sortedIds,
                dsuParent: [...dsu.parent],
                dsuRank: [...dsu.rank],
                focusNodes: [start, root],
                nodeStatus: ns,
                findNode: start,
                findPath: [...path],
            });
        }

        return root;
    };

    // ----- START STEP -----
    beginMajor();

    pushStep({
        stepLabel: labelMajor(),   // "1"
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        mstEdges: [...mstEdges],
        highlightedLines: [22, 23, 24, 25, 26],
        explanation:
            "Bắt đầu Kruskal + DSU: sắp xếp cạnh tăng dần, khởi tạo DSU và các biến MST.",
        mstWeight,
        sortedEdgeIds: sortedIds,
        dsuParent: [...dsu.parent],
        dsuRank: [...dsu.rank],
    });

    // ----- MAIN LOOP -----
    for (const e of sorted) {
        clearCurrentEdge();
        edgeStatus[e.id] = "current";

        beginMajor();

        pushStep({
            stepLabel: labelMajor(),   // "2", "3", ...
            currentEdge: e,
            edgeStatus: { ...edgeStatus },
            mstEdges: [...mstEdges],
            highlightedLines: [27],
            explanation: `Xét cạnh (${e.u}, ${e.v}) trọng số ${e.w}.`,
            mstWeight,
            sortedEdgeIds: sortedIds,
            dsuParent: [...dsu.parent],
            dsuRank: [...dsu.rank],
            focusNodes: [e.u, e.v],
            nodeStatus: options.detailed
                ? (() => {
                    const ns = baseNodeStatus(n);
                    ns[String(e.u)] = "findStart";
                    ns[String(e.v)] = "findStart";
                    return ns;
                })()
                : undefined,
        });

        // detailed find traces
        const pu = options.detailed ? findTrace(e.u, e, 1) : dsu.findNoTrace(e.u);
        const pv = options.detailed ? findTrace(e.v, e, 2) : dsu.findNoTrace(e.v);


        if (pu === pv) {
            edgeStatus[e.id] = "rejected";

            beginMajor();

            pushStep({
                stepLabel: labelMajor(),
                currentEdge: e,
                edgeStatus: { ...edgeStatus },
                mstEdges: [...mstEdges],
                highlightedLines: [14, 28], // union() trả False + if dsu.union(...)
                explanation:
                    `Hai đỉnh đã cùng thành phần (root ${pu}). union trả về False → loại cạnh (tạo chu trình).`,
                mstWeight,
                sortedEdgeIds: sortedIds,
                dsuParent: [...dsu.parent],
                dsuRank: [...dsu.rank],
                focusNodes: [e.u, e.v],
            });

            continue;
        }

        // union-by-rank (tổng quát, không bẻ nhỏ attach/rank từng dòng)
        // (Nếu muốn, ta sẽ tách union sub-step ở vòng sau)
        const ut = dsu.union(pu, pv);

        // accept edge
        edgeStatus[e.id] = "chosen";
        mstEdges.push(e.id);
        mstWeight += e.w;

        beginMajor();

        pushStep({
            stepLabel: labelMajor(),
            currentEdge: e,
            edgeStatus: { ...edgeStatus },
            mstEdges: [...mstEdges],
            highlightedLines: [20, 28, 29, 30], // union() trả True + cập nhật mst
            explanation:
                `Hai thành phần khác nhau (root ${pu} và ${pv}). union trả về True → thêm cạnh vào MST. ` +
                `Gán root ${ut.attachedRoot} → parent = ${ut.parentRoot}` +
                (ut.rankIncreased ? " (rank tăng vì hai rank bằng nhau)." : "."),
            mstWeight,
            sortedEdgeIds: sortedIds,
            dsuParent: [...dsu.parent],
            dsuRank: [...dsu.rank],
            focusNodes: [e.u, e.v, pu, pv],
        });
    }

    // END
    pushStep({
        currentEdge: null,
        edgeStatus: { ...edgeStatus },
        mstEdges: [...mstEdges],
        highlightedLines: [31],
        explanation: `Kết thúc. Tổng trọng số MST = ${mstWeight}.`,
        mstWeight,
        sortedEdgeIds: sortedIds,
        dsuParent: [...dsu.parent],
        dsuRank: [...dsu.rank],
    });

    return steps;
}
