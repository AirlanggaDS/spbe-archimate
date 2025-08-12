
const archimateMap = {
    'Proses Bisnis': { type: 'Business Process', nameAttr: 'Nama Bisnis/Urusan', nameAttr: 'Nama Bisnis/Urusan' },
    'Layanan': { type: 'Business Service', nameAttr: 'Nama Layanan' },
    'Data dan Informasi': { type: 'Data Object', nameAttr: 'Nama Data', suffixAttr: 'Jenis Data' },
    'Aplikasi': { type: 'Application Component', nameAttr: 'Nama Aplikasi' },
    'Komputasi Awan': { type: 'Node', nameAttr: 'Nama Government Cloud', suffixAttr: 'Tipe Government Cloud' },
    'Perangkat Lunak Platform': { type: 'System Software', nameAttr: 'Nama Perangkat Lunak', suffixAttr: 'Tipe Perangkat Lunak' },
    'Perangkat Keras Media Storage': { type: 'Device', nameAttr: 'Nama Data Storage' },
    'Perangkat Keras Server': { type: 'Node', nameAttr: 'Nama Server', suffixAttr: 'Jenis Penggunaan' },
    'Perangkat Keras Jaringan': { type: 'Communication Network', nameAttr: 'Nama Network/Communication Device', suffixAttr: 'Tipe Network/Communication Device' },
    'Perangkat Keras Keamanan': { type: 'Device', nameAttr: 'Nama Security Device', suffixAttr: 'Tipe Security Device' },
    'Perangkat Keras Periferal': { type: 'Device', nameAttr: 'Nama Periferal', suffixAttr: 'Tipe Periferal' },
    'Sistem Penghubung Layanan': { type: 'Technology Collaboration', nameAttr: 'Nama Sistem Penghubung', suffixAttr: 'Jenis Sistem Penghubung' },
    'Jaringan Intra': { type: 'Communication Network', nameAttr: 'Nama Jaringan', suffixAttr: 'Jenis Jaringan' },
    'Fasilitas Komputasi': { type: 'Facility', nameAttr: 'Nama Fasilitas' },
    'Standar Teknis dan Prosedur': { type: 'Requirement', nameAttr: 'Nama Standar Keamanan', suffixAttr: 'Jenis Standar Keamanan' },
    'Edukasi Kesadaran Keamanan': { type: 'Meaning', nameAttr: 'Nama Kegiatan Edukasi Kesadaran Keamanan SPBE' },
    'Kerentanan keamanan': { type: 'Assessment', nameAttr: 'Nama Kegiatan Identifikasi Kerentanan Keamanan SPBE' },
    'Peningkatan Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Peningkatan Keamanan SPBE' },
    'Penanganan Insiden Keamanan': { type: 'Requirement', nameAttr: 'Nama Kegiatan Penanganan Insiden Keamanan SPBE' },
    'Audit Keamanan': { type: 'Assessment', nameAttr: 'Nama Kegiatan Audit Keamanan SPBE', suffixAttr: 'Jenis Audit Keamanan SPBE' },
    'Kelaikan Keamanan': { type: 'Assessment', nameAttr: 'Nama Kegiatan Kelaikan Keamanan SPBE' },
};

const IdsRelation = [
    { types: ['Proses Bisnis', 'Layanan'], source: 'Proses Bisnis', target: 'Layanan', relation: 'Realization' },
    { types: ['Proses Bisnis', 'Data dan Informasi'], source: 'Proses Bisnis', target: 'Data dan Informasi', relation: 'Access' },
    { types: ['Pengguna Layanan', 'Aplikasi'], source: 'Aplikasi', target: 'Pengguna Layanan', relation: 'Serving' },
    { types: ['Layanan', 'Aplikasi'], source: 'Aplikasi', target: 'Layanan', relation: 'Serving' },
    { types: ['Aplikasi', 'Komputasi Awan'], source: 'Aplikasi', target: 'Komputasi Awan', relation: 'Assignment' },
    { types: ['Data dan Informasi', 'Komputasi Awan'], source: 'Data dan Informasi', target: 'Komputasi Awan', relation: 'Access' },
    { types: ['Komputasi Awan', 'Perangkat Lunak Platform'], source: 'Komputasi Awan', target: 'Perangkat Lunak Platform', relation: 'Serving' },
    { types: ['Perangkat Lunak Platform', 'Perangkat Keras Server'], source: 'Perangkat Keras Server', target: 'Perangkat Lunak Platform', relation: 'Assignment' },
    { types: ['Perangkat Keras Keamanan', 'Komputasi Awan'], source: 'Perangkat Keras Keamanan', target: 'Komputasi Awan', relation: 'Association' },
    { types: ['Perangkat Keras Keamanan', 'Perangkat Lunak Platform'], source: 'Perangkat Keras Keamanan', target: 'Perangkat Lunak Platform', relation: 'Association' },
    { types: ['Perangkat Keras Keamanan', 'Perangkat Keras Server'], source: 'Perangkat Keras Keamanan', target: 'Perangkat Keras Server', relation: 'Association' },
    { types: ['Perangkat Keras Keamanan', 'Perangkat Keras Jaringan'], source: 'Perangkat Keras Keamanan', target: 'Perangkat Keras Jaringan', relation: 'Association' },
    { types: ['Perangkat Keras Keamanan', 'Perangkat Keras Media Storage'], source: 'Perangkat Keras Keamanan', target: 'Perangkat Keras Media Storage', relation: 'Association' },
    { types: ['Perangkat Keras Jaringan', 'Perangkat Lunak Platform'], source: 'Perangkat Keras Jaringan', target: 'Perangkat Lunak Platform', relation: 'Association' },
    { types: ['Perangkat Keras Jaringan', 'Perangkat Keras Server'], source: 'Perangkat Keras Jaringan', target: 'Perangkat Keras Server', relation: 'Association' },
    { types: ['Perangkat Keras Jaringan', 'Perangkat Keras Periferal'], source: 'Perangkat Keras Jaringan', target: 'Perangkat Keras Periferal', relation: 'Association' },
    { types: ['Perangkat Keras Jaringan', 'Perangkat Keras Media Storage'], source: 'Perangkat Keras Jaringan', target: 'Perangkat Keras Media Storage', relation: 'Association' },
    { types: ['Perangkat Keras Periferal', 'Perangkat Lunak Platform'], source: 'Perangkat Keras Periferal', target: 'Perangkat Lunak Platform', relation: 'Association' },
    { types: ['Perangkat Keras Periferal', 'Perangkat Keras Server'], source: 'Perangkat Keras Periferal', target: 'Perangkat Keras Server', relation: 'Association' },
    { types: ['Perangkat Keras Periferal', 'Perangkat Keras Media Storage'], source: 'Perangkat Keras Periferal', target: 'Perangkat Keras Media Storage', relation: 'Association' },
    { types: ['Perangkat Keras Media Storage', 'Perangkat Lunak Platform'], source: 'Perangkat Keras Media Storage', target: 'Perangkat Lunak Platform', relation: 'Serving' },
    { types: ['Perangkat Keras Media Storage', 'Perangkat Keras Server'], source: 'Perangkat Keras Media Storage', target: 'Perangkat Keras Server', relation: 'Access' },
    { types: ['Sistem Penghubung Layanan', 'Jaringan Intra'], source: 'Jaringan Intra', target: 'Sistem Penghubung Layanan', relation: 'Serving' }
];

const specialRelation = [
    { types: ['Group Sistem Integrasi', 'Aplikasi'], source: 'Group Sistem Integrasi', target: 'Aplikasi', relation: 'Serving' },
    { types: ['Group Sistem Integrasi', 'Data dan Informasi'], source: 'Group Sistem Integrasi', target: 'Data dan Informasi', relation: 'Access' },
    { types: ['Group Sistem Integrasi', 'Fasilitas Komputasi'], source: 'Fasilitas Komputasi', target: 'Group Sistem Integrasi', relation: 'Assignment' },
    { types: ['Group Sistem Integrasi', 'Komputasi Awan'], source: 'Group Sistem Integrasi', target: 'Komputasi Awan', relation: 'Serving' },
    { types: ['Group Platform', 'Fasilitas Komputasi'], source: 'Fasilitas Komputasi', target: 'Group Platform', relation: 'Assignment' },
    { types: ['Group Keamanan', 'Perangkat Keras Keamanan'], source: 'Group Keamanan', target: 'Perangkat Keras Keamanan', relation: 'Realization' },
    { types: ['Group Keamanan', 'Fasilitas Komputasi'], source: 'Group Keamanan', target: 'Fasilitas Komputasi', relation: 'Realization' },
    { types: ['Group Keamanan', 'Data dan Informasi'], source: 'Group Keamanan', target: 'Data dan Informasi', relation: 'Realization' },
    { types: ['Group Keamanan', 'Aplikasi'], source: 'Group Keamanan', target: 'Aplikasi', relation: 'Realization' },
    { types: ['Group Keamanan', 'Group Sistem Integrasi'], source: 'Group Keamanan', target: 'Group Sistem Integrasi', relation: 'Realization' }
];

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

const spriteElementMap = {
    'Business Process': { type: '$bProcess', sprite: 'archimate/business-process' },
    'Business Service': { type: '$bService', sprite: 'archimate/business-service' },
    'Business Actor': { type: '$bActor', sprite: 'archimate/business-actor' },
    'Application Component': { type: '$aComponent', sprite: 'archimate/application-component' },
    'Data Object': { type: '$aData', sprite: 'archimate/application-data-object' },
    'Node': { type: '$tNode', sprite: 'archimate/technology-node' },
    'Device': { type: '$tDevice', sprite: 'archimate/technology-device' },
    'System Software': { type: '$tSoftware', sprite: 'archimate/technology-system-software' },
    'Technology Collaboration': { type: '$tCollaboration', sprite: 'archimate/technology-collaboration' },
    'Communication Network': { type: '$tComm', sprite: 'archimate/technology-communication-network' },
    'Facility': { type: '$tFacility', sprite: 'archimate/physical-facility' },
    'Assessment': { type: '$mAssessment', sprite: 'archimate/motivation-assessment' },
    'Requirement': { type: '$mRequirement', sprite: 'archimate/motivation-requirement' },
    'Meaning': { type: '$mMeaning', sprite: 'archimate/motivation-meaning' }
};

const hierarchyOrder = [
    'Business Process',
    'Business Service',
    'Business Actor',
    'Data Object',
    'Application Component',
    'Group Sistem Integrasi',
    'Group Platform',
    'Facility',
    'Group Keamanan'
];

const platformPosition = {
    'Komputasi Awan': { x: 0, y: 0 }, // A1
    'Perangkat Keras Jaringan': { x: 0, y: 1 }, // A2
    'Perangkat Keras Keamanan': { x: 0, y: 2 }, // A3
    'Perangkat Lunak Platform': { x: 1, y: 0 }, // B1
    'Perangkat Keras Server': { x: 1, y: 2 }, // B3
    'Perangkat Keras Media Storage': { x: 2, y: 0 }, // C1
    'Perangkat Keras Periferal': { x: 2, y: 2 }, // C3
};



const layerMap = {
    'Business Process': 'Business',
    'Business Service': 'Business',
    'Business Actor': 'Business',
    'Application Component': 'Application',
    'Data Object': 'Application',
    'Node': 'Technology',
    'Device': 'Technology',
    'System Software': 'Technology',
    'Technology Collaboration': 'Technology',
    'Communication Network': 'Technology',
    'Facility': 'Technology',
    'Meaning': 'Motivation',
    'Assessment': 'Motivation',
    'Requirement': 'Motivation',
    'Group Sistem Integrasi': 'Technology',
    'Group Platform': 'Technology',
    'Group Keamanan': 'Motivation',
};

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

const labelMap = {
    'Business Process': 'Business Process',
    'Business Service': 'Business Service',
    'Business Actor': 'Business Actor',
    'Application Component': 'Application Component',
    'Data Object': 'Application Data',
    'Node': 'Technology Node',
    'Device': 'Technology Device',
    'System Software': 'System Software',
    'Technology Collaboration': 'Technology Collaboration',
    'Communication Network': 'Communication Network',
    'Facility': 'Facility',
    'Meaning': 'Meaning',
    'Assessment': 'Assessment',
    'Requirement': 'Requirement',
};

module.exports = { archimateMap, IdsRelation, specialRelation, groupTypes, spriteElementMap, hierarchyOrder, layerMap, relMacroMap, labelMap, platformPosition };