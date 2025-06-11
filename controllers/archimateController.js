
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const generatePlantUML = require('../library/generateDiagram');
const plantumlEncoder = require('plantuml-encoder');
const { archimateMap, IdsRelation, specialRelation, groups, groupTypes } = require('../library/mapping');

let globalData = {}; // Global JSON
let archimateElements = []; // Global ArchiMate data

exports.archimateStructured = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const workbook = xlsx.readFile(req.file.path);
  globalData = {};
  archimateElements = [];

  const relations = [];
  const relationSet = new Set();
  const elementMap = {}; // ID -> element

  Object.entries(archimateMap).forEach(([sheet, config]) => {
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet] || [], { defval: '' });
    globalData[sheet] = sheetData;

    sheetData.forEach(item => {
      const id = item['ID'];
      const name = item[config.nameAttr];
      if (!id || !name) return;

      let displayName = name;
      if (config.suffixAttr && item[config.suffixAttr]) {
        displayName += ` <${item[config.suffixAttr]}>`;
      }

      const element = {
        metadata: sheet,
        id,
        name: displayName,
        type: config.type
      };
      elementMap[id] = element;

      const group = Object.entries(groupTypes).find(([_, sheets]) => sheets.includes(sheet));
      if (group) {
        groups[group[0]].push(element);
      } else {
        archimateElements.push(element);
      }
      // Business Actor dari Layanan
      if (sheet === 'Layanan' && item['Target Layanan']) {
        const actor = {
          metadata: 'Pengguna Layanan',
          id: `ACT_${id}`,
          name: item['Target Layanan'],
          type: 'Business Actor'
        };
        archimateElements.push(actor);
        elementMap[`ACT_${id}`] = actor;

        if (!globalData['Pengguna Layanan']) {
          globalData['Pengguna Layanan'] = [];
        }
        globalData['Pengguna Layanan'].push({
          ID: actor.id,
          'ID Metadata Terkait': item['ID Metadata Terkait']
        });
      }
    });
  });

  // Fungsi untuk cari relasi dan peran role source/target
  const getRelTypeAndRole = (fromMeta, toMeta) => {
    // Cari di IdsRelation
    for (const { types, source, target, relation } of IdsRelation) {
      if (
        (fromMeta === source && toMeta === target) ||
        (fromMeta === target && toMeta === source)
      ) {
        if (fromMeta === source && toMeta === target) {
          return { rel: relation, fromRole: 'source', toRole: 'target' };
        } else {
          return { rel: relation, fromRole: 'target', toRole: 'source' };
        }
      }
    }
    // Cari di specialRelation
    for (const { types, source, target, relation } of specialRelation) {
      if (
        (fromMeta === source && toMeta === target) ||
        (fromMeta === target && toMeta === source)
      ) {
        if (fromMeta === source && toMeta === target) {
          return { rel: relation, fromRole: 'source', toRole: 'target' };
        } else {
          return { rel: relation, fromRole: 'target', toRole: 'source' };
        }
      }
    }
    // Default fallback
    return { rel: 'Association', fromRole: 'source', toRole: 'target' };
  };

  Object.entries(globalData).forEach(([sheet, items]) => {
    items.forEach(item => {
      const id = item['ID'];
      const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
      relatedIds.forEach(relId => {
        const from = elementMap[id];
        const to = elementMap[relId];
        if (!from || !to) return;

        const pairKey = [from.id, to.id].sort().join('|');
        if (!relationSet.has(pairKey)) {
          relationSet.add(pairKey);

          // Dapatkan relasi dan role source/target
          const { rel, fromRole, toRole } = getRelTypeAndRole(from.metadata, to.metadata);

          relations.push({
            name: rel,
            ids: [
              {
                role: fromRole,
                id: from.id,
                metadata: from.metadata,
                type: from.type
              },
              {
                role: toRole,
                id: to.id,
                metadata: to.metadata,
                type: to.type
              }
            ]
          });
        }
      });
    });
  });

  // Untuk specialRelation, role sudah jelas dari definisi source/target, jadi bisa pakai cara sama:
  for (const { types, source: fromGroup, target: toType, relation: relType } of specialRelation) {
    const fromIsGroup = fromGroup.startsWith('Group ');
    const toIsGroup = toType.startsWith('Group ');

    const fromList = fromIsGroup
      ? [{ id: fromGroup, metadata: fromGroup, type: 'Group' }]
      : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === fromGroup);

    const toList = toIsGroup
      ? [{ id: toType, metadata: toType, type: 'Group' }]
      : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === toType);

    fromList.forEach(from => {
      toList.forEach(to => {
        const pairKey = [from.id, to.id].sort().join('|');
        if (!relationSet.has(pairKey)) {
          relationSet.add(pairKey);

          relations.push({
            name: relType,
            ids: [
              {
                role: 'source',
                id: from.id,
                metadata: from.metadata,
                type: from.type
              },
              {
                role: 'target',
                id: to.id,
                metadata: to.metadata,
                type: to.type
              }
            ]
          });
        }
      });
    });
  }

  res.status(200).json({
    message: 'Structured ArchiMate elements and mapped relations extracted',
    elements: {
      regular: archimateElements,
      ...groups
    },
    relations
  });
};

exports.generateDiagram = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    globalData = {};
    archimateElements = [];

    const relations = [];
    const relationSet = new Set();
    const elementMap = {}; // ID -> element
    const actorMap = {}; // key: actor name => value: actor object

    Object.entries(archimateMap).forEach(([sheet, config]) => {
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet] || [], { defval: '' });
      globalData[sheet] = sheetData;

      sheetData.forEach(item => {
        const id = item['ID'];
        const name = item[config.nameAttr];
        if (!id || !name) return;

        let displayName = `[${id}] ${name}`;
        if (config.suffixAttr && item[config.suffixAttr]) {
          displayName += ` <${item[config.suffixAttr]}>`;
        }

        const element = {
          metadata: sheet,
          id,
          name: displayName,
          type: config.type
        };
        elementMap[id] = element;

        const group = Object.entries(groupTypes).find(([_, sheets]) => sheets.includes(sheet));
        if (group) {
          groups[group[0]].push(element);
        } else {
          archimateElements.push(element);
        }
        // Business Actor dari Layanan
        if (sheet === 'Layanan' && item['Target Layanan']) {
          const actorName = item['Target Layanan'];
          let actor = actorMap[actorName];
          let actorId;
          if (!actor) {
            actorId = `ACT_${Object.keys(actorMap).length + 1}`;
            actor = {
              metadata: 'Pengguna Layanan',
              id: actorId,
              name: actorName,
              type: 'Business Actor'
            };
            actorMap[actorName] = actor;
            archimateElements.push(actor);
            elementMap[actorId] = actor;
          } else {
            // Sudah ada: gunakan ID yang sama
            actorId = actor.id;
          }

          if (!globalData['Pengguna Layanan']) {
            globalData['Pengguna Layanan'] = [];
          }
          globalData['Pengguna Layanan'].push({
            ID: actorId,
            'ID Metadata Terkait': item['ID Metadata Terkait']
          });
        }
      });
    });

    // Fungsi untuk cari relasi dan peran role source/target
    const getRelTypeAndRole = (fromMeta, toMeta) => {
      // Cari di IdsRelation
      for (const { types, source, target, relation } of IdsRelation) {
        if (
          (fromMeta === source && toMeta === target) ||
          (fromMeta === target && toMeta === source)
        ) {
          if (fromMeta === source && toMeta === target) {
            return { rel: relation, fromRole: 'source', toRole: 'target' };
          } else {
            return { rel: relation, fromRole: 'target', toRole: 'source' };
          }
        }
      }
      // Cari di specialRelation
      for (const { types, source, target, relation } of specialRelation) {
        if (
          (fromMeta === source && toMeta === target) ||
          (fromMeta === target && toMeta === source)
        ) {
          if (fromMeta === source && toMeta === target) {
            return { rel: relation, fromRole: 'source', toRole: 'target' };
          } else {
            return { rel: relation, fromRole: 'target', toRole: 'source' };
          }
        }
      }
      // Default fallback
      return { rel: 'Association', fromRole: 'source', toRole: 'target' };
    };

    Object.entries(globalData).forEach(([sheet, items]) => {
      items.forEach(item => {
        const id = item['ID'];
        const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
        relatedIds.forEach(relId => {
          const from = elementMap[id];
          const to = elementMap[relId];
          if (!from || !to) return;

          const pairKey = [from.id, to.id].sort().join('|');
          if (!relationSet.has(pairKey)) {
            relationSet.add(pairKey);

            // Dapatkan relasi dan role source/target
            const { rel, fromRole, toRole } = getRelTypeAndRole(from.metadata, to.metadata);

            relations.push({
              name: rel,
              ids: [
                {
                  role: fromRole,
                  id: from.id,
                  metadata: from.metadata,
                  type: from.type
                },
                {
                  role: toRole,
                  id: to.id,
                  metadata: to.metadata,
                  type: to.type
                }
              ]
            });
          }
        });
      });
    });

    // Untuk specialRelation, role sudah jelas dari definisi source/target, jadi bisa pakai cara sama:
    for (const { types, source: fromGroup, target: toType, relation: relType } of specialRelation) {
      const fromIsGroup = fromGroup.startsWith('Group ');
      const toIsGroup = toType.startsWith('Group ');

      const fromList = fromIsGroup
        ? [{ id: fromGroup, metadata: fromGroup, type: 'Group' }]
        : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === fromGroup);

      const toList = toIsGroup
        ? [{ id: toType, metadata: toType, type: 'Group' }]
        : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === toType);

      fromList.forEach(from => {
        toList.forEach(to => {
          const pairKey = [from.id, to.id].sort().join('|');
          if (!relationSet.has(pairKey)) {
            relationSet.add(pairKey);

            relations.push({
              name: relType,
              ids: [
                {
                  role: 'source',
                  id: from.id,
                  metadata: from.metadata,
                  type: from.type
                },
                {
                  role: 'target',
                  id: to.id,
                  metadata: to.metadata,
                  type: to.type
                }
              ]
            });
          }
        });
      });
    }

    const elements = {
      regular: archimateElements,
      ...groups
    };

    let horizontal = false;
    if (req.query.horizontal) horizontal = true;
    const umlCode = generatePlantUML(elements, relations, horizontal);

    // 3. Encode syntax untuk render diagram
    const encodedUml = plantumlEncoder.encode(umlCode);



    // res.render('diagram', {
    //   umlCode,
    //   encodedUml,
    // });

    res.redirect(`/diagram/${encodedUml}`);

    // Opsional: Hapus file setelah diproses
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error('Error generating diagram:', err);
    res.status(500).send('Terjadi kesalahan saat memproses file Excel.');
  }
};

exports.renderDiagramFromSlug = (req, res) => {
  const encodedUml = req.params.slug;

  try {
    const umlCode = plantumlEncoder.decode(encodedUml);
    res.render('diagram', {
      umlCode,
      encodedUml,
    });
  } catch (err) {
    console.error('Gagal decode UML:', err);
    res.status(400).send('Slug UML tidak valid.');
  }
};

