import React from "react";

interface ControlPanelProps {
    currentStepIndex: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
                                                              currentStepIndex,
                                                              totalSteps,
                                                              onPrev,
                                                              onNext,
                                                          }) => {
    return (
        <div className="panel control-panel">
            <button onClick={onPrev} disabled={currentStepIndex <= 0}>
                Prev
            </button>
            <span>
        Step {totalSteps === 0 ? 0 : currentStepIndex + 1} / {totalSteps}
      </span>
            <button onClick={onNext} disabled={currentStepIndex >= totalSteps - 1}>
                Next
            </button>
        </div>
    );
};
