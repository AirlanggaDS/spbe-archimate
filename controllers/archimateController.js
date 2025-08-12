
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const generatePlantUML = require('../library/generateDiagram');
const plantumlEncoder = require('plantuml-encoder');
const { archimateMap, IdsRelation, specialRelation, groupTypes } = require('../library/mapping');

exports.archimateStructured = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    let globalData = {};
    let archimateElements = [];

    const groups = {
      "Group Platform": [],
      "Group Sistem Integrasi": [],
      "Group Keamanan": []
    };

    const relations = [];
    const relationSet = new Set();
    const elementMap = {};
    const actorMap = {};

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

        if (!elementMap[id]) elementMap[id] = [];
        elementMap[id].push(element);

        const group = Object.entries(groupTypes).find(([_, sheets]) => sheets.includes(sheet));
        if (group) {
          groups[group[0]].push(element);
        } else {
          archimateElements.push(element);
        }

        if (sheet === 'Layanan' && item['Target Layanan']) {
          const actorName = item['Target Layanan'].trim();
          let actor = actorMap[actorName];

          if (!actor) {
            const actorId = `ACT_${actorName.replace(/\s+/g, '_').toUpperCase()}`;
            actor = {
              metadata: 'Pengguna Layanan',
              id: actorId,
              name: actorName,
              type: 'Business Actor',
              relatedLayananIds: []
            };
            actorMap[actorName] = actor;
            archimateElements.push(actor);
            if (!elementMap[actor.id]) elementMap[actor.id] = [];
            elementMap[actor.id].push(actor);
          }

          if (!actor.relatedLayananIds.includes(id)) {
            actor.relatedLayananIds.push(id);
          }

          if (!globalData['Pengguna Layanan']) globalData['Pengguna Layanan'] = [];
          globalData['Pengguna Layanan'].push({
            ID: actor.id,
            'ID Metadata Terkait': item['ID Metadata Terkait']
          });
        }
      });
    });

    const getRelTypeAndRole = (fromMeta, toMeta) => {
      for (const { source, target, relation } of [...IdsRelation, ...specialRelation]) {
        if ((fromMeta === source && toMeta === target) || (fromMeta === target && toMeta === source)) {
          return fromMeta === source
            ? { rel: relation, fromRole: 'source', toRole: 'target' }
            : { rel: relation, fromRole: 'target', toRole: 'source' };
        }
      }
      return null;
    };

    Object.entries(globalData).forEach(([sheet, items]) => {
      items.forEach(item => {
        const id = item['ID'];
        const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
        const fromList = [].concat(elementMap[id] || []);

        relatedIds.forEach(relId => {
          const toList = [].concat(elementMap[relId] || []);

          fromList.forEach(from => {
            toList.forEach(to => {
              if (!from || !to) return;

              const relInfo = getRelTypeAndRole(from.metadata, to.metadata);
              if (relInfo) {
                const source = relInfo.fromRole === 'source' ? from : to;
                const target = relInfo.fromRole === 'source' ? to : from;

                const pairKey = `${relInfo.rel}|${source.id}->${target.id}`;
                if (!relationSet.has(pairKey)) {
                  relationSet.add(pairKey);
                  relations.push({
                    name: relInfo.rel,
                    ids: [
                      {
                        role: 'source',
                        id: source.id,
                        name: source.name,
                        metadata: source.metadata,
                        type: source.type
                      },
                      {
                        role: 'target',
                        id: target.id,
                        name: target.name,
                        metadata: target.metadata,
                        type: target.type
                      }
                    ]
                  });
                }
              }

              if (from.metadata === 'Aplikasi' && to.metadata === 'Layanan') {
                const penggunaList = Object.values(actorMap).filter(actor =>
                  actor.relatedLayananIds.includes(to.id)
                );

                penggunaList.forEach(pengguna => {
                  const userKey = [from.id + from.name + from.metadata, pengguna.id + pengguna.name + pengguna.metadata].sort().join('|');
                  if (relationSet.has(userKey)) return;

                  const userRel = getRelTypeAndRole(from.metadata, pengguna.metadata);
                  if (!userRel) return;

                  relationSet.add(userKey);
                  relations.push({
                    name: userRel.rel,
                    ids: [
                      {
                        role: userRel.fromRole,
                        id: from.id,
                        name: from.name,
                        metadata: from.metadata,
                        type: from.type
                      },
                      {
                        role: userRel.toRole,
                        id: pengguna.id,
                        name: pengguna.name,
                        metadata: pengguna.metadata,
                        type: pengguna.type
                      }
                    ]
                  });
                });
              }
            });
          });
        });
      });
    });

    for (const { source: fromGroup, target: toType, relation: relType } of specialRelation) {
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

    // === Inject koneksi ke elemen ===
    const connectionMap = {};
    relations.forEach(rel => {
      rel.ids.forEach((entry, idx) => {
        const counterparty = rel.ids[1 - idx];

        if (!connectionMap[entry.id]) {
          connectionMap[entry.id] = {
            totalConnectedTo: 0,
            connectionsTo: {}
          };
        }

        connectionMap[entry.id].totalConnectedTo += 1;

        if (!connectionMap[entry.id].connectionsTo[counterparty.metadata]) {
          connectionMap[entry.id].connectionsTo[counterparty.metadata] = 0;
        }

        connectionMap[entry.id].connectionsTo[counterparty.metadata] += 1;
      });
    });

    const injectConnections = el => {
      const conn = connectionMap[el.id];
      el.totalConnectedTo = conn?.totalConnectedTo || 0;
      el.connectionsTo = conn?.connectionsTo || {};
    };

    archimateElements.forEach(injectConnections);
    Object.keys(groups).forEach(groupName => {
      groups[groupName].forEach(injectConnections);
    });

    // === Buat grup structured ===
    const structuredGroups = {};
    Object.entries(groups).forEach(([groupName, elements]) => {
      const groupConn = connectionMap[groupName] || {
        totalConnectedTo: 0,
        connectionsTo: {}
      };

      structuredGroups[groupName] = {
        metadata: groupName,
        type: 'Group',
        totalConnectedTo: groupConn.totalConnectedTo,
        connectionsTo: groupConn.connectionsTo,
        elements
      };
    });

    // === Summary ===
    const allElements = [...archimateElements, ...Object.values(groups).flat()];
    const totalElements = allElements.length;
    const totalRelations = relations.length;

    const totalElementsPerMetadata = {};
    allElements.forEach(el => {
      totalElementsPerMetadata[el.metadata] = (totalElementsPerMetadata[el.metadata] || 0) + 1;
    });

    // === Final Output ===
    res.status(200).json({
      message: 'Structured ArchiMate elements and mapped relations extracted',
      summary: {
        totalElements,
        totalPerMetadata: totalElementsPerMetadata,
        totalRelations
      },
      elements: {
        regular: archimateElements,
        ...structuredGroups
      },
      relations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
};


exports.generateDiagram = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    let globalData = {};
    let archimateElements = [];
    const groups = {
      "Group Platform": [],
      "Group Sistem Integrasi": [],
      "Group Keamanan": []
    };

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

        if (!elementMap[id]) elementMap[id] = [];
        elementMap[id].push(element);

        const group = Object.entries(groupTypes).find(([_, sheets]) => sheets.includes(sheet));
        if (group) {
          groups[group[0]].push(element);
        } else {
          archimateElements.push(element);
        }

        if (sheet === 'Layanan' && item['Target Layanan']) {
          const actorName = item['Target Layanan'].trim();
          let actor = actorMap[actorName];

          if (!actor) {
            const actorId = `ACT_${actorName.replace(/\s+/g, '_').toUpperCase()}`;
            actor = {
              metadata: 'Pengguna Layanan',
              id: actorId,
              name: actorName,
              type: 'Business Actor',
              relatedLayananIds: []
            };
            actorMap[actorName] = actor;
            archimateElements.push(actor);
            if (!elementMap[actor.id]) elementMap[actor.id] = [];
            elementMap[actor.id].push(actor);
          }

          if (!actor.relatedLayananIds.includes(id)) {
            actor.relatedLayananIds.push(id);
          }

          if (!globalData['Pengguna Layanan']) globalData['Pengguna Layanan'] = [];
          globalData['Pengguna Layanan'].push({
            ID: actor.id,
            'ID Metadata Terkait': item['ID Metadata Terkait']
          });
        }
      });
    });

    const getRelTypeAndRole = (fromMeta, toMeta) => {
      for (const { source, target, relation } of [...IdsRelation, ...specialRelation]) {
        if ((fromMeta === source && toMeta === target) || (fromMeta === target && toMeta === source)) {
          return fromMeta === source
            ? { rel: relation, fromRole: 'source', toRole: 'target' }
            : { rel: relation, fromRole: 'target', toRole: 'source' };
        }
      }
      return null;
    };

    Object.entries(globalData).forEach(([sheet, items]) => {
      items.forEach(item => {
        const id = item['ID'];
        const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
        const fromList = [].concat(elementMap[id] || []);

        relatedIds.forEach(relId => {
          const toList = [].concat(elementMap[relId] || []);

          fromList.forEach(from => {
            toList.forEach(to => {
              if (!from || !to) return;

              const pairKey = [from.id + from.name + from.metadata, to.id + to.metadata].sort().join('|');
              if (!relationSet.has(pairKey)) {
                const relInfo = getRelTypeAndRole(from.metadata, to.metadata);
                if (relInfo) {
                  relationSet.add(pairKey);
                  relations.push({
                    name: relInfo.rel,
                    ids: [
                      {
                        role: relInfo.fromRole,
                        id: from.id,
                        name: from.name,
                        metadata: from.metadata,
                        type: from.type
                      },
                      {
                        role: relInfo.toRole,
                        id: to.id,
                        name: to.name,
                        metadata: to.metadata,
                        type: to.type
                      }
                    ]
                  });
                }
              }

              if (from.metadata === 'Aplikasi' && to.metadata === 'Layanan') {
                const penggunaList = Object.values(actorMap).filter(actor =>
                  actor.relatedLayananIds.includes(to.id)
                );

                penggunaList.forEach(pengguna => {
                  const userKey = [from.id + from.name + from.metadata, pengguna.id + pengguna.name + pengguna.metadata].sort().join('|');
                  if (relationSet.has(userKey)) return;

                  const userRel = getRelTypeAndRole(from.metadata, pengguna.metadata);
                  if (!userRel) return;

                  relationSet.add(userKey);
                  relations.push({
                    name: userRel.rel,
                    ids: [
                      {
                        role: userRel.fromRole,
                        id: from.id,
                        name: from.name,
                        metadata: from.metadata,
                        type: from.type
                      },
                      {
                        role: userRel.toRole,
                        id: pengguna.id,
                        name: pengguna.name,
                        metadata: pengguna.metadata,
                        type: pengguna.type
                      }
                    ]
                  });
                });
              }
            });
          });
        });
      });
    });

    for (const { source: fromGroup, target: toType, relation: relType } of specialRelation) {
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

    // === Inject koneksi ke elemen ===
    const connectionMap = {};
    relations.forEach(rel => {
      rel.ids.forEach((entry, idx) => {
        const counterparty = rel.ids[1 - idx];

        if (!connectionMap[entry.id]) {
          connectionMap[entry.id] = {
            totalConnectedTo: 0,
            connectionsTo: {}
          };
        }

        connectionMap[entry.id].totalConnectedTo += 1;

        if (!connectionMap[entry.id].connectionsTo[counterparty.metadata]) {
          connectionMap[entry.id].connectionsTo[counterparty.metadata] = 0;
        }

        connectionMap[entry.id].connectionsTo[counterparty.metadata] += 1;
      });
    });

    const injectConnections = el => {
      const conn = connectionMap[el.id];
      el.totalConnectedTo = conn?.totalConnectedTo || 0;
      el.connectionsTo = conn?.connectionsTo || {};
    };

    archimateElements.forEach(injectConnections);
    Object.keys(groups).forEach(groupName => {
      groups[groupName].forEach(injectConnections);
    });

    // === Buat grup structured ===
    const structuredGroups = {};
    Object.entries(groups).forEach(([groupName, elements]) => {
      const groupConn = connectionMap[groupName] || {
        totalConnectedTo: 0,
        connectionsTo: {}
      };

      structuredGroups[groupName] = {
        metadata: groupName,
        type: 'Group',
        totalConnectedTo: groupConn.totalConnectedTo,
        connectionsTo: groupConn.connectionsTo,
        elements
      };
    });

    // === Summary ===
    const allElements = [...archimateElements, ...Object.values(groups).flat()];
    const totalElements = allElements.length;
    const totalRelations = relations.length;

    const totalElementsPerMetadata = {};
    allElements.forEach(el => {
      totalElementsPerMetadata[el.metadata] = (totalElementsPerMetadata[el.metadata] || 0) + 1;
    });

    const payloadJSON = {
      summary: {
        totalElements,
        totalPerMetadata: totalElementsPerMetadata,
        totalRelations
      },
      elements: {
        regular: archimateElements,
        ...structuredGroups
      },
      relations
    }

    const umlCode = generatePlantUML(payloadJSON.elements, relations);

    // 3. Encode syntax untuk render diagram
    const encodedUml = plantumlEncoder.encode(umlCode);
    // res.render('diagram', {
    //   umlCode,
    //   encodedUml,
    // });

    res.redirect(`/diagram/${encodedUml}`);

    // Opsional: Hapus file setelah diproses
  } catch (err) {
    console.error('Error generating diagram:', err);
    res.status(500).send('Terjadi kesalahan saat memproses file Excel.');
  }
  fs.unlinkSync(req.file.path);
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

