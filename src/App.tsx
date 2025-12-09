import { useState } from "react";
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

function App() {
    const [graph, setGraph] = useState<ParsedGraph | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const currentStep = steps[currentStepIndex] ?? null;

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
        const stepsForGraph = buildKruskalDsuSteps(g);
        setSteps(stepsForGraph);
        setCurrentStepIndex(0);
    };


    const handlePrev = () => {
        setCurrentStepIndex((i) => (i > 0 ? i - 1 : i));
    };

    const handleNext = () => {
        setCurrentStepIndex((i) =>
            i < steps.length - 1 ? i + 1 : i
        );
    };

    return (
        <div className="app-root">
            <ControlPanel
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                onPrev={handlePrev}
                onNext={handleNext}
            />

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
                        codeLines={PYTHON_KRUSKAL_DSU}
                        highlightedLines={currentStep?.highlightedLines ?? []}
                    />
                </div>
                <div className="right-column">
                    <ExplanationPanel currentStep={currentStep} />
                </div>
            </div>
        </div>
    );
}

export default App;
