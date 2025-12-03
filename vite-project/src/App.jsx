import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';

// ESTILOS DEL PANEL FLOTANTE
const panelStyle = {
  position: 'absolute', top: 10, right: 10, zIndex: 10,
  background: '#1e1e1e', padding: 20, borderRadius: 8,
  border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto', width: 320,
  color: '#fff'
};

// MOTOR LÓGICO (SOPORTA SÍMBOLOS)
const generarTablaVerdad = (formula) => {
    try {
        // 1. Limpieza: Buscar variables (A, B, C...)
        // Ahora permitimos letras y números, excluyendo los símbolos nuevos
        const tokens = formula.match(/[a-zA-Z0-9_]+/g) || [];
        const vars = [...new Set(tokens)].sort();
        
        if (vars.length === 0) return null;

        const filas = Math.pow(2, vars.length);
        const data = [];

        // 2. Traducción: Símbolos -> JavaScript Puro
        let exprJS = formula
            .replace(/·/g, '&&')   // El punto es AND
            .replace(/\+/g, '||')  // El más es OR (escapamos el + porque es especial en regex)
            .replace(/¬/g, '!')    // El ganchito es NOT
            .replace(/⊕/g, '^');   // El círculo cruz es XOR

        // 3. Motor de Cálculo
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
            } catch(e) { 
                fila.output = '-'; 
            }
            data.push(fila);
        }
        return { vars, data };
    } catch(e) { 
        console.error("Error generando tabla:", e);
        return null; 
    }
};

const initialNodes = [
  { id: 'A', type: 'input', data: { label: 'A' }, position: { x: 50, y: 50 } },
  { id: 'gate1', data: { label: 'AND' }, position: { x: 250, y: 100 } },
  { id: 'salida', type: 'output', data: { label: 'Salida' }, position: { x: 450, y: 100 } },
];

export default function App() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [formulaShow, setFormulaShow] = useState("");

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // --- DRAG & DROP ---
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let finalLabel = label;
      if(type === 'input') {
          const count = nodes.filter(n => n.type === 'input').length;
          finalLabel = String.fromCharCode(65 + count); 
      }

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: finalLabel },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes]
  );

  // --- RECORRER GRAFO (VERSIÓN SÍMBOLOS) ---
  const recorrerHaciaAtras = (nodoId) => {
    const nodo = nodes.find(n => n.id === nodoId);
    if (!nodo) return "?";
    
    // Caso Base: Es una entrada (Input)
    if (nodo.type === 'input') return nodo.data.label;

    const entradas = edges.filter(e => e.target === nodoId);
    if (entradas.length === 0) return "?";

    const formulasHijos = entradas.map(e => recorrerHaciaAtras(e.source));
    const op = nodo.data.label; 

    if(nodo.type === 'output') return formulasHijos[0] || "?";

    // --- SÍMBOLOS DE INGENIERÍA ---
    // Usamos paréntesis para agrupar siempre y evitar confusiones
    
    // 1. Negación (¬)
    if (op === "NOT") return `¬(${formulasHijos[0]})`;

    // 2. Compuertas Negadas (NAND, NOR, XNOR)
    // NAND = ¬(A · B)
    if (op === "NAND") return `¬((${formulasHijos.join(" · ")}))`;
    // NOR = ¬(A + B)
    if (op === "NOR")  return `¬((${formulasHijos.join(" + ")}))`;
    // XNOR = ¬(A ⊕ B)
    if (op === "XNOR") return `¬((${formulasHijos.join(" ⊕ ")}))`;

    // 3. Compuertas Normales
    if (op === "AND") return `(${formulasHijos.join(" · ")})`;
    if (op === "OR")  return `(${formulasHijos.join(" + ")})`;
    if (op === "XOR") return `(${formulasHijos.join(" ⊕ ")})`;

    return "Error";
  };

  const procesarCircuito = () => {
    const outputs = nodes.filter(n => n.type === 'output');
    if(outputs.length === 0) return alert("¡Agrega una SALIDA final!");
    
    const formula = recorrerHaciaAtras(outputs[0].id);
    setFormulaShow(formula);
    
    // Generar Tabla (Usando el nuevo motor nativo)
    const tabla = generarTablaVerdad(formula);
    setResultado(tabla);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <ReactFlowProvider>
        <Sidebar />
        
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
            <MiniMap style={{height: 100}} />
          </ReactFlow>

          {/* PANEL DE RESULTADOS */}
          <div style={panelStyle}>
            <h3>🛠️ Analizador Pro</h3>
            <button onClick={procesarCircuito} style={{width:'100%', padding:10, background:'#00e676', border:'none', cursor:'pointer', fontWeight:'bold', borderRadius: 4}}>
              ▶ CALCULAR TABLA
            </button>
            
            {formulaShow && (
                <div style={{marginTop:15, padding:10, background:'#000', borderRadius:4, fontSize:'0.9em', wordBreak:'break-all', border: '1px solid #555'}}>
                    <strong style={{color:'#aaa'}}>Fórmula detectada:</strong><br/>
                    <span style={{color:'#0f0'}}>{formulaShow}</span>
                </div>
            )}

            {resultado && (
                <div style={{marginTop:15}}>
                    <h4>Tabla de Verdad</h4>
                    <table>
                        <thead>
                            <tr>
                                {resultado.vars.map(v => <th key={v}>{v}</th>)}
                                <th>F</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultado.data.map((fila, i) => (
                                <tr key={i}>
                                    {fila.inputs.map((b, j) => <td key={j}>{b}</td>)}
                                    <td className={fila.output===1 ? 'res-1':'res-0'}>{fila.output}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}