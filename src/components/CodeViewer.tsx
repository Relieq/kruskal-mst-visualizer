import React from "react";
import Highlight, { defaultProps } from "prism-react-renderer";
import nightOwl from "prism-react-renderer/themes/nightOwl";

interface CodeViewerProps {
    codeLines: string[];
    highlightedLines: number[];
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
                                                          codeLines,
                                                          highlightedLines,
                                                      }) => {
    const code = codeLines.join("\n");

    return (
        <Highlight
            {...defaultProps}
            code={code}
            language="python"
            theme={nightOwl}
        >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={`code-block ${className}`} style={style}>
                    <code className="code-block-inner">
                        {tokens.map((line, i) => {
                            const lineNumber = i + 1;
                            const isHighlighted = highlightedLines.includes(lineNumber);

                            const lineProps = getLineProps({ line, key: i });
                            const extraClass = isHighlighted ? " highlighted" : "";

                            return (
                                <div
                                    key={i}
                                    {...lineProps}
                                    className={`code-line${extraClass} ${
                                        lineProps.className ?? ""
                                    }`}
                                >
                                    <span className="line-number">
                                        {lineNumber.toString().padStart(2, " ")}
                                    </span>{" "}
                                    {line.map((token, key) => {
                                        const tokenProps = getTokenProps({ token, key });
                                        return <span key={key} {...tokenProps} />;
                                    })}
                                </div>
                            );
                        })}
                    </code>
                </pre>
            )}
        </Highlight>
    );
};
