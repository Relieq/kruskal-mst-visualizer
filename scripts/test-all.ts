import * as fs from "fs";
import * as path from "path";
import { parseGraphInput } from "../src/engine/parser";

const TEST_DIR = "./src/test-cases";

// ============ DSU Implementation (với Path Compression) ============
class DSU_PC {
    parent: number[];
    rank: number[];

    constructor(n: number) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.rank = Array(n + 1).fill(0);
    }

    find(u: number): number {
        if (this.parent[u] !== u) {
            this.parent[u] = this.find(this.parent[u]); // path compression
        }
        return this.parent[u];
    }

    union(u: number, v: number): boolean {
        const pu = this.find(u);
        const pv = this.find(v);
        if (pu === pv) return false;

        if (this.rank[pu] < this.rank[pv]) {
            this.parent[pu] = pv;
        } else if (this.rank[pu] > this.rank[pv]) {
            this.parent[pv] = pu;
        } else {
            this.parent[pv] = pu;
            this.rank[pu]++;
        }
        return true;
    }
}

// ============ DSU Implementation (không Path Compression) ============
class DSU_NoPC {
    parent: number[];
    rank: number[];

    constructor(n: number) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
        this.rank = Array(n + 1).fill(0);
    }

    find(u: number): number {
        if (this.parent[u] !== u) {
            return this.find(this.parent[u]); // không path compression
        }
        return this.parent[u];
    }

    union(u: number, v: number): boolean {
        const pu = this.find(u);
        const pv = this.find(v);
        if (pu === pv) return false;

        if (this.rank[pu] < this.rank[pv]) {
            this.parent[pu] = pv;
        } else if (this.rank[pu] > this.rank[pv]) {
            this.parent[pv] = pu;
        } else {
            this.parent[pv] = pu;
            this.rank[pu]++;
        }
        return true;
    }
}

// ============ Kruskal với DSU (path compression) ============
function kruskalDsuPC(n: number, edges: { u: number; v: number; w: number }[]): number {
    const sorted = [...edges].sort((a, b) => a.w - b.w);
    const dsu = new DSU_PC(n);
    let mstWeight = 0;

    for (const { u, v, w } of sorted) {
        if (dsu.union(u, v)) {
            mstWeight += w;
        }
    }
    return mstWeight;
}

// ============ Kruskal với DSU (không path compression) ============
function kruskalDsuNoPC(n: number, edges: { u: number; v: number; w: number }[]): number {
    const sorted = [...edges].sort((a, b) => a.w - b.w);
    const dsu = new DSU_NoPC(n);
    let mstWeight = 0;

    for (const { u, v, w } of sorted) {
        if (dsu.union(u, v)) {
            mstWeight += w;
        }
    }
    return mstWeight;
}

// ============ DFS để kiểm tra có đường đi không ============
function hasPath(u: number, v: number, adj: Map<number, number[]>, visited: Set<number>): boolean {
    if (u === v) return true;
    visited.add(u);
    const neighbors = adj.get(u) ?? [];
    for (const x of neighbors) {
        if (!visited.has(x) && hasPath(x, v, adj, visited)) {
            return true;
        }
    }
    return false;
}

// ============ Kruskal với DFS ============
function kruskalDfs(n: number, edges: { u: number; v: number; w: number }[]): number {
    const sorted = [...edges].sort((a, b) => a.w - b.w);
    const adj = new Map<number, number[]>();
    for (let i = 1; i <= n; i++) adj.set(i, []);

    let mstWeight = 0;

    for (const { u, v, w } of sorted) {
        const visited = new Set<number>();
        if (!hasPath(u, v, adj, visited)) {
            adj.get(u)!.push(v);
            adj.get(v)!.push(u);
            mstWeight += w;
        }
    }
    return mstWeight;
}

// ============ Test Runner ============
interface TestResult {
    name: string;
    expected: number;
    dsuWithPC: number;
    dsuNoPC: number;
    dfs: number;
    pass: boolean;
}

async function runTests() {
    const files = fs.readdirSync(TEST_DIR);
    const results: TestResult[] = [];

    for (const file of files) {
        if (!file.endsWith(".in")) continue;

        const name = file.replace(".in", "");
        const inPath = path.join(TEST_DIR, file);
        const outPath = path.join(TEST_DIR, name + ".out");

        const input = fs.readFileSync(inPath, "utf-8");
        const expectedStr = fs.readFileSync(outPath, "utf-8").trim();
        const expected = Number(expectedStr);

        const parseResult = parseGraphInput(input);
        if (!parseResult.ok || !parseResult.graph) {
            console.log(`❌ ${name}: Parse lỗi - ${parseResult.error}`);
            continue;
        }

        const { n, edges } = parseResult.graph;
        const simpleEdges = edges.map(e => ({ u: e.u, v: e.v, w: e.w }));

        // Chạy 3 phiên bản thuật toán
        const weightDsuPC = kruskalDsuPC(n, simpleEdges);
        const weightDsuNoPC = kruskalDsuNoPC(n, simpleEdges);
        const weightDfs = kruskalDfs(n, simpleEdges);

        const pass = weightDsuPC === expected && weightDsuNoPC === expected && weightDfs === expected;

        results.push({
            name,
            expected,
            dsuWithPC: weightDsuPC,
            dsuNoPC: weightDsuNoPC,
            dfs: weightDfs,
            pass,
        });
    }

    // In bảng kết quả đẹp
    console.log("\n=== KẾT QUẢ TEST ===");
    console.log(
        "Test".padEnd(15) +
        "Expected".padEnd(12) +
        "DSU+PC".padEnd(12) +
        "DSU-NoPC".padEnd(12) +
        "DFS".padEnd(12) +
        "Result"
    );
    console.log("-".repeat(75));

    let allPass = true;
    for (const r of results) {
        const status = r.pass ? "✅ PASS" : "❌ FAIL";
        allPass = allPass && r.pass;
        console.log(
            r.name.padEnd(15) +
            String(r.expected).padEnd(12) +
            String(r.dsuWithPC).padEnd(12) +
            String(r.dsuNoPC).padEnd(12) +
            String(r.dfs).padEnd(12) +
            status
        );
    }

    console.log("\n" + (allPass ? "🎉 TẤT CẢ TEST PASS!" : "😢 Có test fail, kiểm tra lại nhé!"));
}

runTests().catch(console.error);

