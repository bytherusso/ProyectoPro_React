import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useReactFlow // Hook necesario para funciones avanzadas
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';

const panelStyle = {
  position: 'absolute', top: 10, right: 10, zIndex: 10,
  background: '#1e1e1e', padding: 15, borderRadius: 8,
  border: '1px solid #444', maxHeight: '40vh', overflowY: 'auto', width: 280, color: '#fff', fontSize: '0.8em'
};

// --- MOTOR LÓGICO (Mantenemos el que ya funcionaba) ---
const generarTablaVerdad = (formula) => {
    try {
        const tokens = formula.match(/[a-zA-Z0-9_]+/g) || [];
        const vars = [...new Set(tokens)].sort();
        if (vars.length === 0) return null;

        const filas = Math.pow(2, vars.length);
        const data = [];
        let exprJS = formula.replace(/·/g, '&&').replace(/\+/g, '||').replace(/¬/g, '!').replace(/⊕/g, '^');

        for(let i=0; i<filas; i++) {
            let fila = { inputs: [], output: 0 };
            let valoresArgs = [];
            vars.forEach((v, idx) => {
                const bit = (i >> (vars.length - 1 - idx)) & 1;
                fila.inputs.push(bit);
                valoresArgs.push(bit);
            });
            try {
                const func = new Function(...vars, `return (${exprJS}) ? 1 : 0;`);
                fila.output = func(...valoresArgs);
            } catch(e) { fila.output = '-'; }
            data.push(fila);
        }
        return { vars, data };
    } catch(e) { return null; }
};

const initialNodes = [
  { id: 'A', type: 'input', data: { label: 'A' }, position: { x: 50, y: 50 } },
  { id: 'gate1', data: { label: 'AND' }, position: { x: 200, y: 100 } },
  { id: 'salida', type: 'output', data: { label: 'Salida' }, position: { x: 400, y: 100 } },
];

// COMPONENTE INTERNO (Para poder usar useReactFlow)
function CircuitBuilder() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [formulaShow, setFormulaShow] = useState("");

  // Hook para controlar el lienzo
  const { project } = useReactFlow(); 

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // --- 1. FUNCIÓN ELIMINAR SELECCIONADOS ---
  const deleteSelected = () => {
    // Filtramos los nodos que NO están seleccionados
    setNodes((nds) => nds.filter((node) => !node.selected));
    // Filtramos los cables que NO están seleccionados
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  };

  // --- 2. FUNCIÓN AGREGAR POR CLICK (Móvil) ---
  const onAddNode = (type, label) => {
    const id = `node_${Date.now()}`;
    // Posición aleatoria cerca del centro para que no se encimen
    const position = { 
        x: 100 + Math.random() * 50, 
        y: 100 + Math.random() * 50 
    };

    // Nombre automático para entradas
    let finalLabel = label;
    if(type === 'input') {
        const count = nodes.filter(n => n.type === 'input').length;
        finalLabel = String.fromCharCode(65 + count); 
    }

    const newNode = { id, type, position, data: { label: finalLabel } };
    setNodes((nds) => nds.concat(newNode));
  };

  // --- ARRASTRAR Y SOLTAR (PC) ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      let finalLabel = label;
      if(type === 'input') {
          const count = nodes.filter(n => n.type === 'input').length;
          finalLabel = String.fromCharCode(65 + count); 
      }

      const newNode = { id: `node_${Date.now()}`, type, position, data: { label: finalLabel } };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes]
  );

  const recorrerHaciaAtras = (nodoId) => {
    const nodo = nodes.find(n => n.id === nodoId);
    if (!nodo) return "?";
    if (nodo.type === 'input') return nodo.data.label;

    const entradas = edges.filter(e => e.target === nodoId);
    if (entradas.length === 0) return "?";

    const formulasHijos = entradas.map(e => recorrerHaciaAtras(e.source));
    const op = nodo.data.label; 

    if(nodo.type === 'output') return formulasHijos[0] || "?";
    if (op === "NOT") return `¬(${formulasHijos[0]})`;
    if (op === "NAND") return `¬((${formulasHijos.join(" · ")}))`;
    if (op === "NOR")  return `¬((${formulasHijos.join(" + ")}))`;
    if (op === "XNOR") return `¬((${formulasHijos.join(" ⊕ ")}))`;
    if (op === "AND") return `(${formulasHijos.join(" · ")})`;
    if (op === "OR") return `(${formulasHijos.join(" + ")})`;
    if (op === "XOR") return `(${formulasHijos.join(" ⊕ ")})`;

    return `(${formulasHijos.join(` ${op} `)})`;
  };

  const procesarCircuito = () => {
    const outputs = nodes.filter(n => n.type === 'output');
    if(outputs.length === 0) return alert("Agrega una SALIDA final");
    const formula = recorrerHaciaAtras(outputs[0].id);
    setFormulaShow(formula);
    setResultado(generarTablaVerdad(formula));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        {/* Pasamos la función onAddNode al Sidebar */}
        <Sidebar onAdd={onAddNode} />
        
        <div style={{ flexGrow: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
          >
            <Background color="#555" gap={16} />
            <Controls />
            <MiniMap style={{height: 80, width: 100}} />
          </ReactFlow>

          {/* BOTÓN BASURA FLOTANTE */}
          <button className="delete-btn" onClick={deleteSelected}>
             🗑️
          </button>

          <div style={panelStyle}>
            <button onClick={procesarCircuito} style={{width:'100%', padding:8, background:'#00e676', border:'none', borderRadius: 4, fontWeight:'bold'}}>
              ▶ CALCULAR
            </button>
            {formulaShow && <div style={{marginTop:10, color:'#0f0', wordBreak:'break-all'}}>{formulaShow}</div>}
            {resultado && (
                <div style={{marginTop:10}}>
                    <table>
                        <thead>
                            <tr>{resultado.vars.map(v => <th key={v}>{v}</th>)}<th>F</th></tr>
                        </thead>
                        <tbody>
                            {resultado.data.map((fila, i) => (
                                <tr key={i}>
                                    {fila.inputs.map((b, j) => <td key={j}>{b}</td>)}
                                    <td style={{color: fila.output===1?'#0f0':'#777'}}>{fila.output}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
    </div>
  );
}

// Envolvemos todo en el Provider para que funcione useReactFlow
export default function App() {
    return (
        <ReactFlowProvider>
            <CircuitBuilder />
        </ReactFlowProvider>
    );
}