import React from "react";
import type { Step } from "../engine/types";

interface ExplanationPanelProps {
    currentStep: Step | null;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
                                                                      currentStep
                                                                  }) => {
    return (
        <div className="panel">
            <h2>Giải thích bước hiện tại</h2>
            {currentStep ? (
                <>
                    <p><strong>Step {currentStep.stepLabel ?? "cuối"}</strong></p>
                    <p>{currentStep.explanation}</p>
                    {currentStep.mstWeight !== undefined && (
                        <p>Tổng trọng số MST hiện tại: {currentStep.mstWeight}</p>
                    )}
                </>
            ) : (
                <p>Chưa chạy bước nào.</p>
            )}
        </div>
    );
};
