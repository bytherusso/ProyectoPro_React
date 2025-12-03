import React from 'react';

// Recibimos la función "onAdd" desde la App principal
export default function Sidebar({ onAdd }) {
  
  // Mantenemos el drag por si acaso usas PC
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Función auxiliar para manejar el click
  const handleClick = (type, label) => {
    if (onAdd) onAdd(type, label);
  };

  return (
    <aside style={{ padding: '10px', borderRight: '1px solid #333', background: '#1a1a1a', width: '120px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
      <h4 style={{ color: '#00e676', margin: '5px 0', textAlign: 'center' }}>Toque para agregar</h4>
      
      {/* INPUT */}
      <div className="dndnode input" 
           onClick={() => handleClick('input', 'Entrada')} 
           onDragStart={(e) => onDragStart(e, 'input', 'Entrada')} draggable>
        🔲 In
      </div>

      <hr style={{width:'100%', borderColor:'#444', margin: '5px 0'}}/>

      {/* BÁSICAS */}
      <div className="dndnode" onClick={() => handleClick('default', 'AND')} style={{borderColor: '#ffcc00'}}>D AND</div>
      <div className="dndnode" onClick={() => handleClick('default', 'OR')} style={{borderColor: '#ff9800'}}>🚀 OR</div>
      <div className="dndnode" onClick={() => handleClick('default', 'NOT')} style={{borderColor: '#29b6f6'}}>⚠️ NOT</div>
      <div className="dndnode" onClick={() => handleClick('default', 'XOR')} style={{borderColor: '#9c27b0'}}>⊕ XOR</div>

      <hr style={{width:'100%', borderColor:'#444', margin: '5px 0'}}/>

      {/* PROS */}
      <div className="dndnode" onClick={() => handleClick('default', 'NAND')} style={{borderColor: '#e91e63'}}>D° NAND</div>
      <div className="dndnode" onClick={() => handleClick('default', 'NOR')} style={{borderColor: '#ff5722'}}>🚀° NOR</div>
      <div className="dndnode" onClick={() => handleClick('default', 'XNOR')} style={{borderColor: '#673ab7'}}>⊕° XNOR</div>

      <hr style={{width:'100%', borderColor:'#444', margin: '5px 0'}}/>

      <div className="dndnode output" onClick={() => handleClick('output', 'Salida')}>💡 Out</div>
    </aside>
  );
}