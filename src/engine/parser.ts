import type { Edge } from "./types";

export interface ParsedGraph {
    n: number;
    m: number;
    nodes: number[];
    edges: Edge[];
}

export interface ParseResult {
    ok: boolean;
    graph?: ParsedGraph;
    error?: string;
}

/**
 * Parse input dạng:
 * Line 1: N M
 * Line 2..M+1: u v w
 */
export function parseGraphInput(text: string): ParseResult {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length === 0) {
        return { ok: false, error: "Input trống." };
    }

    const header = lines[0].split(/\s+/);
    if (header.length < 2) {
        return { ok: false, error: "Dòng 1 phải có N và M." };
    }

    const n = Number(header[0]);
    const m = Number(header[1]);

    if (!Number.isInteger(n) || !Number.isInteger(m) || n <= 0 || m < 0) {
        return { ok: false, error: "N, M phải là số nguyên dương hợp lệ." };
    }

    if (lines.length - 1 < m) {
        return { ok: false, error: `Thiếu dòng cạnh: cần ${m} dòng, nhưng chỉ có ${lines.length - 1}.` };
    }

    const nodes: number[] = [];
    for (let i = 1; i <= n; i++) nodes.push(i);

    const edges: Edge[] = [];
    for (let i = 0; i < m; i++) {
        const parts = lines[i + 1].split(/\s+/);
        if (parts.length < 3) {
            return { ok: false, error: `Dòng cạnh ${i + 2} không hợp lệ.` };
        }
        const u = Number(parts[0]);
        const v = Number(parts[1]);
        const w = Number(parts[2]);

        if (!Number.isInteger(u) || !Number.isInteger(v) || !Number.isFinite(w)) {
            return { ok: false, error: `Cạnh ở dòng ${i + 2} có u, v, w không hợp lệ.` };
        }
        if (u < 1 || u > n || v < 1 || v > n) {
            return { ok: false, error: `Đỉnh ở dòng ${i + 2} phải nằm trong [1, ${n}].` };
        }

        edges.push({
            id: `e${i}`,
            u,
            v,
            w,
        });
    }

    return {
        ok: true,
        graph: {
            n,
            m,
            nodes,
            edges,
        },
    };
}
