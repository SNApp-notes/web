import type { TreeNode } from '@/types/tree';

export const sampleData: TreeNode[] = [
  {
    id: '1',
    name: 'Personal',
    type: 'category',
    children: [
      {
        id: '2',
        name: 'Goals',
        type: 'category',
        children: [
          {
            id: '3',
            name: '2024 Objectives',
            type: 'note',
            content: 'Learn React, build a side project...',
            createdAt: new Date('2024-01-01'),
            parentId: '2'
          },
          {
            id: '4',
            name: 'Health Goals',
            type: 'note',
            content: 'Exercise 3x per week, eat healthier...',
            createdAt: new Date('2024-01-15'),
            parentId: '2'
          }
        ],
        createdAt: new Date('2024-01-01'),
        parentId: '1'
      },
      {
        id: '5',
        name: 'Shopping List',
        type: 'note',
        content: 'Milk, bread, eggs, apples...',
        createdAt: new Date('2024-02-01'),
        parentId: '1'
      }
    ],
    createdAt: new Date('2024-01-01')
  },
  {
    id: '6',
    name: 'Work',
    type: 'category',
    children: [
      {
        id: '7',
        name: 'Projects',
        type: 'category',
        children: [
          {
            id: '8',
            name: 'Website Redesign',
            type: 'note',
            content: 'Requirements: Modern design, responsive, fast loading...',
            createdAt: new Date('2024-02-10'),
            parentId: '7'
          },
          {
            id: '9',
            name: 'API Integration',
            type: 'note',
            content: 'Connect to third-party API for user authentication...',
            createdAt: new Date('2024-02-15'),
            parentId: '7'
          }
        ],
        createdAt: new Date('2024-02-01'),
        parentId: '6'
      },
      {
        id: '10',
        name: 'Meeting Notes',
        type: 'note',
        content: 'Team standup: Discussed sprint goals and blockers...',
        createdAt: new Date('2024-02-20'),
        parentId: '6'
      }
    ],
    createdAt: new Date('2024-02-01')
  },
  {
    id: '11',
    name: 'Ideas',
    type: 'category',
    children: [
      {
        id: '12',
        name: 'App Concepts',
        type: 'note',
        content: 'Idea 1: Task management app with AI assistance...',
        createdAt: new Date('2024-03-01'),
        parentId: '11'
      },
      {
        id: '13',
        name: 'Blog Topics',
        type: 'note',
        content: 'React best practices, TypeScript tips, Web performance...',
        createdAt: new Date('2024-03-05'),
        parentId: '11'
      }
    ],
    createdAt: new Date('2024-03-01')
  }
];
