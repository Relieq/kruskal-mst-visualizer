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
import {CollapsiblePanel} from "./components/CollapsiblePanel.tsx";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggablePanel } from "./components/DraggablePanel";


type Mode = "dsu" | "dfs";

const PYTHON_KRUSKAL_DSU_PC = [
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

const PYTHON_KRUSKAL_DSU_NO_PC = [
    "class DSU:",
    "    def __init__(self, n):",
    "        self.parent = list(range(n + 1))",
    "        self.rank = [0] * (n + 1)",
    "",
    "    def find(self, u):",
    "        if self.parent[u] != u:",
    "            return self.find(self.parent[u])",
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
    const [dsuDetailed, setDsuDetailed] = useState(false);
    const [compression, setCompression] = useState(true);
    const [maxFindHops, setMaxFindHops] = useState(6);
    const [dfsDetailed, setDfsDetailed] = useState(false);
    const [maxDfsSteps, setMaxDfsSteps] = useState(6);

    // Panel order state cho drag & drop - mỗi cột 1 mảng riêng (màn hình lớn)
    const [leftPanelOrder, setLeftPanelOrder] = useState(["graph-input", "graph-viz", "edge-list"]);
    const [middlePanelOrder, setMiddlePanelOrder] = useState(["code"]);
    const [rightPanelOrder, setRightPanelOrder] = useState(["state", "explanation"]);

    // Panel order cho màn hình nhỏ (1 cột) - tất cả panels trong 1 mảng
    const [singleColumnOrder, setSingleColumnOrder] = useState([
        "graph-input", "graph-viz", "edge-list", "code", "state", "explanation"
    ]);

    // Dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Phải kéo ít nhất 8px để bắt đầu drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Detect mobile screen (≤640px)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    // Detect small screen (≤1024px) - chuyển sang 1 cột
    const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 640);
            setIsSmallScreen(window.innerWidth <= 1024);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const codeLines = mode === "dfs"
        ? PYTHON_KRUSKAL_DFS
        : compression
            ? PYTHON_KRUSKAL_DSU_PC
            : PYTHON_KRUSKAL_DSU_NO_PC;


    const currentStep = steps[currentStepIndex] ?? null;

    function buildStepsForMode(mode: Mode, g: ParsedGraph): Step[] {
        if (mode === "dfs") return buildKruskalDfsSteps(g, {
            detailed: dfsDetailed,
            maxDfsSteps,
        });

        return buildKruskalDsuSteps(g, {
            detailed: dsuDetailed,
            compression,
            maxFindHops,
        });
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
        }, 800); // 800ms mỗi step (có thể chỉnh nhanh/chậm hơn)

        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIndex, steps.length]);

    // Xử lý drag end - mỗi cột có handler riêng (màn hình lớn)
    const handleDragEnd = (column: "left" | "middle" | "right") => (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const setOrder = column === "left" ? setLeftPanelOrder
            : column === "middle" ? setMiddlePanelOrder
                : setRightPanelOrder;
        const order = column === "left" ? leftPanelOrder
            : column === "middle" ? middlePanelOrder
                : rightPanelOrder;

        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        setOrder(arrayMove(order, oldIndex, newIndex));
    };

    // Xử lý drag end cho single column mode (màn hình nhỏ)
    const handleSingleColumnDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = singleColumnOrder.indexOf(active.id as string);
        const newIndex = singleColumnOrder.indexOf(over.id as string);
        setSingleColumnOrder(arrayMove(singleColumnOrder, oldIndex, newIndex));
    };

    // Render panel theo ID
    const renderPanel = (panelId: string) => {
        switch (panelId) {
            case "graph-input":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title="Graph Input" defaultOpen={!isMobile}>
                            <GraphInput onGraphLoaded={handleGraphLoaded} />
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            case "graph-viz":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title="Graph Visualization" defaultOpen={true}>
                            <GraphRenderer
                                nodes={graph?.nodes ?? []}
                                edges={graph?.edges ?? []}
                                currentStep={currentStep}
                            />
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            case "edge-list":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title="Edge List" defaultOpen={!isMobile}>
                            <EdgeListPanel
                                edges={graph?.edges ?? []}
                                currentStep={currentStep}
                            />
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            case "code":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title="Code (Python)" defaultOpen={!isMobile}>
                            <CodeViewer
                                codeLines={codeLines}
                                highlightedLines={currentStep?.highlightedLines ?? []}
                            />
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            case "state":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title={mode === "dsu" ? "DSU State" : "DFS State"} defaultOpen={!isMobile}>
                            {mode === "dsu" ? (
                                <DSUPanel currentStep={currentStep} />
                            ) : (
                                <DFSPanel edges={graph?.edges ?? []} currentStep={currentStep} />
                            )}
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            case "explanation":
                return (
                    <DraggablePanel key={panelId} id={panelId}>
                        <CollapsiblePanel title="Explanation" defaultOpen={true}>
                            <ExplanationPanel currentStep={currentStep} />
                        </CollapsiblePanel>
                    </DraggablePanel>
                );
            default:
                return null;
        }
    };

    return (
        <div className="app-root">
            <header className="app-header">
                <ControlPanel
                    currentStepIndex={currentStepIndex}
                    totalSteps={steps.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    isPlaying={isPlaying}
                    onPlayToggle={handlePlayToggle}
                    onSeek={handleSeek}
                />
            </header>

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

            {mode === "dsu" && (
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                            type="checkbox"
                            checked={dsuDetailed}
                            onChange={(e) => {
                                setDsuDetailed(e.target.checked);
                                setIsPlaying(false);
                                if (graph) {
                                    setSteps(buildKruskalDsuSteps(graph, {
                                        detailed: e.target.checked, compression,
                                        maxFindHops
                                    }));
                                    setCurrentStepIndex(0);
                                }
                            }}
                        />
                        Detailed DSU
                    </label>

                    <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                            type="checkbox"
                            checked={compression}
                            onChange={(e) => {
                                setCompression(e.target.checked);
                                setIsPlaying(false);
                                if (graph) {
                                    setSteps(buildKruskalDsuSteps(graph, {
                                        detailed: dsuDetailed,
                                        compression: e.target.checked, maxFindHops
                                    }));
                                    setCurrentStepIndex(0);
                                }
                            }}
                        />
                        Path compression
                    </label>

                    <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        Max find hops:
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={maxFindHops}
                            onChange={(e) => {
                                const v = Math.max(1, Number(e.target.value));
                                setMaxFindHops(v);
                                setIsPlaying(false);
                                if (graph) {
                                    setSteps(buildKruskalDsuSteps(graph, {
                                        detailed: dsuDetailed,
                                        compression, maxFindHops: v
                                    }));
                                    setCurrentStepIndex(0);
                                }
                            }}
                            style={{ width: 70 }}
                        />
                    </label>
                </div>
            )}

            {mode === "dfs" && (
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                            type="checkbox"
                            checked={dfsDetailed}
                            onChange={(e) => {
                                setDfsDetailed(e.target.checked);
                                setIsPlaying(false);
                                if (graph) {
                                    setSteps(buildKruskalDfsSteps(graph, {
                                        detailed: e.target.checked,
                                        maxDfsSteps
                                    }));
                                    setCurrentStepIndex(0);
                                }
                            }}
                        />
                        Detailed DFS
                    </label>

                    <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        Max DFS steps:
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={maxDfsSteps}
                            onChange={(e) => {
                                const v = Math.max(1, Number(e.target.value));
                                setMaxDfsSteps(v);
                                setIsPlaying(false);
                                if (graph) {
                                    setSteps(buildKruskalDfsSteps(graph, {
                                        detailed: dfsDetailed,
                                        maxDfsSteps: v
                                    }));
                                    setCurrentStepIndex(0);
                                }
                            }}
                            style={{ width: 70 }}
                        />
                    </label>
                </div>
            )}


            {/* Layout cho màn hình nhỏ: 1 cột, kéo thả tự do */}
            {isSmallScreen ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSingleColumnDragEnd}
                >
                    <div className="main-layout single-column">
                        <SortableContext items={singleColumnOrder} strategy={verticalListSortingStrategy}>
                            {singleColumnOrder.map(renderPanel)}
                        </SortableContext>
                    </div>
                </DndContext>
            ) : (
                /* Layout cho màn hình lớn: 3 cột, kéo thả trong cùng cột */
                <div className="main-layout">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd("left")}
                    >
                        <div className="left-column">
                            <SortableContext items={leftPanelOrder} strategy={verticalListSortingStrategy}>
                                {leftPanelOrder.map(renderPanel)}
                            </SortableContext>
                        </div>
                    </DndContext>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd("middle")}
                    >
                        <div className="middle-column">
                            <SortableContext items={middlePanelOrder} strategy={verticalListSortingStrategy}>
                                {middlePanelOrder.map(renderPanel)}
                            </SortableContext>
                        </div>
                    </DndContext>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd("right")}
                    >
                        <div className="right-column">
                            <SortableContext items={rightPanelOrder} strategy={verticalListSortingStrategy}>
                                {rightPanelOrder.map(renderPanel)}
                            </SortableContext>
                        </div>
                    </DndContext>
                </div>
            )}
            <SpeedInsights />
        </div>
    );
}

export default App;
