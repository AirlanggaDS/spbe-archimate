
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Pemetaan nama worksheet ke ArchiMate type dan field yang dipakai sebagai nama elemen
const worksheetMap = {
  'Proses Bisnis': ['ID', 'Nama Bisnis/Urusan', 'Model Referensi', 'ID Metadata Terkait'],
  'Layanan': ['ID', 'Nama Layanan', 'Kode Model Referensi Layanan', 'Target Layanan', 'ID Metadata Terkait'],
  'Data dan Informasi': ['ID', 'Nama Data', 'Jenis Data', 'Kode Model Referensi Data', 'ID Metadata Terkait'],
  'Aplikasi': ['ID', 'Nama Aplikasi', 'Kode Model Referensi Aplikasi', 'Layanan yang Didukung', 'Inputan Data', 'Luaran Data', 'Server Aplikasi', 'ID Metadata Terkait'],
  'Komputasi Awan': ['ID', 'Nama Government Cloud', 'Tipe Government Cloud', 'ID Metadata Terkait'],
  'Perangkat Lunak Platform': ['ID', 'Nama Perangkat Lunak', 'Tipe Perangkat Lunak', 'ID Metadata Terkait'],
  'Perangkat Keras Media Storage': ['ID', 'Nama Data Storage', 'ID Metadata Terkait'],
  'Perangkat Keras Server': ['ID', 'Nama Server', 'Jenis Penggunaan', 'Perangkat Lunak yang Digunakan', 'ID Metadata Terkait'],
  'Perangkat Keras Jaringan': ['ID', 'Nama Network/Communication Device', 'Tipe Network/Communication Device', 'ID Metadata Terkait'],
  'Perangkat Keras Keamanan': ['ID', 'Nama Security Device', 'Tipe Security Device', 'ID Metadata Terkait'],
  'Perangkat Keras Periferal': ['ID', 'Nama Periferal', 'Tipe Periferal', 'ID Metadata Terkait'],
  'Sistem Penghubung Layanan': ['ID', 'Nama Sistem Penghubung', 'Jenis Sistem Penghubung', 'Nama Jaringan Intra yang digunakan', 'Aplikasi yang dihubungkan', 'ID Metadata Terkait'],
  'Jaringan Intra': ['ID', 'Nama Jaringan', 'Jenis Jaringan', 'ID Metadata Terkait'],
  'Fasilitas Komputasi': ['ID', 'Nama Fasilitas', 'Kode Model Referensi SPBE', 'ID Metadata Terkait'],
  'Standar Teknis dan Prosedur': ['ID', 'Nama Standar Keamanan', 'Jenis Standar Keamanan', 'ID Metadata Terkait'],
  'Edukasi Kesadaran Keamanan': ['ID', 'Nama Kegiatan Edukasi Kesadaran Keamanan SPBE', 'ID Metadata Terkait'],
  'Kerentanan keamanan': ['ID', 'Nama Kegiatan Identifikasi Kerentanan Keamanan SPBE', 'ID Metadata Terkait'],
  'Peningkatan Keamanan': ['ID', 'Nama Kegiatan Peningkatan Keamanan SPBE', 'ID Metadata Terkait'],
  'Penanganan Insiden Keamanan': ['ID', 'Nama Kegiatan Penanganan Insiden Keamanan SPBE', 'ID Metadata Terkait'],
  'Audit Keamanan': ['ID', 'Nama Kegiatan Audit Keamanan SPBE', 'Jenis Audit Keamanan SPBE', 'ID Metadata Terkait'],
  'Kelaikan Keamanan': ['ID', 'Nama Kegiatan Kelaikan Keamanan SPBE', 'ID Metadata Terkait']
};

const archimateMap = {
  'Proses Bisnis': { type: 'Business Process', nameAttr: 'Nama Bisnis/Urusan' },
  'Layanan': { type: 'Business Service', nameAttr: 'Nama Layanan' },
  'Data dan Informasi': { type: 'Data Object', nameAttr: 'Nama Data', suffixAttr: 'Jenis Data' },
  'Aplikasi': { type: 'Application Component', nameAttr: 'Nama Aplikasi' },
  // 'Pengguna': { type: 'Business Actor', nameAttr: 'Target Layanan' },
  'Komputasi Awan': { type: 'Node', nameAttr: 'Nama Government Cloud', suffixAttr: 'Tipe Government Cloud' },
  'Perangkat Lunak Platform': { type: 'System Software', nameAttr: 'Nama Perangkat Lunak', suffixAttr: 'Tipe Perangkat Lunak' },
  'Perangkat Keras Media Storage': { type: 'Device', nameAttr: 'Nama Data Storage' },
  'Perangkat Keras Server': { type: 'Node', nameAttr: 'Nama Server', suffixAttr: 'Jenis Penggunaan' },
  'Perangkat Keras Jaringan': { type: 'Device', nameAttr: 'Nama Network/Communication Device', suffixAttr: 'Tipe Network/Communication Device' },
  'Perangkat Keras Keamanan': { type: 'Device', nameAttr: 'Nama Security Device', suffixAttr: 'Tipe Security Device' },
  'Perangkat Keras Periferal': { type: 'Device', nameAttr: 'Nama Periferal', suffixAttr: 'Tipe Periferal' },
  'Sistem Penghubung Layanan': { type: 'Technology Service', nameAttr: 'Nama Sistem Penghubung', suffixAttr: 'Jenis Sistem Penghubung' },
  'Jaringan Intra': { type: 'Communication Network', nameAttr: 'Nama Jaringan', suffixAttr: 'Jenis Jaringan' },
  'Fasilitas Komputasi': { type: 'Facility', nameAttr: 'Nama Fasilitas' },
  'Standar Teknis dan Prosedur': { type: 'Principle', nameAttr: 'Nama Standar Keamanan', suffixAttr: 'Jenis Standar Keamanan' },
  'Edukasi Kesadaran Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Edukasi Kesadaran Keamanan SPBE' },
  'Kerentanan keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Identifikasi Kerentanan Keamanan SPBE' },
  'Peningkatan Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Peningkatan Keamanan SPBE' },
  'Penanganan Insiden Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Penanganan Insiden Keamanan SPBE' },
  'Audit Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Audit Keamanan SPBE', suffixAttr: 'Jenis Audit Keamanan SPBE' },
  'Kelaikan Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Kelaikan Keamanan SPBE' },
};

let globalData = {}; // Global JSON
let archimateElements = []; // Global ArchiMate data

exports.archimateStructured = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const workbook = xlsx.readFile(req.file.path);
  globalData = {};
  archimateElements = [];

  const groups = {
    "Group Platform": [],
    "Group Sistem Integrasi": [],
    "Group Keamanan": []
  };

  const groupTypes = {
    "Group Platform": [
      'Komputasi Awan',
      'Perangkat Lunak Platform',
      'Perangkat Keras Server',
      'Perangkat Keras Media Storage',
      'Perangkat Keras Keamanan',
      'Perangkat Keras Jaringan',
      'Perangkat Keras Periferal'
    ],
    "Group Sistem Integrasi": [
      'Sistem Penghubung Layanan',
      'Jaringan Intra'
    ],
    "Group Keamanan": [
      'Standar Teknis dan Prosedur',
      'Edukasi Kesadaran Keamanan',
      'Kerentanan keamanan',
      'Peningkatan Keamanan',
      'Penanganan Insiden Keamanan',
      'Audit Keamanan',
      'Kelaikan Keamanan'
    ]
  };

  const IdsRelation = [
    [['Proses Bisnis', 'Layanan'], 'Realization'],
    [['Proses Bisnis', 'Data dan Informasi'], 'Access'],
    [['Layanan', 'Aplikasi'], 'Serving'],
    [['Pengguna Layanan', 'Aplikasi'], 'Serving'],
    [['Aplikasi', 'Komputasi Awan'], 'Assignment'],
    [['Data dan Informasi', 'Komputasi Awan'], 'Access'],
    [['Komputasi Awan', 'Perangkat Lunak Platform'], 'Assignment'],
    [['Perangkat Lunak Platform', 'Perangkat Keras Server'], 'Assignment'],
    [['Perangkat Keras Keamanan', 'Komputasi Awan'], 'Association'],
    [['Perangkat Keras Keamanan', 'Perangkat Lunak Platform'], 'Association'],
    [['Perangkat Keras Keamanan', 'Perangkat Keras Server'], 'Association'],
    [['Perangkat Keras Keamanan', 'Perangkat Keras Jaringan'], 'Association'],
    [['Perangkat Keras Keamanan', 'Perangkat Keras Media Penyimpanan'], 'Association'],
    [['Perangkat Keras Jaringan', 'Perangkat Lunak Platform'], 'Association'],
    [['Perangkat Keras Jaringan', 'Perangkat Keras Server'], 'Association'],
    [['Perangkat Keras Jaringan', 'Perangkat Keras Periferal'], 'Association'],
    [['Perangkat Keras Jaringan', 'Perangkat Keras Media Penyimpanan'], 'Association'],
    [['Perangkat Keras Periferal', 'Perangkat Lunak Platform'], 'Association'],
    [['Perangkat Keras Periferal', 'Perangkat Keras Server'], 'Association'],
    [['Perangkat Keras Periferal', 'Perangkat Keras Media Penyimpanan'], 'Association'],
    [['Perangkat Keras Media Penyimpanan', 'Perangkat Lunak Platform'], 'Association'],
    [['Perangkat Keras Media Penyimpanan', 'Perangkat Keras Server'], 'Association'],
  ];

  const specialRelation = [
    [['Group Sistem Integrasi', 'Aplikasi'], 'Serving'],
    [['Group Sistem Integrasi', 'Data dan Informasi'], 'Access'],
    [['Group Sistem Integrasi', 'Fasilitas Komputasi'], 'Assignment'],
    [['Group Sistem Integrasi', 'Komputasi Awan'], 'Assignment'],
    [['Group Platform', 'Fasilitas Komputasi'], 'Assignment'],
    [['Group Keamanan', 'Perangkat Keras Keamanan'], 'Influence'],
    [['Group Keamanan', 'Fasilitas Komputasi'], 'Influence'],
    [['Group Keamanan', 'Data dan Informasi'], 'Influence'],
    [['Group Keamanan', 'Aplikasi'], 'Influence'],
    [['Group Keamanan', 'Group Sistem Integrasi'], 'Influence']
  ];

  const getRelType = (meta1, type1, meta2, type2) => {
    for (const [[a, b], rel] of IdsRelation) {
      if (
        (meta1 === a && meta2 === b) ||
        (meta1 === b && meta2 === a) ||
        (type1 === a && meta2 === b) ||
        (meta1 === a && type2 === b) ||
        (type1 === a && type2 === b) ||
        (type1 === b && type2 === a)
      ) {
        return rel;
      }
    }
    return 'Association'; // Default fallback
  };

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

  Object.entries(globalData).forEach(([sheet, items]) => {
    items.forEach(item => {
      const id = item['ID'];
      const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
      relatedIds.forEach(relId => {
        const source = elementMap[id];
        const target = elementMap[relId];
        if (!source || !target) return
        const pairKey = [source.id, target.id].sort().join('|');
        if (!relationSet.has(pairKey)) {
          relationSet.add(pairKey);
          relations.push({
            name: getRelType(source.metadata, source.type, target.metadata, target.type),
            ids: [
              {
                id,
                metadata: source.metadata,
                type: source.type
              },
              {
                id: relId,
                metadata: target.metadata,
                type: target.type
              }
            ]
          });
        }
      });
    });
  });

  for (const [[fromGroup, toType], relType] of specialRelation) {
    const fromIsGroup = fromGroup.startsWith('Group ');
    const toIsGroup = toType.startsWith('Group ');

    const fromList = fromIsGroup
      ? [{ id: fromGroup, metadata: 'Group', type: 'Group' }]
      : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === fromGroup);

    const toList = toIsGroup
      ? [{ id: toType, metadata: 'Group', type: 'Group' }]
      : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === toType);

    fromList.forEach(source => {
      toList.forEach(target => {
        const pairKey = [source.id, target.id].sort().join('|');
        if (!relationSet.has(pairKey)) {
          relationSet.add(pairKey);
          relations.push({
            name: relType,
            ids: [
              {
                id: source.id,
                metadata: source.metadata,
                type: source.type
              },
              {
                id: target.id,
                metadata: target.metadata,
                type: target.type
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


const IdsRelation = [
  [['Proses Bisnis', 'Layanan'], 'Realization'],
  [['Proses Bisnis', 'Data dan Informasi'], 'Access'],
  [['Layanan', 'Aplikasi'], 'Serving'],
  [['Pengguna Layanan', 'Aplikasi'], 'Serving'],
  [['Aplikasi', 'Komputasi Awan'], 'Assignment'],
  [['Data dan Informasi', 'Komputasi Awan'], 'Access'],
  [['Komputasi Awan', 'Perangkat Lunak Platform'], 'Assignment'],
  [['Perangkat Lunak Platform', 'Perangkat Keras Server'], 'Assignment'],
  [['Perangkat Keras Keamanan', 'Komputasi Awan'], 'Association'],
  [['Perangkat Keras Keamanan', 'Perangkat Lunak Platform'], 'Association'],
  [['Perangkat Keras Keamanan', 'Perangkat Keras Server'], 'Association'],
  [['Perangkat Keras Keamanan', 'Perangkat Keras Jaringan'], 'Association'],
  [['Perangkat Keras Keamanan', 'Perangkat Keras Media Penyimpanan'], 'Association'],
  [['Perangkat Keras Jaringan', 'Perangkat Lunak Platform'], 'Association'],
  [['Perangkat Keras Jaringan', 'Perangkat Keras Server'], 'Association'],
  [['Perangkat Keras Jaringan', 'Perangkat Keras Periferal'], 'Association'],
  [['Perangkat Keras Jaringan', 'Perangkat Keras Media Penyimpanan'], 'Association'],
  [['Perangkat Keras Periferal', 'Perangkat Lunak Platform'], 'Association'],
  [['Perangkat Keras Periferal', 'Perangkat Keras Server'], 'Association'],
  [['Perangkat Keras Periferal', 'Perangkat Keras Media Penyimpanan'], 'Association'],
  [['Perangkat Keras Media Penyimpanan', 'Perangkat Lunak Platform'], 'Association'],
  [['Perangkat Keras Media Penyimpanan', 'Perangkat Keras Server'], 'Association'],
];

const specialRelation = [
  [['Group Sistem Integrasi', 'Aplikasi'], 'Serving'],
  [['Group Sistem Integrasi', 'Data dan Informasi'], 'Access'],
  [['Group Sistem Integrasi', 'Fasilitas Komputasi'], 'Assignment'],
  [['Group Sistem Integrasi', 'Komputasi Awan'], 'Assignment'],
  [['Group Platform', 'Fasilitas Komputasi'], 'Assignment'],
  [['Group Keamanan', 'Perangkat Keras Keamanan'], 'Influence'],
  [['Group Keamanan', 'Fasilitas Komputasi'], 'Influence'],
  [['Group Keamanan', 'Data dan Informasi'], 'Influence'],
  [['Group Keamanan', 'Aplikasi'], 'Influence'],
  [['Group Keamanan', 'Group Sistem Integrasi'], 'Influence']
];

const plantumlEncoder = require('plantuml-encoder');
exports.generateDiagram = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    globalData = {};
    archimateElements = [];

    const groups = {
      "Group Platform": [],
      "Group Sistem Integrasi": [],
      "Group Keamanan": []
    };

    const groupTypes = {
      "Group Platform": [
        'Komputasi Awan',
        'Perangkat Lunak Platform',
        'Perangkat Keras Server',
        'Perangkat Keras Media Storage',
        'Perangkat Keras Keamanan',
        'Perangkat Keras Jaringan',
        'Perangkat Keras Periferal'
      ],
      "Group Sistem Integrasi": [
        'Sistem Penghubung Layanan',
        'Jaringan Intra'
      ],
      "Group Keamanan": [
        'Standar Teknis dan Prosedur',
        'Edukasi Kesadaran Keamanan',
        'Kerentanan keamanan',
        'Peningkatan Keamanan',
        'Penanganan Insiden Keamanan',
        'Audit Keamanan',
        'Kelaikan Keamanan'
      ]
    };

    const getRelType = (meta1, type1, meta2, type2) => {
      for (const [[a, b], rel] of IdsRelation) {
        if (
          (meta1 === a && meta2 === b) ||
          (meta1 === b && meta2 === a) ||
          (type1 === a && meta2 === b) ||
          (meta1 === a && type2 === b) ||
          (type1 === a && type2 === b) ||
          (type1 === b && type2 === a)
        ) {
          return rel;
        }
      }
      return 'Association'; // Default fallback
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

    Object.entries(globalData).forEach(([sheet, items]) => {
      items.forEach(item => {
        const id = item['ID'];
        const relatedIds = (item['ID Metadata Terkait'] || '').split(',').map(s => s.trim()).filter(Boolean);
        relatedIds.forEach(relId => {
          const source = elementMap[id];
          const target = elementMap[relId];
          if (!source || !target) return
          const pairKey = [source.id, target.id].sort().join('|');
          if (!relationSet.has(pairKey)) {
            relationSet.add(pairKey);
            relations.push({
              name: getRelType(source.metadata, source.type, target.metadata, target.type),
              ids: [
                {
                  id,
                  metadata: source.metadata,
                  type: source.type
                },
                {
                  id: relId,
                  metadata: target.metadata,
                  type: target.type
                }
              ]
            });
          }
        });
      });
    });

    for (const [[fromGroup, toType], relType] of specialRelation) {
      const fromIsGroup = fromGroup.startsWith('Group ');
      const toIsGroup = toType.startsWith('Group ');

      const fromList = fromIsGroup
        ? [{ id: fromGroup, metadata: 'Group', type: 'Group' }]
        : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === fromGroup);

      const toList = toIsGroup
        ? [{ id: toType, metadata: 'Group', type: 'Group' }]
        : [...archimateElements, ...Object.values(groups)].flat().filter(e => e.metadata === toType);

      fromList.forEach(source => {
        toList.forEach(target => {
          const pairKey = [source.id, target.id].sort().join('|');
          if (!relationSet.has(pairKey)) {
            relationSet.add(pairKey);
            relations.push({
              name: relType,
              ids: [
                {
                  id: source.id,
                  metadata: source.metadata,
                  type: source.type
                },
                {
                  id: target.id,
                  metadata: target.metadata,
                  type: target.type
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

    const umlCode = generatePlantUML(elements, relations);

    // 3. Encode syntax untuk render diagram
    const encodedUml = plantumlEncoder.encode(umlCode);
    res.render('diagram', {
      umlCode,
      encodedUml
    });

    // Opsional: Hapus file setelah diproses
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error('Error generating diagram:', err);
    res.status(500).send('Terjadi kesalahan saat memproses file Excel.');
  }
};

function generatePlantUML(elements, relations) {
  const lines = [];
  lines.push('@startuml');
  lines.push('skinparam nodesep 50');
  lines.push('skinparam ranksep 40');
  // lines.push('left to right direction'); 
  lines.push('!include <archimate/Archimate>');

  const spriteElementMap = {
    'Business Process': { type: '$bProcess', sprite: 'archimate/business-process' },
    'Business Service': { type: '$bService', sprite: 'archimate/business-service' },
    'Business Actor': { type: '$bActor', sprite: 'archimate/business-actor' },
    'Application Component': { type: '$aComponent', sprite: 'archimate/application-component' },
    'Data Object': { type: '$aData', sprite: 'archimate/application-data-object' },
    'Node': { type: '$tNode', sprite: 'archimate/technology-node' },
    'Device': { type: '$tDevice', sprite: 'archimate/technology-device' },
    'System Software': { type: '$tSoftware', sprite: 'archimate/technology-system-software' },
    'Technology Service': { type: '$tService', sprite: 'archimate/technology-service' },
    'Communication Network': { type: '$tComm', sprite: 'archimate/technology-communication-network' },
    'Facility': { type: '$tFacility', sprite: 'archimate/physical-facility' },
    'Principle': { type: '$mPrinciple', sprite: 'archimate/motivation-principle' },
    'Requirement': { type: '$mRequirement', sprite: 'archimate/motivation-requirement' }
  };

  const hierarchyOrder = [
    'Business Process',
    'Business Service',
    'Business Actor',
    'Data Object',
    'Application Component',
    'Group Sistem Integrasi',
    'Facility',
    'Group Platform',
    'Group Keamanan'
  ];

  const layerMap = {
    'Business Process': 'Business',
    'Business Service': 'Business',
    'Business Actor': 'Business',
    'Application Component': 'Application',
    'Data Object': 'Application',
    'Node': 'Technology',
    'Device': 'Technology',
    'System Software': 'Technology',
    'Technology Service': 'Technology',
    'Communication Network': 'Technology',
    'Facility': 'Technology',
    'Principle': 'Motivation',
    'Requirement': 'Motivation'
  };

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
        lines.push(`package "${type}" as ${groupId} {`);
        for (const el of matchingElements) {
          const sprite = spriteElementMap[el.type]?.type || '';
                const layer = layerMap[el.type] || '';
          lines.push(`  rectangle "${el.name}\\n-\\n[${el.metadata}]" as ${sanitizeId(el.id)} <<${sprite}>> #${layer}`);
        }
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

  const relMacroMap = {
    'Triggering': 'Rel_Triggering',
    'Specialization': 'Rel_Specialization',
    'Serving': 'Rel_Serving',
    'Realization': 'Rel_Realization',
    'Influence': 'Rel_Influence',
    'Flow': 'Rel_Flow',
    'Composition': 'Rel_Composition',
    'Association_dir': 'Rel_Association_dir',
    'Association': 'Rel_Association',
    'Assignment': 'Rel_Assignment',
    'Aggregation': 'Rel_Aggregation',
    'Access': 'Rel_Access_rw',
    'Access_r': 'Rel_Access_r',
    'Access_w': 'Rel_Access_w',
    'Access_rw': 'Rel_Access_rw'
  };

  function getElementTypeById(allElements, id) {
    for (const key of Object.keys(allElements)) {
      for (const el of allElements[key]) {
        if (sanitizeId(el.id) === sanitizeId(id)) {
          return key.startsWith('Group') ? key : el.type;
        }
      }
    }
    return '';
  }

  lines.push("' === Relationships ===");
  for (const rel of relations) {
    const [rawFrom, rawTo] = rel.ids;
    const fromId = sanitizeId(rawFrom);
    const toId = sanitizeId(rawTo);
    const relType = rel.name;
    const macroBase = relMacroMap[relType] || `Rel_${relType}`;

    const fromType = getElementTypeById(elements, rawFrom);
    const toType = getElementTypeById(elements, rawTo);

    const fromOrder = getOrderIndex(fromType);
    const toOrder = getOrderIndex(toType);

    let direction = '';
    if (fromType === 'Group Keamanan' && toType === 'Group Sistem Integrasi') {
        direction = 'Up'; // Relasi antara grup ini seharusnya selalu Up
    } else if (fromOrder < toOrder) {
        direction = 'Down';
    } else if (fromOrder > toOrder) {
        direction = 'Up';
    } else {
        direction = 'Down';
    }

    const macro = `${macroBase}_${direction}`;
    lines.push(`${macro}(${fromId}, ${toId}, "${relType}")`);
  }

  lines.push('');
  lines.push('legend left');
  lines.push('Element Legend');
  lines.push('==============');

  const labelMap = {
    'Business Process': 'Business Process',
    'Business Service': 'Business Service',
    'Business Actor': 'Business Actor',
    'Application Component': 'Application Component',
    'Data Object': 'Application Data',
    'Node': 'Technology Node',
    'Device': 'Technology Device',
    'System Software': 'System Software',
    'Technology Service': 'Technology Service',
    'Communication Network': 'Communication Network',
    'Facility': 'Facility',
    'Principle': 'Security Principle',
    'Requirement': 'Security Requirement',
  };

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
