import React from "react";

interface ControlPanelProps {
    currentStepIndex: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
    isPlaying: boolean;
    onPlayToggle: () => void;
    onSeek: (index: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
                                                              currentStepIndex,
                                                              totalSteps,
                                                              onPrev,
                                                              onNext,
                                                              isPlaying,
                                                              onPlayToggle,
                                                              onSeek,
                                                          }) => {
    const maxIndex = Math.max(totalSteps - 1, 0);

    return (
        <div className="panel control-panel">
            <div className="button-group">
                <button onClick={onPrev} disabled={currentStepIndex <= 0}>
                    Prev
                </button>

                <button
                    onClick={onPlayToggle}
                    disabled={totalSteps <= 1}
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>


                <button onClick={onNext} disabled={currentStepIndex >= maxIndex}>
                    Next
                </button>
            </div>

            {/* slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
                <span style={{ fontSize: 12 }}>1</span>
                <input
                    type="range"
                    min={0}
                    max={maxIndex}
                    value={currentStepIndex}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    style={{ flex: 1 }}
                />
                <span style={{ fontSize: 12 }}>{totalSteps}</span>
            </div>

            <span>
                Step {totalSteps === 0 ? 0 : currentStepIndex + 1} / {totalSteps}
            </span>
        </div>
    );
};
