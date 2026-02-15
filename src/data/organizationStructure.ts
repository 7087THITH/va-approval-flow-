// Organization structure for approver selection
// Based on the actual department hierarchy

export interface OrgNode {
  id: string;
  name: string;
  type: 'function' | 'division' | 'group' | 'subgroup';
  children?: OrgNode[];
}

export const organizationStructure: OrgNode[] = [
  {
    id: 'scm',
    name: 'SUPPLY CHAIN MANAGEMENT FUNCTION',
    type: 'function',
    children: [
      {
        id: 'ppd',
        name: 'PARTS PROCUREMENT DIVISION',
        type: 'division',
        children: [
          {
            id: 'nmg',
            name: 'NEW MODEL GROUP',
            type: 'group',
            children: [
              { id: 'nms', name: 'NEW MODEL SUB-GROUP', type: 'subgroup' },
            ],
          },
          {
            id: 'pp1g',
            name: 'PARTS PROCUREMENT 1 GROUP',
            type: 'group',
            children: [
              { id: 'pp1s', name: 'PARTS PROCUREMENT 1 SUB-GROUP', type: 'subgroup' },
            ],
          },
          {
            id: 'pp2g',
            name: 'PARTS PROCUREMENT 2 GROUP',
            type: 'group',
            children: [
              { id: 'pp2s', name: 'PARTS PROCUREMENT 2 SUB-GROUP', type: 'subgroup' },
            ],
          },
          {
            id: 'pp3g',
            name: 'PARTS PROCUREMENT 3 GROUP',
            type: 'group',
            children: [
              { id: 'pp3s', name: 'PARTS PROCUREMENT 3 SUB-GROUP', type: 'subgroup' },
            ],
          },
          {
            id: 'psg',
            name: 'PROCUREMENT STRATEGY GROUP',
            type: 'group',
            children: [
              { id: 'pss', name: 'PROCUREMENT STRATEGY SUB-GROUP', type: 'subgroup' },
              { id: 'va_team', name: 'VA TEAM', type: 'subgroup' },
            ],
          },
          {
            id: 'spcg',
            name: 'SUSTAINABLE PROCUREMENT CONTROL GROUP',
            type: 'group',
            children: [
              { id: 'pcs', name: 'PROCUREMENT COLLABORATION SUB-GROUP', type: 'subgroup' },
              { id: 'spc1s', name: 'SUSTAINABLE PROCUREMENT CONTROL 1 SUB-GROUP', type: 'subgroup' },
              { id: 'spc2g', name: 'SUSTAINABLE PROCUREMENT CONTROL 2 GROUP', type: 'subgroup' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rrd',
    name: 'REGIONAL RESEARCH & DEVELOPMENT FUNCTION',
    type: 'function',
    children: [
      {
        id: 'qcd',
        name: 'QUALITY CONTROL DIVISION',
        type: 'division',
      },
      {
        id: 'rdd',
        name: 'RESEARCH & DEVELOPMENT DIVISION',
        type: 'division',
        children: [
          { id: 'dcg', name: 'DEVELOPMENT CENTER GROUP', type: 'group' },
          { id: 'dcipc', name: 'DEVELOPMENT COMPLIANCE & INTELLECTUAL PROPERTY CONTROL GROUP', type: 'group' },
          { id: 'dcpg', name: 'DEVELOPMENT OF COMMERCIAL PRODUCT GROUP', type: 'group' },
          { id: 'dceg', name: 'DEVELOPMENT OF COMPREHENSIVE ENGINEERING GROUP', type: 'group' },
          { id: 'ddg', name: 'DEVELOPMENT OF DEVICE GROUP', type: 'group' },
          { id: 'dntg', name: 'DEVELOPMENT OF NEW TECHNOLOGY GROUP', type: 'group' },
          { id: 'dprg', name: 'DEVELOPMENT OF PRODUCT RELIABILITY GROUP', type: 'group' },
          { id: 'drpg', name: 'DEVELOPMENT OF RESIDENTIAL PRODUCT GROUP', type: 'group' },
          { id: 'dppg', name: 'DEVELOPMENT PRODUCT PLANNING GROUP', type: 'group' },
        ],
      },
    ],
  },
];

// Flatten all nodes for searching
export function flattenOrgNodes(nodes: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = [];
  function walk(list: OrgNode[]) {
    for (const node of list) {
      result.push(node);
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

// Get all group/subgroup IDs (leaf-level selectable units)
export function getSelectableGroups(nodes: OrgNode[]): OrgNode[] {
  return flattenOrgNodes(nodes).filter(n => n.type === 'group' || n.type === 'subgroup');
}
