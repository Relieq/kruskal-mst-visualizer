import {useEffect, useState} from "react";
import "./App.css";
import { GraphRenderer } from "./components/GraphRenderer";
import { CodeViewer } from "./components/CodeViewer";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { ControlPanel } from "./components/ControlPanel";
import type { Step } from "./engine/types";
import { GraphInput } from "./components/GraphInput";
import type { ParsedGraph } from "./engine/parser";
import {buildKruskalDsuSteps} from "./engine/kruskalDsu.ts";
import {EdgeListPanel} from "./components/EdgeListPanel.tsx";
import {DSUPanel} from "./components/DSUPanel.tsx";
import {buildKruskalDfsSteps} from "./engine/kruskalDfs.ts";
import {DFSPanel} from "./components/DFSPanel.tsx";


type Mode = "dsu" | "dfs";

const PYTHON_KRUSKAL_DSU = [
    "class DSU:",
    "    def __init__(self, n):",
    "        self.parent = list(range(n + 1))",
    "        self.rank = [0] * (n + 1)",
    "",
    "    def find(self, u):",
    "        if self.parent[u] != u:",
    "            self.parent[u] = self.find(self.parent[u])",
    "        return self.parent[u]",
    "",
    "    def union(self, u, v):",
    "        pu, pv = self.find(u), self.find(v)",
    "        if pu == pv:",
    "            return False",
    "        if self.rank[pu] < self.rank[pv]:",
    "            pu, pv = pv, pu",
    "        self.parent[pv] = pu",
    "        if self.rank[pu] == self.rank[pv]:",
    "            self.rank[pu] += 1",
    "        return True",
    "",
    "def kruskal(n, edges):",
    "    edges.sort(key=lambda e: e[2])",
    "    dsu = DSU(n)",
    "    mst_weight = 0",
    "    mst_edges = []",
    "    for u, v, w in edges:",
    "        if dsu.union(u, v):",
    "            mst_weight += w",
    "            mst_edges.append((u, v, w))",
    "    return mst_weight, mst_edges",
];

const PYTHON_KRUSKAL_DFS = [
    "def has_path(u, v, adj, visited):",
    "    if u == v:",
    "        return True",
    "",
    "    visited.add(u)",
    "    for x in adj[u]:",
    "        if x not in visited and has_path(x, v, adj, visited):",
    "            return True",
    "    return False",
    "",
    "def kruskal_dfs(n, edges):",
    "    edges.sort(key=lambda e: e[2])",
    "    adj = {i: [] for i in range(1, n + 1)}",
    "    mst_weight = 0",
    "    mst_edges = []",
    "    for u, v, w in edges:",
    "        visited = set()",
    "        if not has_path(u, v, adj, visited):",
    "            adj[u].append(v)",
    "            adj[v].append(u)",
    "            mst_weight += w",
    "            mst_edges.append((u, v, w))",
    "    return mst_weight, mst_edges",
];

function App() {
    const [graph, setGraph] = useState<ParsedGraph | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<Mode>("dsu");
    const codeLines = mode === "dsu" ? PYTHON_KRUSKAL_DSU : PYTHON_KRUSKAL_DFS;


    const currentStep = steps[currentStepIndex] ?? null;

    function buildStepsForMode(mode: Mode, g: ParsedGraph): Step[] {
        if (mode === "dfs") return buildKruskalDfsSteps(g);
        return buildKruskalDsuSteps(g);
    }

    const handleGraphLoaded = (g: ParsedGraph) => {
        setGraph(g);

        /* // tạm thời: tạo một step "initial" với tất cả cạnh normal
        const status: Record<string, "normal"> = {};
        g.edges.forEach((e) => {
            status[e.id] = "normal";
        });

        /* const initialStep: Step = {
            stepId: 1,
            currentEdge: null,
            edgeStatus: status,
            mstEdges: [],
            highlightedLines: [],
            explanation: "Đồ thị đã được nạp. Chưa chạy thuật toán.",
            mstWeight: 0,
        };

        setSteps([initialStep]); */
        setIsPlaying(false);
        const stepsForGraph = buildStepsForMode(mode, g)
        setSteps(stepsForGraph);
        setCurrentStepIndex(0);
    };

    const handleModeChange = (m: Mode) => {
        setMode(m);
        setIsPlaying(false);
        if (graph) {
            const stepsForGraph = buildStepsForMode(m, graph);
            setSteps(stepsForGraph);
            setCurrentStepIndex(0);
        } else {
            setSteps([]);
            setCurrentStepIndex(0);
        }
    };


    const handlePrev = () => {
        setCurrentStepIndex((i) => (i > 0 ? i - 1 : i));
    };

    const handleNext = () => {
        setCurrentStepIndex((i) =>
            i < steps.length - 1 ? i + 1 : i
        );
    };

    const handlePlayToggle = () => {
        if (steps.length <= 1) return;
        setIsPlaying((p) => !p);
    };

    const handleSeek = (index: number) => {
        setIsPlaying(false);
        setCurrentStepIndex(index);
    };

    useEffect(() => {
        if (!isPlaying) return;
        if (steps.length === 0) return;

        // nếu đã ở step cuối thì dừng
        if (currentStepIndex >= steps.length - 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsPlaying(false);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentStepIndex((i) => {
                const next = i + 1;
                if (next >= steps.length - 1) {
                    // tự dừng khi chạm cuối
                    setIsPlaying(false);
                }
                return Math.min(next, steps.length - 1);
            });
        }, 800); // 800ms mỗi step (bạn có thể chỉnh nhanh/chậm hơn)

        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIndex, steps.length]);

    return (
        <div className="app-root">
            <ControlPanel
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                onPrev={handlePrev}
                onNext={handleNext}
                isPlaying={isPlaying}
                onPlayToggle={handlePlayToggle}
                onSeek={handleSeek}
            />

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 12,
                    marginTop: 8,
                }}
            >
                <button
                    onClick={() => handleModeChange("dsu")}
                    style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: mode === "dsu" ? "1px solid #4f46e5" : "1px solid #d1d5db",
                        background: mode === "dsu" ? "#4f46e5" : "#f9fafb",
                        color: mode === "dsu" ? "#ffffff" : "#111827",
                        cursor: "pointer",
                        fontSize: 13,
                    }}
                >
                    Kruskal + DSU
                </button>
                
                <button
                    onClick={() => handleModeChange("dfs")}
                    style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: mode === "dfs" ? "1px solid #4f46e5" : "1px solid #d1d5db",
                        background: mode === "dfs" ? "#4f46e5" : "#f9fafb",
                        color: mode === "dfs" ? "#ffffff" : "#111827",
                        cursor: "pointer",
                        fontSize: 13,
                    }}
                >
                    Kruskal + DFS
                </button>
            </div>

            <div className="main-layout">
                <div className="left-column">
                    <GraphInput onGraphLoaded={handleGraphLoaded} />
                    <GraphRenderer
                        nodes={graph?.nodes ?? []}
                        edges={graph?.edges ?? []}
                        currentStep={currentStep}
                    />
                    <EdgeListPanel
                        edges={graph?.edges ?? []}
                        currentStep={currentStep}
                    />
                </div>
                <div className="middle-column">
                    <CodeViewer
                        codeLines={codeLines}
                        highlightedLines={currentStep?.highlightedLines ?? []}
                    />
                </div>
                <div className="right-column">
                    {mode === "dsu" ? (
                        <DSUPanel currentStep={currentStep} />
                    ) : (
                        <DFSPanel edges={graph?.edges ?? []} currentStep={currentStep} />
                    )}
                    <ExplanationPanel currentStep={currentStep} />
                </div>
            </div>
        </div>
    );
}

export default App;
