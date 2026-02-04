export const getDemoGreenTreesData = () => {
  return {
    farmName: 'مزرعة الياسمين التجريبية',
    farmNickname: 'حديقة أحلامي',
    treeCount: 25,
    treeType: 'زيتون',
    contractStartDate: '2024-06-01',
    contractDuration: 5,
    nextMaintenanceDate: '2024-12-15',
    generalStatus: {
      overall: 'مطمئنة',
      message: 'أشجارك تمر بمرحلة عناية مستمرة',
      healthLevel: 'ممتاز',
      careStage: 'رعاية نشطة'
    },
    maintenanceRecords: [
      {
        id: 'demo-m1',
        maintenance_type: 'pruning',
        maintenance_date: '2024-11-20',
        status: 'published',
        description: 'قص وتشذيب الأغصان',
        cost_per_tree: 35,
        total_amount: 875,
        client_tree_count: 25,
        client_due_amount: 875,
        payment_status: 'pending',
        priority: 1,
        images: [
          'https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg'
        ],
        videos: []
      },
      {
        id: 'demo-m2',
        maintenance_type: 'fertilization',
        maintenance_date: '2024-11-10',
        status: 'published',
        description: 'تسميد عضوي متوازن',
        cost_per_tree: 40,
        total_amount: 1000,
        client_tree_count: 25,
        client_due_amount: 1000,
        payment_status: 'paid',
        priority: 1,
        images: [
          'https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg'
        ],
        videos: []
      },
      {
        id: 'demo-m3',
        maintenance_type: 'irrigation',
        maintenance_date: '2024-10-25',
        status: 'published',
        description: 'ري منتظم وعناية يومية',
        cost_per_tree: 30,
        total_amount: 750,
        client_tree_count: 25,
        client_due_amount: 750,
        payment_status: 'paid',
        priority: 1,
        images: [
          'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg'
        ],
        videos: []
      },
      {
        id: 'demo-m4',
        maintenance_type: 'pest_control',
        maintenance_date: '2024-09-15',
        status: 'published',
        description: 'مكافحة الآفات الموسمية',
        cost_per_tree: 45,
        total_amount: 1125,
        client_tree_count: 25,
        client_due_amount: 1125,
        payment_status: 'paid',
        priority: 2,
        images: [
          'https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg'
        ],
        videos: []
      },
      {
        id: 'demo-m5',
        maintenance_type: 'soil_improvement',
        maintenance_date: '2024-08-20',
        status: 'published',
        description: 'تحسين جودة التربة',
        cost_per_tree: 50,
        total_amount: 1250,
        client_tree_count: 25,
        client_due_amount: 1250,
        payment_status: 'paid',
        priority: 2,
        images: [
          'https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg'
        ],
        videos: []
      }
    ],
    totalPaid: 4125,
    totalPending: 875,
    nextPaymentDue: '2024-12-10',
    growthProgress: 45,
    healthStatus: 'ممتاز',
    estimatedHarvestDate: '2025-03-15'
  };
};

export const getDemoGoldenTreesData = () => {
  return {
    farmName: 'مزرعة النخيل الاستثمارية',
    farmNickname: 'استثماري الذهبي',
    treeCount: 50,
    treeType: 'نخيل',
    contractStartDate: '2024-01-01',
    contractDuration: 10,
    totalInvested: 75000,
    currentValue: 82500,
    roi: 10,
    expectedAnnualReturn: 15,
    nextDividendDate: '2025-01-01',
    maintenanceRecords: [
      {
        id: 'demo-inv-m1',
        maintenance_type: 'periodic',
        maintenance_date: '2024-11-01',
        status: 'published',
        description: 'صيانة دورية متقدمة',
        cost_per_tree: 80,
        total_amount: 4000,
        client_tree_count: 50,
        client_due_amount: 4000,
        payment_status: 'pending',
        images: [
          'https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg'
        ],
        videos: []
      },
      {
        id: 'demo-inv-m2',
        maintenance_type: 'pruning',
        maintenance_date: '2024-10-01',
        status: 'published',
        description: 'تقليم وتشذيب',
        cost_per_tree: 60,
        total_amount: 3000,
        client_tree_count: 50,
        client_due_amount: 3000,
        payment_status: 'paid',
        images: [
          'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg'
        ],
        videos: []
      }
    ],
    analytics: {
      monthlyGrowth: [
        { month: 'يناير', value: 72000 },
        { month: 'فبراير', value: 73500 },
        { month: 'مارس', value: 75000 },
        { month: 'أبريل', value: 76500 },
        { month: 'مايو', value: 78000 },
        { month: 'يونيو', value: 79500 },
        { month: 'يوليو', value: 81000 },
        { month: 'أغسطس', value: 82500 }
      ],
      projectedValue: 95000,
      riskLevel: 'منخفض',
      dividendHistory: [
        { date: '2024-01-01', amount: 3750, status: 'paid' },
        { date: '2024-07-01', amount: 3900, status: 'paid' },
        { date: '2025-01-01', amount: 4050, status: 'pending' }
      ]
    },
    totalPaid: 3000,
    totalPending: 4000,
    expansionOpportunities: [
      {
        id: 'demo-exp-1',
        title: 'توسعة النخيل الملكي',
        description: 'إضافة 25 نخلة من النوع الملكي',
        cost: 40000,
        expectedReturn: 18,
        duration: 10,
        status: 'available'
      }
    ]
  };
};

export const isDemoAction = (action: string): boolean => {
  const demoActions = [
    'pay',
    'confirm',
    'execute',
    'save',
    'update',
    'delete',
    'expand',
    'invest',
    'withdraw',
    'transfer'
  ];

  return demoActions.includes(action.toLowerCase());
};

export const getMaintenanceTypePriority = (type: string): number => {
  const priorities: Record<string, number> = {
    'pruning': 1,
    'fertilization': 2,
    'irrigation': 3,
    'pest_control': 4,
    'seasonal_pruning': 5,
    'soil_improvement': 6,
    'periodic': 7,
    'emergency': 8
  };

  return priorities[type] || 99;
};

export const getMaintenanceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'pruning': '🌿 قص',
    'fertilization': '🌱 تسميد',
    'irrigation': '💧 ري',
    'pest_control': '🛡️ مكافحة آفات',
    'seasonal_pruning': '✂️ تقليم موسمي',
    'soil_improvement': '🌍 تحسين تربة',
    'periodic': '🔄 صيانة دورية',
    'emergency': '⚠️ صيانة طارئة'
  };

  return labels[type] || type;
};

export const sortMaintenanceRecordsByPriority = (records: any[]): any[] => {
  return [...records].sort((a, b) => {
    const priorityA = getMaintenanceTypePriority(a.maintenance_type);
    const priorityB = getMaintenanceTypePriority(b.maintenance_type);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime();
  });
};
