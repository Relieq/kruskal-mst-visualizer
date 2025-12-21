import React, { useEffect } from "react";

type HelpModalProps = {
    open: boolean;
    onClose: () => void;
};

type LegendItem = {
    label: string;
    color: string;
    description: string;
};

const LEGEND: { title: string; items: LegendItem[] }[] = [
    {
        title: "Kruskal (Edge states)",
        items: [
            {
                label: "Current edge",
                color: "#facc15",
                description: "Cạnh đang được thuật toán xem xét ở bước hiện tại.",
            },
            {
                label: "Chosen edge",
                color: "#22c55e",
                description: "Cạnh đã được chọn vào cây khung nhỏ nhất (MST).",
            },
            {
                label: "Rejected edge",
                color: "#dcd4d4",
                description: "Cạnh bị loại vì nếu thêm sẽ tạo chu trình.",
            },
        ],
    },
    {
        title: "DFS overlay (khi dùng Kruskal + DFS)",
        items: [
            {
                label: "Candidate neighbors",
                color: "#f97316",
                description: "Các hướng có thể đi tiếp ở bước DFS 'explore neighbors'.",
            },
            {
                label: "Active path",
                color: "#00ffc4",
                description: "Đường DFS đang đi (nhánh đang được thử).",
            },
            {
                label: "Dead branch",
                color: "rgba(40,43,46,0.25)",
                description: "Nhánh đã thử nhưng không dẫn tới đích (backtrack).",
            },
        ],
    },
    {
        title: "DSU trace (khi dùng Kruskal + DSU)",
        items: [
            {
                label: "findStart",
                color: "#00ffc4",
                description: "Node đang gọi find(u). Đến cuối node root cũng sẽ có màu này để biểu thị 1 cặp (u, find(u)).",
            },
            {
                label: "findWalk",
                color: "#facc15",
                description: "Node đang được xét trên đường đi tìm root.",
            },
            {
                label: "findRoot",
                color: "#d800ff",
                description: "Root (đại diện) của tập hợp trong DSU.",
            },
        ],
    },
];

export const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="help-overlay" onMouseDown={onClose}>
            <div
                className="help-modal"
                onMouseDown={(e) => e.stopPropagation()} // click trong modal không đóng
                role="dialog"
                aria-modal="true"
                aria-label="Legend and Help"
            >
                <div className="help-header">
                    <div>
                        <div className="help-title">Legend & Help</div>
                        <div className="help-subtitle">
                            Giải thích ý nghĩa màu sắc và trạng thái trong mô phỏng.
                        </div>
                    </div>
                    <button className="help-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="help-body">
                    {LEGEND.map((section) => (
                        <div key={section.title} className="help-section">
                            <div className="help-section-title">{section.title}</div>
                            <div className="help-items">
                                {section.items.map((it) => (
                                    <div key={it.label} className="help-item">
                    <span
                        className="help-swatch"
                        style={{ backgroundColor: it.color }}
                    />
                                        <div className="help-item-text">
                                            <div className="help-item-label">{it.label}</div>
                                            <div className="help-item-desc">{it.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="help-section">
                        <div className="help-section-title">Tips</div>
                        <ul className="help-tips">
                            <li>
                                Bật <b>Detailed</b> để xem các bước chi tiết (find/DFS). Nếu đồ thị
                                lớn, mô phỏng sẽ tự cắt bớt animation và hiển thị trạng thái cuối.
                            </li>
                            <li>
                                Dùng <b>Play</b> và thanh <b>slider</b> để tua nhanh tới bước bất kỳ.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
