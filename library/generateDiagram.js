const { spriteElementMap, hierarchyOrder, layerMap, relMacroMap, labelMap } = require('./mapping');

function generatePlantUML(elements, relations) {
  const lines = [];
  lines.push('@startuml');
  lines.push('skinparam nodesep 130');
  lines.push('skinparam ranksep 130');
  lines.push('skinparam linetype ortho');
  lines.push('!include <archimate/Archimate>');

  const getOrderIndex = (type) => {
    if (type.startsWith('Group')) return hierarchyOrder.indexOf(type);
    return hierarchyOrder.indexOf(type) !== -1 ? hierarchyOrder.indexOf(type) : 999;
  };

  for (const def of Object.values(spriteElementMap)) {
    lines.push(`sprite ${def.type} jar:${def.sprite}`);
  }

  lines.push('');

  function sanitizeId(val) {
    if (typeof val === 'string') return val.replace(/\s+/g, '_');
    if (val?.id) return String(val.id).replace(/\s+/g, '_');
    return String(val).replace(/\s+/g, '_');
  }

  // Urutkan semua elemen regular sesuai hierarchyOrder
  for (const type of hierarchyOrder) {
    const groupId = type.replace(/\s+/g, '_');
    const matchingElements = type.startsWith('Group')
      ? elements[type] || []
      : (elements.regular || []).filter(el => el.type === type);

    if (matchingElements.length > 0) {
      if (type.startsWith('Group')) {
        lines.push('together {');
        lines.push(`package "${type}" as ${groupId} {`);
        for (const el of matchingElements) {
          const sprite = spriteElementMap[el.type]?.type || '';
          const layer = layerMap[el.type] || '';
          lines.push(`  rectangle "${el.name}\\n-\\n[${el.metadata}]" as ${sanitizeId(el.id)} <<${sprite}>> #${layer}`);
        }
        lines.push('}');
        lines.push('}');
      } else {
        lines.push('together {');
        for (const el of matchingElements) {
          const sprite = spriteElementMap[el.type]?.type || '';
          const layer = layerMap[el.type] || '';

          lines.push(`  rectangle "${el.name}\\n-\\n[${el.metadata}]" as ${sanitizeId(el.id)} <<${sprite}>> #${layer}`);
        }
        lines.push('}');
      }
      lines.push('');
    }
  }

  function getElementTypeById(elements, id) {
    id = typeof id === 'string' ? id.trim() : id;

    // Periksa elemen reguler
    for (const el of (elements.regular || [])) {
      if (el.id === id) {
        return el.type;
      }
    }

    // Periksa setiap grup (Group Platform, Group Sistem Integrasi, dll)
    for (const groupKey of Object.keys(elements)) {
      if (groupKey === 'regular') continue;
      const group = elements[groupKey];
      for (const el of group) {
        if (el.id === id) {
          return el.type || groupKey; // fallback ke nama grup jika type kosong
        }
      }
    }

    return ''; // return kosong jika tidak ditemukan
  }


  for (const rel of relations) {
    // Dapatkan source dan target berdasarkan role di rel.ids
    const sourceObj = rel.ids.find(e => e.role === 'source') || rel.ids[0];
    const targetObj = rel.ids.find(e => e.role === 'target') || rel.ids[1];

    const from = sanitizeId(sourceObj.id);
    const to = sanitizeId(targetObj.id);
    const relType = rel.name;
    const macroBase = relMacroMap[relType] || `Rel_${relType}`;

    const fromType = getElementTypeById(elements, sourceObj.id);
    const toType = getElementTypeById(elements, targetObj.id);

    const fromOrder = getOrderIndex(fromType);
    const toOrder = getOrderIndex(toType);

    let direction = '';
    if (sourceObj.metadata === 'Fasilitas Komputasi' && (targetObj.metadata === 'Group Sistem Integrasi' || targetObj.metadata === 'Group Platform')) {
      direction = 'Right';
    } else if (sourceObj.metadata === 'Group Keamanan') {
      direction = 'Up';
    } else if (fromOrder < toOrder) {
      direction = 'Down';
    } else if (fromOrder > toOrder) {
      direction = 'Up';
    } else {
      direction = 'Down';
    }

    const macro = `${macroBase}_${direction}`;
    lines.push(`${macro}(${from}, ${to}, "${relType}")`);
  }


  lines.push('');
  lines.push('legend left');
  lines.push('Element Legend');
  lines.push('==============');



  for (const type of new Set(Object.values(spriteElementMap).map(e => e.type))) {
    const label = Object.keys(spriteElementMap).find(k => spriteElementMap[k].type === type);
    if (labelMap[label]) {
      lines.push(`<${type}> : ${labelMap[label]}`);
    }
  }

  lines.push('endlegend');
  lines.push('@enduml');
  return lines.join('\n');
}

module.exports = generatePlantUML;
