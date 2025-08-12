const { spriteElementMap, hierarchyOrder, layerMap, relMacroMap, labelMap, platformPosition } = require('./mapping');

function generatePlantUML(elements, relations) {
  const lines = [];
  lines.push('@startuml');
  lines.push('skinparam nodesep 110');
  lines.push('skinparam ranksep 110');
  lines.push('skinparam linetype ortho');
  // lines.push('hide stereotype');

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
    const raw = typeof val === 'string' ? val
      : (val?.id ? String(val.id)
        : String(val));
    // Ganti semua karakter non-alfanumerik (kecuali underscore) dengan _
    return raw.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  // Urutkan semua elemen regular sesuai hierarchyOrder
  for (const type of hierarchyOrder) {
    const groupId = type.replace(/\s+/g, '_');
    const matchingElements = type.startsWith('Group')
      ? elements[type]?.elements || []
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
      for (const el of group?.elements) {
        if (el.id === id) {
          return el.type || groupKey; // fallback ke nama grup jika type kosong
        }
      }
    }

    return ''; // return kosong jika tidak ditemukan
  }


  for (const rel of relations) {
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

    // 🔧 Gunakan metadata karena platformPosition pakai nama entitas, bukan tipe elemen
    const fromMeta = sourceObj.metadata;
    const toMeta = targetObj.metadata;

    if (platformPosition[fromMeta] && platformPosition[toMeta]) {
      const fromPos = platformPosition[fromMeta];
      const toPos = platformPosition[toMeta];

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        direction = dx > 0 ? 'Right' : 'Left';
      } else {
        direction = dy > 0 ? 'Down' : 'Up';
      }

    } else if (fromMeta === 'Fasilitas Komputasi' &&
      (toMeta === 'Group Sistem Integrasi' || toMeta === 'Group Platform')) {
      direction = 'Right';

    } else if (fromMeta === 'Group Keamanan') {
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
