import React, { useState } from "react";

interface CollapsiblePanelProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
    title,
    defaultOpen = true,
    children,
    headerActions,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="panel panel-collapsible">
            <div className="panel-collapsible-header">
                <span className="panel-collapsible-title">{title}</span>
                <div className="panel-collapsible-actions">
                    {headerActions}
                    <button
                        className="panel-collapse-btn"
                        onClick={() => setIsOpen((o) => !o)}
                        aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                        {isOpen ? "▲" : "▼"}
                    </button>
                </div>
            </div>
            {isOpen && <div className="panel-collapsible-body">{children}</div>}
        </div>
    );
};

