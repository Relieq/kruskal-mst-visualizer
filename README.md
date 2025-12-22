# Kruskal MST Visualizer

[![Vietnamese](https://img.shields.io/badge/lang-Vietnamese-blue)](README.vi.md)

An interactive web-based visualization tool for **Kruskal's Minimum Spanning Tree (MST) algorithm**. This educational tool helps students and developers understand how Kruskal's algorithm works step-by-step, with support for both **Disjoint Set Union (DSU)** and **DFS-based** cycle detection approaches.

🔗 **Live Demo:** [https://kruskal-mst-visualizer.vercel.app/](https://kruskal-mst-visualizer.vercel.app/)

---

## ✨ Features

### 🎯 Two Algorithm Modes
- **Kruskal + DSU (Union-Find)**: Visualizes the classic implementation using Disjoint Set Union with union by rank and optional path compression
- **Kruskal + DFS**: Demonstrates cycle detection using Depth-First Search on the current MST

### 📊 Interactive Visualization
- **Graph Rendering**: Dynamic graph visualization powered by [Sigma.js](https://www.sigmajs.org/) and [Graphology](https://graphology.github.io/)
- **Step-by-Step Execution**: Navigate through each step of the algorithm with Prev/Next buttons or use the slider
- **Auto-Play Mode**: Watch the algorithm run automatically with configurable speed
- **Edge Tooltips**: Hover over edges to see their details (endpoints and weight)

### 🎨 Visual Feedback
- **Edge States**:
  - 🟡 Yellow: Current edge being considered
  - 🟢 Green: Edge chosen for MST
  - ⚪ Gray: Edge rejected (would create a cycle)

- **DSU Node States** (when using DSU mode):
  - 🟢 Cyan: Node calling `find(u)` / Root found
  - 🟡 Yellow: Node being traversed during find operation
  - 🟣 Purple: Root node of the set

- **DFS Overlay** (when using DFS mode):
  - 🟠 Orange: Candidate neighbors to explore
  - 🟢 Cyan: Active DFS path
  - ⚫ Gray: Dead branch (backtracked)

### 🔧 Configuration Options

**DSU Mode:**
- Toggle **Detailed DSU** to see individual find/union operations
- Toggle **Path Compression** on/off to compare implementations
- Set **Max Find Hops** to limit step generation for deep trees

**DFS Mode:**
- Toggle **Detailed DFS** to see individual DFS traversal steps
- Set **Max DFS Steps** to limit step generation for complex searches

### 📱 Responsive Design
- Collapsible panels for mobile-friendly experience
- Adaptive layout for different screen sizes
- Touch-friendly controls

### 🖱️ Drag & Drop Panels
- **Reorder panels** by dragging the grip handle (⋮⋮) on each panel header
- **Desktop (>1024px)**: Drag panels within their column (left, middle, right)
- **Mobile/Tablet (≤1024px)**: Freely drag any panel to any position in the single-column layout
- Customize your workspace to focus on what matters most to you

---

## 📸 Screenshots

### Main Interface
<!-- <Screenshot showing the full interface with graph, code, and explanation panels> -->
![main_interface.png](images/main_interface.png)

### DSU Mode - Path Compression
<!-- <Screenshot showing DSU state table with parent/rank values and highlighted nodes> -->
![dsu_mode_path_compression.png](images/dsu_mode_path_compression.png)

### DFS Mode - Cycle Detection
<!-- <Screenshot showing DFS traversal with active path and visited nodes highlighted> -->
![dfs_mode.png](images/dfs_mode.png)

### Help Modal - Color Legend
<!-- <Screenshot of the help modal explaining all color codes and states> -->
![help_modal_color_legend.png](images/help_modal_color_legend.png)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kruskal-mst-visualizer.git
cd kruskal-mst-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📖 How to Use

### 1. Input Your Graph
Enter your graph in the input panel using the format:
```
N M
u1 v1 w1
u2 v2 w2
...
```
Where:
- `N` = number of vertices
- `M` = number of edges
- Each edge line contains: `u v w` (start vertex, end vertex, weight)

**Example:**
```
5 8
1 2 1
1 3 4
1 5 1
2 4 2
2 5 1
3 4 3
3 5 3
4 5 2
```

### 2. Load the Graph
Click **"Tải đồ thị"** (Load Graph) to visualize your graph.

### 3. Choose Algorithm Mode
Select between:
- **Kruskal + DSU**: Uses Union-Find data structure
- **Kruskal + DFS**: Uses DFS for cycle detection

### 4. Navigate Steps
- Use **Prev/Next** buttons to step through manually
- Use the **slider** to jump to any step
- Click **Play** for automatic playback

### 5. Understand the Visualization
- Watch the **Code Panel** to see which line is being executed
- Read the **Explanation Panel** for Vietnamese explanations of each step
- Check the **DSU/DFS State Panel** for internal data structure states

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) with TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/) (using Rolldown)
- **Graph Visualization**: [Sigma.js](https://www.sigmajs.org/) + [Graphology](https://graphology.github.io/)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/) for panel reordering
- **Code Highlighting**: [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer)
- **Deployment**: [Vercel](https://vercel.com/)
- **Analytics**: [Vercel Speed Insights](https://vercel.com/docs/speed-insights)

![speed_insight.png](images/speed_insight.png)

---

## 📁 Project Structure

```
kruskal-mst-visualizer/
├── src/
│   ├── components/          # React components
│   │   ├── CodeViewer.tsx       # Python code display with highlighting
│   │   ├── CollapsiblePanel.tsx # Collapsible wrapper for panels
│   │   ├── ControlPanel.tsx     # Playback controls
│   │   ├── DFSPanel.tsx         # DFS state visualization
│   │   ├── DraggablePanel.tsx   # Drag & drop wrapper for panels
│   │   ├── DSUPanel.tsx         # DSU state table
│   │   ├── EdgeListPanel.tsx    # Sorted edge list
│   │   ├── ExplanationPanel.tsx # Step explanations
│   │   ├── GraphInput.tsx       # Graph input form
│   │   ├── GraphRenderer.tsx    # Sigma.js graph visualization
│   │   └── HelpModal.tsx        # Color legend modal
│   ├── engine/              # Algorithm implementations
│   │   ├── kruskalDsu.ts        # Kruskal + DSU step generator
│   │   ├── kruskalDfs.ts        # Kruskal + DFS step generator
│   │   ├── parser.ts            # Graph input parser
│   │   └── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.tsx             # Entry point
├── scripts/
│   └── test-all.ts          # Automated testing script
├── test-cases/              # Test input/output files
└── package.json
```

---

## 🧪 Testing

Run the automated tests to verify algorithm correctness:

```bash
npx tsx scripts/test-all.ts
```

This will run the algorithm against all test cases in `src/test-cases/` and compare outputs.

![test_3_ver_code.png](images/test_3_ver_code.png)

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Inspired by the need for better algorithm visualization tools in computer science education
- Built with modern web technologies for accessibility and performance
- Ms. Nguyễn Khánh Phương – the instructor who guided the Project course at Hanoi University of Science and Technology, 
and whose inspiration was instrumental throughout the development of this project.

---

**Made with ❤️ for algorithm learners everywhere**

