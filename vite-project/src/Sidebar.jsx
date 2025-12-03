import React from 'react';

export default function Sidebar() {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ padding: '15px', borderRight: '1px solid #333', background: '#1a1a1a', width: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ color: '#00e676', marginTop: 0 }}>Componentes</h3>
      
      {/* Entradas */}
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'input', 'Entrada')} draggable>
        🔲 Entrada (A, B...)
      </div>

      <hr style={{width:'100%', borderColor:'#444'}}/>

      {/* Compuertas Básicas */}
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'AND')} draggable style={{borderColor: '#ffcc00'}}>
        D AND
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'OR')} draggable style={{borderColor: '#ff9800'}}>
        🚀 OR
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'NOT')} draggable style={{borderColor: '#29b6f6'}}>
        ⚠️ NOT
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'XOR')} draggable style={{borderColor: '#9c27b0'}}>
        ⊕ XOR
      </div>

      <hr style={{width:'100%', borderColor:'#444'}}/>

      {/* NUEVAS COMPUERTAS (Universales) */}
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'NAND')} draggable style={{borderColor: '#e91e63'}}>
        D° NAND
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'NOR')} draggable style={{borderColor: '#ff5722'}}>
        🚀° NOR
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'default', 'XNOR')} draggable style={{borderColor: '#673ab7'}}>
        ⊕° XNOR
      </div>

      <hr style={{width:'100%', borderColor:'#444'}}/>

      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'output', 'Salida')} draggable>
        💡 Salida Final
      </div>
    </aside>
  );
}