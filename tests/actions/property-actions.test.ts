import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ count: 0 }]),
  query: {
    projects: {
      findMany: vi.fn(),
    },
    files: {
      findMany: vi.fn(),
    },
    states: {
      findMany: vi.fn(),
    },
    regions: {
      findMany: vi.fn(),
    },
    areas: {
      findMany: vi.fn(),
    },
    amenities: {
      findMany: vi.fn(),
    },
    tags: {
      findMany: vi.fn(),
    },
    projectLayouts: {
      findMany: vi.fn(),
    }
  }
}));

vi.mock('@/db', () => ({
  db: dbMock
}));

// Now import implementation
import { getProperties } from '@/app/actions/property-actions';

describe('getProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    dbMock.select.mockReturnThis();
    dbMock.from.mockReturnThis();
    dbMock.where.mockResolvedValue([{ count: 0 }]);

    // Default empty returns for lookups
    dbMock.query.projects.findMany.mockResolvedValue([]);
    dbMock.query.files.findMany.mockResolvedValue([]);
    dbMock.query.states.findMany.mockResolvedValue([]);
    dbMock.query.regions.findMany.mockResolvedValue([]);
    dbMock.query.areas.findMany.mockResolvedValue([]);
    dbMock.query.amenities.findMany.mockResolvedValue([]);
    dbMock.query.tags.findMany.mockResolvedValue([]);
    dbMock.query.projectLayouts.findMany.mockResolvedValue([]);
  });

  it('should return empty result when no projects exist', async () => {
    const result = await getProperties();

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 9,
      totalPages: 0
    });
    // Check if count query was called
    expect(dbMock.select).toHaveBeenCalled();
    // Check if projects query was called
    expect(dbMock.query.projects.findMany).toHaveBeenCalled();
  });

  it('should handle pagination logic', async () => {
    // Mock count = 20
    dbMock.where.mockResolvedValue([{ count: 20 }]);

    // Mock projects for page 2
    const minimalProject = {
      id: '1',
      slug: 'p1',
      name: 'P1',
      developerId: 'd1',
      developer: { name: 'Dev', logoFileId: null },
      propertyCategoryId: 'c1',
      category: { name: 'Cat' },
      propertyTypeId: 't1',
      type: { name: 'Type' },
      projectStatusId: 's1',
      status: { name: 'Status' },
      amenities: [],
      tags: [],
      featuredFileId: null,
      areaId: null,
      regionId: null,
      latitude: null,
      longitude: null,
      totalUnits: 10,
      launchYear: 2024,
      isHotDeal: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Desc',
      address: 'Addr',
      city: 'City',
      displayName: 'Display P1',
      tenureTypeId: null,
    };

    dbMock.query.projects.findMany.mockResolvedValue([minimalProject]);

    const result = await getProperties({ page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(20);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(1);

    // Verify offset calculation
    expect(dbMock.query.projects.findMany).toHaveBeenCalledWith(expect.objectContaining({
      offset: 10, // (2-1) * 10
      limit: 10
    }));
  });
});
